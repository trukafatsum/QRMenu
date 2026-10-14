import { beforeEach, describe, expect, it, vi } from 'vitest';
import { scryptSync } from 'node:crypto';
import type { Context } from '@netlify/functions';

const memory = vi.hoisted(() => new Map<string, { data: unknown; etag: string }>());
const emulator = vi.hoisted(() => ({ missingGetETag: false }));
vi.mock('@netlify/blobs', () => ({ getStore: ({ name }: { name: string }) => ({
  get: async (key: string) => memory.get(name + '/' + key)?.data ?? null,
  getWithMetadata: async (key: string) => { const entry = memory.get(name + '/' + key); return entry ? { ...entry, etag: emulator.missingGetETag ? undefined : entry.etag } : null; },
  list: async () => ({ blobs: [...memory.entries()].filter(([key]) => key.startsWith(name + '/')).map(([key, value]) => ({ key: key.slice(name.length + 1), etag: value.etag })) }),
  delete: async (key: string) => { memory.delete(name + '/' + key); },
  setJSON: async (key: string, data: unknown, options: { onlyIfNew?: boolean; onlyIfMatch?: string } = {}) => {
    const old = memory.get(name + '/' + key);
    if ((options.onlyIfNew && old) || (options.onlyIfMatch && old?.etag !== options.onlyIfMatch)) return { modified: false };
    const etag = crypto.randomUUID(); memory.set(name + '/' + key, { data: structuredClone(data), etag });
    return { modified: true, etag };
  },
}) }));
import auth from '../netlify/functions/auth';
import menu from '../netlify/functions/menu';
import { cookie, digest, storeName, verifyPassword } from '../server/core';
import { menuSchema } from '../server/schema';
import { initialMenuData } from '../src/data';

