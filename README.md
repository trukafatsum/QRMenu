# QRMenu — Netlify Free

Tek restoran için React arayüzü, Netlify Functions API ve Netlify Blobs kalıcı depolama. Harici veritabanı veya Supabase hesabı gerekmez.

## Yerelde çalıştırma

Node.js 22.12 veya üzerini kullanın.

```sh
npm ci
npm run admin:setup
```

`.env.example` dosyasını `.env` olarak kopyalayın. Kurulum komutunun ürettiği `ADMIN_EMAIL` ve `ADMIN_PASSWORD_HASH` değerlerini yerleştirin. Şifreyi komut satırına argüman olarak yazmayın. `.env` dosyasını Git'e eklemeyin.

```sh
npm run dev
```

`http://localhost:8888` adresini açın. Vite'ın 5173 portunu doğrudan kullanmayın; API ve Blobs, Netlify Dev üzerinden çalışır. Yerel veriler `.netlify` altında tutulur. Netlify Dev bağlantı kurulmadan da yerel geliştirmeyi destekler.

## Netlify'da yayınlama

1. Kaynak kodu Git deponuza aktarın ve Netlify'da Free plan ile bağlayın.
2. Deponun kökünde `project` klasörü varsa **Base directory: `project`** seçin. Deponun kökü bu klasörün içeriğiyse boş bırakın.
3. Build command: `npm run build`, Publish directory: `dist`. Functions ayarı `netlify.toml` içinde hazırdır.
4. Netlify ortam değişkenlerine `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` ekleyin (Functions kapsamı). Bunlara `VITE_` öneki eklemeyin.
5. `VITE_PUBLIC_MENU_URL` değerini kalıcı HTTPS menü adresi olarak belirleyin (Build kapsamı). Örnek: `https://restoraniniz.netlify.app`. QR kodları basmadan önce ayarlayın.
6. Yayınlayın; `/#admin` üzerinden giriş yapın. İlk açılış örnek menüyü gösterir. Değişiklik yapıp **Değişiklikleri Yayınla** düğmesine basın. Başka bir cihazdan menüyü kontrol edin.

API'ler Functions olarak paketlendiğinden yalnızca `dist` klasörünü sürükleyip bırakmak yeterli değildir. Git tabanlı tam derleme kullanın.

## Kullanım ve kayıt

- Ürün formundaki **Güncelle ve Yayınla / Ekle ve Yayınla** ve restoran ayarlarındaki **Ayarları Kaydet ve Yayınla** düğmeleri doğrudan sunucuya kaydeder. Başarısız işlem formu kapatmaz ve girilen değerleri korur. Açık diğer taslaklar da aynı kayıtla yayınlanır.
- Kategori ekleme/silme, ürün sıralama ve görünürlük gibi hızlı işlemler taslakta tutulur; üstteki **Değişiklikleri Yayınla** ile kaydedilir. Restoran formundaki alanlar da üstteki yayın düğmesine dahildir.
- Taslaklar henüz sunucuya kaydedilmez; sayfa kapatılmadan önce yayınlanmalı veya JSON yedeği indirilmelidir. Yedek içe aktarma bu sürümde yoktur.
- Başarılı yayın kalıcı Blobs kaydı oluşturur. Menü değişikliği yeni Netlify deploy'u gerektirmez.
- Ziyaretçi API'si CDN'de 60 saniye önbelleklenir. Açık müşteri sayfalarında otomatik sorgulama yoktur; yeni menüyü görmek için yenileyin.
- Eşzamanlı düzenlemede eski sürümle kayıt reddedilir. Taslağı yedekleyin, güncel menüyü yükleyin ve değişiklikleri yeniden uygulayın.
- Üretim menüsü `qrmenu-production` deposundadır ve yeni deploy'larda korunur. Önizlemeler deploy kimliğine göre ayrı depolar kullanır; üretim menüsünü değiştirmez. Önizleme depoları yeni deploy'a taşınmaz.
- Yönetici oturumu 8 saat geçerlidir. Çıkış, sunucudaki oturumu siler. Şifre hash'i değişince önceki oturumlar geçersiz olur. Süresi dolan oturum kayıtları erişim sağlamaz ancak otomatik temizleme henüz yoktur; uzun vadede periyodik bakım yapılabilir.
- Giriş/oturum API'sinde IP ve alan adı başına dakikada 20 istek sınırı vardır. Bu platform kuralının canlı ortamda doğrulanması gerekir.
- Görseller mevcut dış URL'lerden yüklenir. Dosya yükleme bu sürümde yoktur.
- Ürün görsellerinde HTTPS adresi veya `/img/products/kola.jpg` gibi yerel bir dosya yolu kullanılabilir. Boş/kırık görseller için yerel yedek görsel gösterilir. `frontend/img` içindeki ürün fotoğrafları `public/img/products` altında yayınlanır.
- Instagram alanı kullanıcı adı, `@kullanıcıadı` veya tam Instagram profil bağlantısını kabul eder; kullanıcı adına dönüştürerek saklar. Boş isteğe bağlı alanlar kaydı engellemez. Hatalar ilgili alan adıyla Türkçe gösterilir.

