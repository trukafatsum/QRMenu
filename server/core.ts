import { readRecord } from './menu-repository';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

export const COOKIE = 'qrmenu_session';
export const TTL = 8 * 60 * 60;
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function storeName(context: Context) {
  if (context.deploy.context === 'production') return 'qrmenu-production';
  return `qrmenu-preview-${context.deploy.id || 'local'}`;
}
export const storage = (context: Context) => getStore({ name: storeName(context), consistency: 'strong' });
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers } });
}
export function sameOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin;
}
export async function body(request: Request, max = 512000) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new Error('JSON_REQUIRED');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('INVALID_BODY');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function verifyPassword(password: string, hash: string) {
  const [salt, expected] = hash.split(':');
  if (!/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(expected || '')) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(expected, 'hex'));
}
export function credentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || !hash || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash)) return null;
  return { email, hash, version: digest(email + hash) };
}
export async function account(context: Context) {
  const bootstrap = credentials();
  if (!bootstrap) return null;
  const record = await readRecord(storage(context), 'account');
  const saved = record?.data as { email: string; hash: string; bootstrap: string } | undefined;
  const config = saved?.bootstrap === bootstrap.version ? { email: saved.email, hash: saved.hash, version: digest(saved.email + saved.hash) } : bootstrap;
  return { ...config, bootstrap: bootstrap.version, etag: record?.etag };
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function token(request: Request) {
  const value = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export function cookie(request: Request, value: string, age: number) {
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export async function authenticated(request: Request, context: Context) {
  const key = token(request);
  const config = await account(context);
  if (!key || !config) return false;
  const session = await storage(context).get(`sessions/${digest(key)}`, { type: 'json' }) as { expires: number; version: string } | null;
  return !!session && session.expires > Date.now() && session.version === config.version;
}
export const newToken = () => randomBytes(32).toString('hex');