const context = { deploy: { context: 'production', id: 'deploy-1' } } as Context;
const password = 'test-password-123456';
const salt = 'a'.repeat(32);
const hash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
function request(path: string, method = 'GET', data?: unknown, session = '', origin = 'https://menu.example') {
  return new Request('https://menu.example' + path, { method, headers: { 'content-type': 'application/json', origin, cookie: session }, body: data === undefined ? undefined : JSON.stringify(data) });
}
async function login() {
  const result = await auth(request('/api/login', 'POST', { email: 'admin@example.com', password }), context);
  expect(result.status).toBe(200);
  return result.headers.get('set-cookie')!.split(';')[0];
}
beforeEach(() => {
  emulator.missingGetETag = false;
  memory.clear(); process.env.ADMIN_EMAIL = 'admin@example.com'; process.env.ADMIN_PASSWORD_HASH = hash;
});
describe('Authentication and authorization', () => {
  it('rejects wrong credentials and unconfigured accounts', async () => {
    expect((await auth(request('/api/login', 'POST', { email: 'admin@example.com', password: 'wrong' }), context)).status).toBe(401);
    delete process.env.ADMIN_PASSWORD_HASH;
    expect((await auth(request('/api/login', 'POST', {}), context)).status).toBe(503);
  });
  it('blocks anonymous admin reads and writes, including direct function access', async () => {
    expect((await menu(request('/api/admin-menu'), context)).status).toBe(401);
    expect((await menu(request('/.netlify/functions/menu', 'PUT', {}), context)).status).toBe(401);
  });
  it('validates session, rejects forgery, and revokes on logout', async () => {
    const session = await login();
    expect(await (await auth(request('/api/session', 'GET', undefined, session), context)).json()).toEqual({ authenticated: true });
    expect(await (await auth(request('/api/session', 'GET', undefined, 'qrmenu_session=' + 'b'.repeat(64)), context)).json()).toEqual({ authenticated: false });
    await auth(request('/api/logout', 'POST', undefined, session), context);
    expect(await (await auth(request('/api/session', 'GET', undefined, session), context)).json()).toEqual({ authenticated: false });
  });
  it('expires sessions and invalidates them after password changes', async () => {
    const session = await login();
    const key = 'qrmenu-demo-production/sessions/' + digest(session.split('=')[1]);
    const record = memory.get(key)!;
    record.data = { ...(record.data as object), expires: Date.now() - 1 };
    expect((await menu(request('/api/admin-menu', 'GET', undefined, session), context)).status).toBe(401);
    const next = await login(); process.env.ADMIN_PASSWORD_HASH = `${salt}:${'b'.repeat(128)}`;
    expect((await menu(request('/api/admin-menu', 'GET', undefined, next), context)).status).toBe(401);
  });
  it('blocks cross-origin login, logout and menu updates', async () => {
    expect((await auth(request('/api/login', 'POST', {}, '', 'https://evil.example'), context)).status).toBe(403);
    const session = await login();
    expect((await auth(request('/api/logout', 'POST', {}, session, 'https://evil.example'), context)).status).toBe(403);
    expect((await menu(request('/api/admin-menu', 'PUT', {}, session, 'https://evil.example'), context)).status).toBe(403);
  });
  it('uses HttpOnly, Secure, SameSite cookies and safe password comparison', () => {
    expect(cookie(request('/'), 'abc', 10)).toContain('HttpOnly; SameSite=Strict; Max-Age=10; Secure');
    expect(verifyPassword(password, hash)).toBe(true); expect(verifyPassword('bad', hash)).toBe(false);
    expect(verifyPassword(password, 'malformed')).toBe(false);
  });
});
describe('Persistent menu', () => {
  it('recovers missing GET ETags without mistaking existing data for the initial menu', async () => {
    const session = await login();
    await menu(request('/api/admin-menu', 'PUT', { menu: initialMenuData, revision: 'initial' }, session), context);
    emulator.missingGetETag = true;
    const loaded = await (await menu(request('/api/admin-menu', 'GET', undefined, session), context)).json();
    expect(loaded.revision).not.toBe('initial');
    loaded.menu.items[0].price = 321.5;
    expect((await menu(request('/api/admin-menu', 'PUT', loaded, session), context)).status).toBe(200);
    const again = await (await menu(request('/api/admin-menu', 'GET', undefined, session), context)).json();
    expect(again.menu.items[0].price).toBe(321.5);
    expect(again.revision).not.toBe(loaded.revision);
  });
  it('saves and reads changes, keeps private responses out of shared caches', async () => {
    const session = await login();
    const changed = structuredClone(initialMenuData); changed.items[0].price = 99.5;
    const saved = await menu(request('/api/admin-menu', 'PUT', { menu: changed, revision: 'initial' }, session), context);
    expect(saved.status).toBe(200); expect(saved.headers.get('cache-control')).toBe('no-store');
    const result = await menu(request('/api/menu'), context);
    expect((await result.json()).menu.items[0].price).toBe(99.5);
    expect(result.headers.get('netlify-cdn-cache-control')).toContain('s-maxage=60');
    expect((await menu(request('/api/admin-menu', 'GET', undefined, session), context)).headers.get('cache-control')).toBe('no-store');
  });
  it('rejects stale saves instead of overwriting another editor', async () => {
    const session = await login();
    const save = (revision: string) => menu(request('/api/admin-menu', 'PUT', { menu: initialMenuData, revision }, session), context);
    const first = await (await save('initial')).json();
    expect((await save('initial')).status).toBe(409);
    expect((await save(first.revision)).status).toBe(200);
    expect((await save(first.revision)).status).toBe(409);
  });
  it('isolates preview data from production', () => {
    expect(storeName(context)).toBe('qrmenu-demo-production');
    expect(storeName({ deploy: { context: 'deploy-preview', id: '123' } } as Context)).toBe('qrmenu-demo-preview-123');
  });
  it('validates prices, URL schemes, duplicate IDs and category references', () => {
    expect(menuSchema.safeParse(initialMenuData).success).toBe(true);
    for (const change of [
      (m: typeof initialMenuData) => { m.items[0].price = -1; },
      (m: typeof initialMenuData) => { m.restaurant.mapsUrl = 'javascript:alert(1)'; },
      (m: typeof initialMenuData) => { m.items[0].categoryId = 'missing'; },
      (m: typeof initialMenuData) => { m.items[1].id = m.items[0].id; },
    ]) { const changed = structuredClone(initialMenuData); change(changed); expect(menuSchema.safeParse(changed).success).toBe(false); }
  });
  it('rejects malformed and oversized requests', async () => {
    const session = await login();
    expect((await menu(request('/api/admin-menu', 'PUT', {}, session), context)).status).toBe(400);
    expect((await menu(request('/api/admin-menu', 'PUT', { x: 'a'.repeat(512001) }, session), context)).status).toBe(400);
  });
  it('accepts Instagram username, @username and full profile URL, plus empty optional fields', () => {
    for (const instagram of ['ornek.demo', '@ornek.demo', 'https://www.instagram.com/ornek.demo/?igsh=test', 'instagram.com/ornek.demo/']) {
      const input = structuredClone(initialMenuData);
      Object.assign(input.restaurant, { instagram, mapsUrl: '', coverImage: '' });
      input.items[0].image = '/img/products/kola.jpg';
      const result = menuSchema.parse(input);
      expect(result.restaurant.instagram).toBe('ornek.demo');
      expect(result.items[0].image).toBe('/img/products/kola.jpg');
    }
  });
  it('returns Turkish field-specific errors instead of raw regex messages', async () => {
    const session = await login(); const input = structuredClone(initialMenuData);
    input.restaurant.instagram = 'hatalı profil!';
    const response = await menu(request('/api/admin-menu', 'PUT', { menu: input, revision: 'initial' }, session), context);
    expect(response.status).toBe(400);
    const result = await response.json();
    expect(result.error).toContain('Instagram:'); expect(result.error).not.toContain('Invalid string');
    expect(result.fields[0].field).toBe('restaurant.instagram');
  });
  it('keeps prices and images alongside categories and restaurant edits after logging in again', async () => {
    const session = await login(); const input = structuredClone(initialMenuData);
    input.categories[0].name = 'Yiyecekler'; input.items[0].price = 159.5; input.items[0].image = '/img/products/kumru.jpg';
    input.restaurant.instagram = 'https://instagram.com/demo_menu/';
    expect((await menu(request('/api/admin-menu', 'PUT', { menu: input, revision: 'initial' }, session), context)).status).toBe(200);
    await auth(request('/api/logout', 'POST', undefined, session), context);
    const next = await login();
    const result = await (await menu(request('/api/admin-menu', 'GET', undefined, next), context)).json();
    expect(result.menu.items[0]).toMatchObject({ price: 159.5, image: '/img/products/kumru.jpg' });
    expect(result.menu.categories[0].name).toBe('Yiyecekler');
    expect(result.menu.restaurant.instagram).toBe('demo_menu');
  });
});

