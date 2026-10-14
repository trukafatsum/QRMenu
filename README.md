# QR Menü Demo

Gerçek bir işletmeye ait bilgi veya fotoğraf içermeyen örnek dijital menü. Ürün ve fiyatlar tanıtım amaçlıdır. Adres, telefon, sosyal hesap ve Wi-Fi alanları boştur. Yönetim paneliyle içerik düzenlenebilir.

## Teknolojiler

- React 18, TypeScript, Vite 8
- Tailwind CSS 3, özel CSS, Lucide ikonları
- Netlify Functions (Node.js 22), Netlify Blobs
- Zod 4 veri doğrulama, qrcode.react 4 QR üretimi
- scrypt şifre özeti, HttpOnly/SameSite oturum çerezi
- Vitest 5, ESLint 9
- GitHub üzerinden Netlify otomatik derleme ve yayın

## Çalıştırma

Node.js 22.12 veya üzeriyle `npm ci`, `npm run admin:setup` çalıştırın. `.env.example` dosyasını `.env` olarak kopyalayıp oluşturulan giriş bilgilerini ekleyin. `npm run dev` sonrasında http://localhost:8888 adresini açın.

Netlify: build `npm run build`, çıktı `dist`. `ADMIN_EMAIL` ve `ADMIN_PASSWORD_HASH` sunucu ortam değişkenleridir. Menü için harici veritabanı gerekmez. QR mevcut sayfanın adresini kullanır; eski `VITE_PUBLIC_MENU_URL` kullanılmaz.

## Demo verileri

Demo `qrmenu-demo-production` deposunu kullanır. Eski `qrmenu-production` deposu okunmaz. Önizlemeler ayrı `qrmenu-demo-preview-<deploy-id>` depolarındadır. Yeni başlangıç verisi yalnızca boş depoda gösterilir. Eski canlı kayıtların fiziksel silinmesi Netlify Blobs üzerinden ayrıca yapılmalıdır; bu kaynak kod değişikliği uzak depoları silmez.

Ürün ve restoran formları Kaydet ile, kategori/silme/sıralama işlemleri doğrudan kaydedilir. Ziyaretçi önbelleği en fazla 60 saniyedir. Restoran Ayarları → Giriş Bilgileri altında mevcut şifre doğrulanarak hesap değiştirilebilir. Demo yeni depo kullandığı için ilk yönetici girişi Netlify ortamındaki başlangıç bilgileriyle yapılır.

## Kontroller

`npm run build`, `npm run lint`, `npm test`.
