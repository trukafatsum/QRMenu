import type { Config, Context } from '@netlify/functions';
import { initialMenuData } from '../../src/data';
import { authenticated, body, json, sameOrigin, storage } from '../../server/core';
import { menuSchema, validationErrors } from '../../server/schema';
import { readMenu } from '../../server/menu-repository';

export default async function handler(request: Request, context: Context) {
  try {
    const admin = new URL(request.url).pathname === '/api/admin-menu';
    if (request.method !== 'GET' && request.method !== 'PUT') return json({ error: 'İşlem desteklenmiyor.' }, 405);
    if ((admin || request.method === 'PUT') && !await authenticated(request, context)) return json({ error: 'Oturum süresi doldu. Yeniden giriş yapın.' }, 401);
    const store = storage(context);
    if (request.method === 'GET') {
      const current = await readMenu(store);
      return json({ menu: current?.data ?? initialMenuData, revision: current?.etag ?? 'initial' }, 200,
        admin ? {} : { 'Cache-Control': 'public, max-age=0, must-revalidate', 'Netlify-CDN-Cache-Control': 'public, s-maxage=60' });
    }
    if (!sameOrigin(request)) return json({ error: 'İstek kaynağı geçersiz.' }, 403);
    let input;
    try { input = await body(request); } catch { return json({ error: 'Menü verisi geçersiz veya çok büyük.' }, 400); }
    const parsed = menuSchema.safeParse(input?.menu);
    if (!parsed.success) {
      const fields = validationErrors(parsed.error);
      return json({ error: fields.map(f => f.message).join('\n'), fields }, 400);
    }
    if (typeof input.revision !== 'string' || !input.revision || input.revision.length > 200) return json({ error: 'Menü sürümü gerekli.' }, 400);
    const result = await store.setJSON('menu', parsed.data, input.revision === 'initial' ? { onlyIfNew: true } : { onlyIfMatch: input.revision });
    if (!result.modified) return json({ error: 'Menü başka bir oturumda değişti. Taslağınızı yedekleyip güncel menüyü yükleyin.' }, 409);
    return json({ menu: parsed.data, revision: result.etag });
  } catch (error) {
    console.error('Menu failed', error instanceof Error ? error.message : 'unknown');
    return json({ error: 'Menü hizmetine ulaşılamadı. Tekrar deneyin.' }, 503);
  }
}
export const config: Config = { path: ['/api/menu', '/api/admin-menu'] };
