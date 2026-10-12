import { z } from 'zod';

const text = z.string().trim().max(2000);
const name = z.string().trim().min(1).max(120);
const url = z.string().max(2000).refine(value => {
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}, 'Geçerli bir http/https adresi girin.');
const id = z.string().min(1).max(100);
const order = z.number().int().nonnegative();
const price = z.number().finite().min(0).max(1000000);
export const menuSchema = z.object({
  restaurant: z.object({ name, tagline: text, description: text, coverImage: url,
    logoText: z.string().trim().max(10), address: text, phone: text, hours: text,
    wifiPassword: text, instagram: z.string().max(100).regex(/^[a-zA-Z0-9_.]*$/), mapsUrl: url }),
  categories: z.array(z.object({ id, name, icon: name, sortOrder: order })).max(100),
  items: z.array(z.object({ id, categoryId: id, name, description: text, price,
    oldPrice: price.optional(), image: url, available: z.boolean(), sortOrder: order,
    badges: z.array(z.object({ label: name, type: z.enum(['popular', 'spicy', 'vegetarian', 'new', 'gluten-free']) })).max(10),
  })).max(1000),
}).superRefine((menu, ctx) => {
  const categories = new Set(menu.categories.map(c => c.id));
  if (categories.size !== menu.categories.length || new Set(menu.items.map(i => i.id)).size !== menu.items.length)
    ctx.addIssue({ code: 'custom', message: 'Tekrarlanan kayıt kimliği.' });
  if (menu.items.some(i => !categories.has(i.categoryId)))
    ctx.addIssue({ code: 'custom', message: 'Ürün kategorisi bulunamadı.' });
});
