import { describe, expect, it, vi } from 'vitest';
import { MenuStore } from '../src/menu-store';
import { initialMenuData } from '../src/data';
const copy = () => structuredClone(initialMenuData);
const response = (revision = 'v1') => ({ menu: copy(), revision });
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }

describe('Menu persistence and request ordering', () => {
  it('keeps edited prices and images when a category is saved, including after signing in again', async () => {
    let database = response();
    const api = vi.fn(async (_: string, options?: RequestInit) => {
      if (options?.method === 'PUT') database = { menu: JSON.parse(options.body as string).menu, revision: 'v2' };
      return structuredClone(database);
    });
    const store = new MenuStore(api);
    await store.reload(true);
    store.edit(menu => ({ ...menu, categories: menu.categories.map((c, i) => i === 0 ? { ...c, name: 'Yeni Kategori' } : c), items: menu.items.map((item, i) => i === 0 ? { ...item, price: 129.5, image: '/img/products/kola.jpg' } : item) }));
    expect(await store.publish()).toBe(true);
    const nextSession = new MenuStore(api); await nextSession.reload(true);
    expect(nextSession.getSnapshot().menu.categories[0].name).toBe('Yeni Kategori');
    expect(nextSession.getSnapshot().menu.items[0]).toMatchObject({ price: 129.5, image: '/img/products/kola.jpg' });
  });
  it('ignores a stale public response arriving after a fresh admin response', async () => {
    const old = deferred<ReturnType<typeof response>>();
    const fresh = response('fresh'); fresh.menu.items[0].price = 777;
    const api = vi.fn().mockReturnValueOnce(old.promise).mockResolvedValueOnce(fresh);
    const store = new MenuStore(api);
    const publicLoad = store.reload(); await store.reload(true);
    old.resolve(response('old')); await publicLoad;
    expect(store.getSnapshot().menu.items[0].price).toBe(777);
    expect(store.getSnapshot().revision).toBe('fresh');
  });
  it('ignores in-flight reads after editing or publishing', async () => {
    const old = deferred<ReturnType<typeof response>>();
    const api = vi.fn().mockResolvedValueOnce(response()).mockReturnValueOnce(old.promise).mockImplementationOnce(async (_, options) => ({ menu: JSON.parse(options.body).menu, revision: 'v2' }));
    const store = new MenuStore(api); await store.reload(true);
    const pending = store.reload(true);
    store.edit(menu => ({ ...menu, items: menu.items.map((item, index) => index === 0 ? { ...item, price: 99.5 } : item) }));
    await store.publish(); old.resolve(response()); await pending;
    expect(store.getSnapshot().menu.items[0].price).toBe(99.5);
    expect(store.getSnapshot().dirty).toBe(false);
  });
  it('retains form values and a dirty draft on validation/network failures', async () => {
    const api = vi.fn().mockResolvedValueOnce(response()).mockRejectedValueOnce(new Error('Instagram: Geçerli profil girin.'));
    const store = new MenuStore(api); await store.reload(true);
    const candidate = copy(); candidate.items[0].price = 123.45; candidate.items[0].image = '/img/products/su.jpg';
    expect(await store.publish(candidate)).toBe(false);
    expect(store.getSnapshot()).toMatchObject({ dirty: true, saving: false, error: 'Instagram: Geçerli profil girin.' });
    expect(store.getSnapshot().menu.items[0].price).toBe(123.45);
    await store.reload(true); expect(api).toHaveBeenCalledTimes(2);
  });
  it('uses the exact form candidate for a save without waiting for a React render', async () => {
    const api = vi.fn().mockResolvedValueOnce(response()).mockImplementationOnce(async (_, options) => ({ menu: JSON.parse(options.body).menu, revision: 'v2' }));
    const store = new MenuStore(api); await store.reload(true);
    const candidate = copy(); candidate.restaurant.instagram = 'pilavcibaba'; candidate.items[0].price = 234.5;
    await store.publish(candidate);
    expect(store.getSnapshot().menu).toEqual(candidate);
    expect(store.getSnapshot().dirty).toBe(false);
  });
});

it('saves immediate actions and restores the previous view when a save fails', async () => {
  const transport = vi.fn().mockResolvedValueOnce(response()).mockImplementationOnce(async (_, options) => ({ menu: JSON.parse(options.body).menu, revision: 'v2' })).mockRejectedValueOnce(new Error('Connection failed'));
  const store = new MenuStore(transport); await store.reload(true);
  expect(await store.commit(menu => ({ ...menu, items: menu.items.map(item => ({ ...item, available: false })) }))).toBe(true);
  expect(store.getSnapshot().dirty).toBe(false);
  const previous = store.getSnapshot().menu;
  expect(await store.commit(menu => ({ ...menu, categories: [], items: [] }))).toBe(false);
  expect(store.getSnapshot().menu).toEqual(previous);
  expect(store.getSnapshot().error).toBe('Connection failed');
});
