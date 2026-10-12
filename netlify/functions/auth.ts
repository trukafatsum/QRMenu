import type { Config, Context } from '@netlify/functions';
import { authenticated, body, cookie, account, hashPassword, digest, json, newToken, sameOrigin, storage, token, TTL, verifyPassword } from '../../server/core';

export default async function handler(request: Request, context: Context) {
  try {
    const path = new URL(request.url).pathname;
    if (path === '/api/session' && request.method === 'GET') return json({ authenticated: await authenticated(request, context) });
    if (request.method !== 'POST') return json({ error: 'İşlem desteklenmiyor.' }, 405);
    if (!sameOrigin(request)) return json({ error: 'İstek kaynağı geçersiz.' }, 403);
    if (path === '/api/logout') {
      const key = token(request);
      if (key) await storage(context).delete(`sessions/${digest(key)}`);
      return json({ ok: true }, 200, { 'Set-Cookie': cookie(request, '', 0) });
    }
    if (path === '/api/account') {
      if (!await authenticated(request, context)) return json({ error: 'Lütfen tekrar giriş yapın.' }, 401);
      const current = await account(context);
      if (!current) return json({ error: 'Hesap bulunamadı.' }, 503);
      let input;
      try { input = await body(request, 4096); } catch { return json({ error: 'Geçersiz hesap bilgileri.' }, 400); }
      if (typeof input?.currentPassword !== 'string' || input.currentPassword.length > 256 || !verifyPassword(input.currentPassword, current.hash))
        return json({ error: 'Mevcut şifre hatalı.' }, 400);
      const email = typeof input.username === 'string' ? input.username.trim().toLowerCase() : '';
      if (!/^[a-z0-9][a-z0-9._@+-]{2,127}$/.test(email)) return json({ error: 'Kullanıcı adı 3–128 karakter olmalı; harf, rakam, nokta, @, +, - veya _ kullanın.' }, 400);
      if (typeof input.newPassword !== 'string' || (input.newPassword && (input.newPassword.length < 12 || input.newPassword.length > 256)))
        return json({ error: 'Yeni şifre 12–256 karakter olmalı.' }, 400);
      const hash = hashPassword(input.newPassword || input.currentPassword);
      const result = await storage(context).setJSON('account', { email, hash, bootstrap: current.bootstrap }, current.etag ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
      if (!result.modified) return json({ error: 'Hesap başka bir oturumda değişti. Tekrar giriş yapın.' }, 409);
      const previous = token(request);
      if (previous) await storage(context).delete(`sessions/${digest(previous)}`);
      return json({ ok: true }, 200, { 'Set-Cookie': cookie(request, '', 0) });
    }
    if (path !== '/api/login') return json({ error: 'Bulunamadı.' }, 404);
    const config = await account(context);
    if (!config) return json({ error: 'Yönetici hesabı henüz yapılandırılmadı.' }, 503);
    let input;
    try { input = await body(request, 4096); } catch { return json({ error: 'Geçersiz giriş bilgileri.' }, 400); }
    if (typeof input?.email !== 'string' || typeof input?.password !== 'string' || input.password.length > 256)
      return json({ error: 'Geçersiz giriş bilgileri.' }, 400);
    const valid = verifyPassword(input.password, config.hash);
    if (!valid || input.email.trim().toLowerCase() !== config.email) return json({ error: 'Kullanıcı adı veya şifre hatalı.' }, 401);
    const key = newToken();
    await storage(context).setJSON(`sessions/${digest(key)}`, { expires: Date.now() + TTL * 1000, version: config.version });
    const previous = token(request);
    if (previous) await storage(context).delete(`sessions/${digest(previous)}`);
    return json({ authenticated: true }, 200, { 'Set-Cookie': cookie(request, key, TTL) });
  } catch (error) {
    console.error('Auth failed', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'Oturum hizmetine ulaşılamadı. Tekrar deneyin.' }, 503);
  }
}
export const config: Config = {
  path: ['/api/login', '/api/logout', '/api/session', '/api/account'],
  rateLimit: { action: 'rate_limit', aggregateBy: ['ip', 'domain'], windowLimit: 20, windowSize: 60 },
};
