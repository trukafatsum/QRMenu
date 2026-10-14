import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, QrCode } from 'lucide-react';

export function QRCodeView({ restaurantName }: { restaurantName: string }) {
  const qrRef = useRef<HTMLDivElement | null>(null);
  const menuUrl = window.location.origin + window.location.pathname;
  const safeName = restaurantName.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${restaurantName}-qr-menu.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handlePrint = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${safeName} - QR Menü</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Georgia, serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
            .card { border: 3px solid #d9632a; border-radius: 20px; padding: 40px 60px; text-align: center; }
            .name { font-size: 28px; font-weight: bold; color: #1f1f1f; margin-bottom: 8px; }
            .tagline { font-size: 14px; color: #9a7345; margin-bottom: 24px; letter-spacing: 2px; text-transform: uppercase; }
            .qr { margin: 20px 0; }
            .instruction { font-size: 16px; color: #4f4f4f; margin-top: 16px; }
            .arrow { font-size: 32px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="name">${safeName}</div>
            <div class="tagline">Dijital Menü</div>
            <div class="qr"><img src="${dataUrl}" width="256" height="256" /></div>
            <div class="instruction">Menüyü görüntülemek için QR kodu okutun</div>
            <div class="arrow">📷</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">QR Kod</h1>
      <p className="mt-1 text-sm text-ink-300">QR kodu indirin veya yazdırın, masalara yerleştirin</p>

      <div className="mt-8 flex flex-col items-center">
        <div ref={qrRef} className="rounded-3xl border border-white/10 bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
              <QrCode className="h-6 w-6" />
            </div>
            <p className="font-serif text-xl font-bold text-charcoal-800">{restaurantName}</p>
            <p className="text-xs uppercase tracking-widest text-secondary-500">Dijital Menü</p>
          </div>

          <div className="flex items-center justify-center rounded-2xl bg-cream p-6">
            <QRCodeCanvas
              value={menuUrl}
              size={240}
              fgColor="#1f1f1f"
              bgColor="#faf6f0"
              level="M"
              marginSize={4}
            />
          </div>

          <p className="mt-4 text-center text-xs text-charcoal-400">
            Menü bağlantısı: {menuUrl}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700"
          >
            <Download className="h-4 w-4" />
            PNG İndir
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800/60 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            <Printer className="h-4 w-4" />
            Yazdır
          </button>
        </div>

        <div className="mt-8 max-w-md rounded-2xl border border-accent-400/20 bg-accent-400/10 p-5">
          <h3 className="mb-2 font-semibold text-accent-300">Nasıl kullanılır?</h3>
          <ol className="space-y-2 text-sm text-accent-200/80">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>QR kodu indirin veya yazdırın</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>Masa kartları veya etiketler hazırlayın</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>Misafirler telefon kamerası ile okusun — menü anında açılır</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">4.</span>
              <span>Menüde değişiklik yapsanız bile QR kod aynı kalır</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
