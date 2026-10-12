import type { storage } from './core';

type Store = ReturnType<typeof storage>;
export async function readMenu(store: Store) {
  const current = await store.getWithMetadata('menu', { type: 'json' });
  if (!current || current.etag) return current;
  // Some Netlify Dev versions omit GET ETags, although list/conditional PUT
  // support them. Bracket the read with matching versions; never call an
  // existing entry "initial", and never use an unguarded write as a fallback.
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = (await store.list({ prefix: 'menu' })).blobs.find(blob => blob.key === 'menu')?.etag;
    const value = await store.getWithMetadata('menu', { type: 'json' });
    const after = (await store.list({ prefix: 'menu' })).blobs.find(blob => blob.key === 'menu')?.etag;
    if (value && before && before === after) return { ...value, etag: after };
  }
  throw new Error('Menu revision could not be read consistently');
}
