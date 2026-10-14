import { z } from 'zod';

const text = z.string().trim().max(2000);
const name = z.string().trim().min(1).max(120);
const url = z.string().trim().max(2000).refine(value => {
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}, 'Geçerli bir http/https adresi girin.');
const imageUrl = z.string().trim().max(2000).refine(value => {
  if (!value) return true;
  if (/^\/(?!\/)[^\\\s]*$/.test(value)) return true;
  return url.safeParse(value).success;
}, 'https:// ile başlayan bir görsel adresi veya /img/... dosya yolu girin.');
const optionalUrl = z.union([z.literal(''), url]);
const instagram = z.string().trim().max(2000).transform(value => {
  if (!value) return '';
  if (value.startsWith('@')) return value.slice(1);
  try {
    const link = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (['instagram.com', 'www.instagram.com'].includes(link.hostname.toLowerCase()) && /^\/[^/]+\/?$/.test(link.pathname)) return link.pathname.split('/')[1];
  } catch { /* Validate the raw username below. */ }
  return value;
}).pipe(z.string().max(30, 'Instagram kullanıcı adı en fazla 30 karakter olabilir.').regex(/^[a-zA-Z0-9_.]*$/, 'Instagram kullanıcı adı, @kullanıcıadı veya profil bağlantısı girin.'));
const id = z.string().min(1).max(100);
const order = z.number().int().nonnegative();
const price = z.number().finite().min(0).max(1000000);
export const menuSchema = z.object({
  restaurant: z.object({ isDemo: z.boolean().optional(), name, tagline: text, description: text, coverImage: imageUrl,
    backgroundImage: imageUrl.optional(),
    logoText: z.string().trim().max(10), address: text, phone: text, hours: text,
    wifiPassword: text, instagram, mapsUrl: z.string().trim().pipe(optionalUrl) }),
  categories: z.array(z.object({ id, name, icon: name, sortOrder: order })).max(100),
  items: z.array(z.object({ id, categoryId: id, name, description: text, price,
    oldPrice: price.optional(), image: imageUrl, available: z.boolean(), sortOrder: order,
    badges: z.array(z.object({ label: name, type: z.enum(['popular', 'spicy', 'vegetarian', 'new', 'gluten-free']) })).max(10),
  })).max(1000),
}).superRefine((menu, ctx) => {
  const categories = new Set(menu.categories.map(c => c.id));
  if (categories.size !== menu.categories.length || new Set(menu.items.map(i => i.id)).size !== menu.items.length)
    ctx.addIssue({ code: 'custom', message: 'Tekrarlanan kayıt kimliği.' });
  if (menu.items.some(i => !categories.has(i.categoryId)))
    ctx.addIssue({ code: 'custom', message: 'Ürün kategorisi bulunamadı.' });
});

const labels: Record<string, string> = { name: 'Ad', tagline: 'Slogan', description: 'Açıklama', coverImage: 'Kapak görseli', backgroundImage: 'Menü arka planı', logoText: 'Logo metni', address: 'Adres', phone: 'Telefon', hours: 'Çalışma saatleri', wifiPassword: 'Wi-Fi şifresi', instagram: 'Instagram', mapsUrl: 'Harita bağlantısı', price: 'Fiyat', oldPrice: 'Eski fiyat', image: 'Ürün görseli', categoryId: 'Kategori', sortOrder: 'Sıralama', icon: 'Kategori simgesi', label: 'Etiket' };
export function validationErrors(error: z.ZodError) {
  return error.issues.map(issue => {
    const field = issue.path.join('.');
    const label = labels[String(issue.path.at(-1))] || 'Menü';
    const prefix = issue.path[0] === 'items' ? `Ürün ${Number(issue.path[1]) + 1} / ` : issue.path[0] === 'categories' ? `Kategori ${Number(issue.path[1]) + 1} / ` : '';
    let detail = issue.message;
    if (/^(Invalid|Too |Unrecognized)/.test(detail)) {
      detail = issue.code === 'too_big' ? 'İzin verilen uzunluk veya değer sınırı aşıldı.' : issue.code === 'too_small' ? 'Alan boş bırakılamaz veya değer alt sınırın altında.' : 'Girilen değer geçerli değil.';
    }
    return { field, message: `${prefix}${label}: ${detail}` };
  });
}