describe('Account changes', () => {
  it('requires authentication, same origin and the current password', async () => {
    const data = { username: 'owner', currentPassword: password, newPassword: 'new-password-12345' };
    expect((await auth(request('/api/account', 'POST', data), context)).status).toBe(401);
    const session = await login();
    expect((await auth(request('/api/account', 'POST', data, session, 'https://evil.example'), context)).status).toBe(403);
    expect((await auth(request('/api/account', 'POST', { ...data, currentPassword: 'wrong' }, session), context)).status).toBe(400);
    expect((await auth(request('/api/account', 'POST', { ...data, newPassword: 'short' }, session), context)).status).toBe(400);
    expect(memory.has('qrmenu-demo-production/account')).toBe(false);
  });
  it('persists a hashed password, revokes every old session and supports env recovery', async () => {
    const first = await login(); const second = await login();
    const nextPassword = 'new-password-12345';
    expect((await auth(request('/api/account', 'POST', { username: 'Owner', currentPassword: password, newPassword: nextPassword }, first), context)).status).toBe(200);
    expect(JSON.stringify(memory.get('qrmenu-demo-production/account'))).not.toContain(nextPassword);
    expect((await menu(request('/api/admin-menu', 'GET', undefined, second), context)).status).toBe(401);
    expect((await auth(request('/api/login', 'POST', { email: 'admin@example.com', password }), context)).status).toBe(401);
    const logged = await auth(request('/api/login', 'POST', { email: 'owner', password: nextPassword }), { ...context, deploy: { ...context.deploy, id: 'new-deploy' } } as Context);
    expect(logged.status).toBe(200);
    const session = logged.headers.get('set-cookie')!.split(';')[0];
    emulator.missingGetETag = true;
    expect((await auth(request('/api/account', 'POST', { username: 'owner2', currentPassword: nextPassword, newPassword: '' }, session), context)).status).toBe(200);
    expect((await auth(request('/api/login', 'POST', { email: 'owner2', password: nextPassword }), context)).status).toBe(200);
    process.env.ADMIN_EMAIL = 'recovery@example.com';
    expect((await auth(request('/api/login', 'POST', { email: 'recovery@example.com', password }), context)).status).toBe(200);
  });
});

it('starts the demo without exposing a previous business menu', async () => {
  memory.set('qrmenu-production/menu', { data: { restaurant: { name: 'Former business', phone: 'private' } }, etag: 'legacy' });
  const response = await menu(request('/api/menu'), context);
  const result = await response.json();
  expect(result.menu.restaurant.name).toBe('Örnek Mutfak');
  expect(result.menu.restaurant.isDemo).toBe(true);
  for (const field of ['address', 'phone', 'hours', 'wifiPassword', 'instagram', 'mapsUrl']) expect(result.menu.restaurant[field].length).toBeGreaterThan(0);
  expect(JSON.stringify(result)).not.toContain('Former business');
});
