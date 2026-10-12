import type { storage } from './core';

type Store = ReturnType<typeof storage>;
export const readMenu = (store: Store) => readRecord(store, 'menu');
export async function readRecord(store: Store, key: string) {
  const current = await store.getWithMetadata(key, { type: 'json' });
  if (!current || current.etag) return current;
  // Some Netlify Dev versions omit GET ETags, although list/conditional PUT
  // support them. Bracket the read with matching versions; never call an
  // existing entry "initial", and never use an unguarded write as a fallback.
  for (let attempt = 0; attempt < 3; attempt++) {
    const before = (await store.list({ prefix: key })).blobs.find(blob => blob.key === key)?.etag;
    const value = await store.getWithMetadata(key, { type: 'json' });
    const after = (await store.list({ prefix: key })).blobs.find(blob => blob.key === key)?.etag;
    if (value && before && before === after) return { ...value, etag: after };
  }
  throw new Error('Menu revision could not be read consistently');
}