## Yeni GuestMenu

`../frontend` referansındaki tam ekran işletme fotoğrafı, Menü/Konum geçişi, koyu panel, sarı/mavi kategori düğmeleri, ürün listesi ve görsel büyütme React bileşenine aktarıldı. Kategoriler, ürünler, fiyatlar, iletişim ve sosyal bağlantılar API verisiyle çalışır; statik `menu.json` çalışma anında okunmaz. Kayıtlı menüler yeni tasarıma geçerken değiştirilmez veya başlangıç verileriyle birleştirilmez.

Arka plan varsayılanı `/img/background/full-bg-c.jpg` dosyasıdır. Restoran ayarlarındaki **Menü arka plan görseli** alanıyla değiştirilebilir. Eski `coverImage` alanı geriye uyumluluk için korunur. Konum haritası kayıtlı adresten üretilir; Yol Tarifi bağlantısı varsa kayıtlı Google Maps URL'sini kullanır.

Netlify Dev'in bazı sürümlerinde okuma yanıtında ETag gelmediğinde sürüm, listeleme verisiyle doğrulanarak okunur. Mevcut kayıt hiçbir zaman `initial` olarak işaretlenmez; sürüm belirlenemezse veri üzerine yazılmaz. İstemcide de eski yükleme yanıtları yeni taslak veya kayıt sonucunu değiştiremez. QR için `VITE_PUBLIC_MENU_URL=pilavcibaba.netlify.app` gibi şemasız alan adları otomatik olarak HTTPS bağlantısına çevrilir.

Bu güncellemede derleme, kod kontrolü ve 22 test başarılıdır. Yerel tarayıcı testinde Instagram profil bağlantısı ve boş isteğe bağlı alanlarla kayıt; fiyat/görsel güncelleme sonrası çıkış–yeniden girişte kalıcılık; mobil taşma kontrolü, görsel büyütme ve Konum paneli doğrulanmıştır. Canlı ortamı güncellemek için değişen kaynakları Netlify'da yeniden deploy edin. `.env` dosyanız ve mevcut Blobs kayıtları bu kod güncellemesiyle değiştirilmez.

## Ücretsiz plan sınırları

12 Ekim 2026 tarihli Netlify fiyatlandırmasına göre yeni kredi tabanlı Free planda ayda 300 kredi bulunur; başarılı üretim deploy'u 15 kredi tüketir. Trafik ve Functions kullanımı da kotaya dahildir. Bu proje düşük kullanım için tasarlanmıştır; sınırsız ücretsiz trafik garantisi vermez. Kota bittiğinde hizmet duraklayabilir. Eski Legacy Free hesaplarının koşulları farklı olabilir. Gerçek hesabınızdaki **Usage & billing** ekranını kontrol edin.

Kaynaklar: https://www.netlify.com/pricing/ ve https://docs.netlify.com/build/data-and-storage/netlify-blobs/

## Kontroller

```sh
npm run build
npm run lint
npm test
npm audit --omit=dev
```

Testler: yetkisiz erişim, hatalı parola, oturum süresi/iptali, kaynak kontrolü, veri doğrulama, kayıt çakışması ve önizleme ayrımı. Testlerde Blobs bellek içi taklitle çalışır; gerçek Netlify hesabı, CDN ve platform hız sınırı için yayın sonrası kontrol ayrıca gerekir.

Yerel Netlify Dev ve gerçek yerel Blobs ile tarayıcıda giriş, kategori seçimi, 99,50 TL fiyatla ürün ekleme, yayınlama, yenileme sonrası kalıcılık ve çıkış sonrası erişim koruması ayrıca doğrulandı. Test hesabı ve test verileri kaynak projeye dahil edilmedi.

Bağımlılık denetimi: üretim paketlerinde bilinen açık bulunmadı. Uyumlu güncellemeler uygulandı; geliştirme araçlarının geçişli bağımlılıklarında 24 bildirim (20 yüksek, 2 orta, 2 düşük) kaldı. Bunlar ağırlıklı olarak Netlify CLI/Tailwind araç zincirindedir; zorunlu sürüm düşürme veya Tailwind ana sürüm geçişi yapan `npm audit fix --force` uygulanmadı. Geliştirme sunucusunu internete açmayın; bu araçlar için düzeltme sürümleri takip edilmelidir.
