import { beforeEach, describe, expect, it, vi } from 'vitest';
import { scryptSync } from 'node:crypto';
import type { Context } from '@netlify/functions';

const memory = vi.hoisted(() => new Map<string, { data: unknown; etag: string }>());
vi.mock('@netlify/blobs', () => ({ getStore: ({ name }: { name: string }) => ({
  get: async (key: string) => memory.get(name + '/' + key)?.data ?? null,
  getWithMetadata: async (key: string) => memory.get(name + '/' + key) ?? null,
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
    const key = 'qrmenu-production/sessions/' + digest(session.split('=')[1]);
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
    expect(storeName(context)).toBe('qrmenu-production');
    expect(storeName({ deploy: { context: 'deploy-preview', id: '123' } } as Context)).toBe('qrmenu-preview-123');
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
});
