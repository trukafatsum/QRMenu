import { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Phone, Clock, Wifi, Instagram, ChevronUp, QrCode } from 'lucide-react';
import { useMenu } from '@/context';
import { BadgeTag, formatPrice } from './Badge';

export function GuestMenu({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  const { restaurant, categories, items } = useMenu();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement | null>(null);

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.sortOrder - b.sortOrder), [categories]);

  useEffect(() => {
    if (sortedCategories.length > 0) {
      setActiveCategory(sortedCategories[0].id);
    }
  }, [sortedCategories]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      const scrollPos = window.scrollY + 140;
      for (const cat of sortedCategories) {
        const el = sectionRefs.current[cat.id];
        if (el && el.offsetTop <= scrollPos && el.offsetTop + el.offsetHeight > scrollPos) {
          setActiveCategory(cat.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sortedCategories]);

  const scrollToCategory = (catId: string) => {
    const el = sectionRefs.current[catId];
    if (el) {
      const navHeight = navRef.current?.offsetHeight ?? 60;
      const top = el.offsetTop - navHeight - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div>
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
              {restaurant.name}
            </h1>
          </div>
          <button
            onClick={onGoToDashboard}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/70 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
          >
            <QrCode className="h-3.5 w-3.5" />
            Yönetim
          </button>
        </div>
      </div>

      {/* Sticky Category Nav */}
      <div
        ref={navRef}
        className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/95 backdrop-blur-md"
      >
        <div className="mx-auto max-w-2xl px-2">
          <div className="no-scrollbar flex gap-1 overflow-x-auto py-3">
            {sortedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-slate-600 text-white shadow-md shadow-slate-600/30'
                    : 'text-ink-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-ink-950/95 py-4 pb-20">
      {/* Menu Sections */}
      <div className="mx-auto max-w-2xl px-4">
        {sortedCategories.map((cat) => {
          const catItems = items
            .filter((i) => i.categoryId === cat.id)
            .sort((a, b) => a.sortOrder - b.sortOrder);

          if (catItems.length === 0) return null;

          return (
            <section
              key={cat.id}
              ref={(el) => {
                sectionRefs.current[cat.id] = el;
              }}
              className="mt-8 animate-fade-in"
            >
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-serif text-2xl font-bold text-white">
                  {cat.name}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-primary-600/40 to-transparent" />
              </div>

              <div className="space-y-3">
                {catItems.map((item, idx) => (
                  <article
                    key={item.id}
                    className="group flex gap-4 rounded-2xl border border-white/5 bg-ink-800/60 p-3 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-primary-600/30 hover:shadow-xl hover:shadow-primary-600/10 sm:p-4"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${idx * 0.08}s both`,
                    }}
                  >
                    {/* Image */}
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                      <img
                        src={item.image}
                        loading="lazy"
                        decoding="async"
                        alt={item.name}
                        className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                          !item.available ? 'grayscale' : ''
                        }`}
                      />
                      {!item.available && (
                        <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70">
                          <span className="rounded-full bg-error/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Tüketilemiyor
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between py-0.5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-serif text-base font-semibold text-white sm:text-lg">
                            {item.name}
                          </h3>
                          {item.badges.map((b, i) => (
                            <BadgeTag key={i} badge={b} />
                          ))}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-300 sm:text-sm">
                          {item.description}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="mt-2 flex items-center gap-2">
                        {item.oldPrice && (
                          <span className="text-sm text-ink-400 line-through">
                            {formatPrice(item.oldPrice)}
                          </span>
                        )}
                        <span className={`font-bold ${item.oldPrice ? 'text-primary-400' : 'text-white'}`}>
                          {formatPrice(item.price)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Restaurant Info Card */}
      <div className="mx-auto mt-12 max-w-2xl px-4">
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-ink-900/60 shadow-lg backdrop-blur-sm">
          <div className="border-b border-white/5 px-6 py-4">
            <h2 className="font-serif text-xl font-bold text-accent-400">Restoran Bilgileri</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Adres" value={restaurant.address} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefon" value={restaurant.phone} />
            <InfoRow icon={<Clock className="h-4 w-4" />} label="Çalışma Saatleri" value={restaurant.hours} />
            <InfoRow icon={<Wifi className="h-4 w-4" />} label="Wi-Fi" value={restaurant.wifiPassword} />
          </div>
          <div className="flex gap-3 border-t border-white/5 px-6 py-4">
            <a
              href={restaurant.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
            >
              <MapPin className="h-4 w-4" />
              Haritada Göster
            </a>
            <a
              href={`https://instagram.com/${restaurant.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </a>
          </div>
        </div>
      </div>
      </div>

      {/* Footer */}
        <div className="mx-auto max-w-2xl px-4 py-4 text-center">
          <p className="mt-3 text-xs text-ink-400">
            QR Menü ile dijital olarak sunulmuştur
          </p>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-sky-600 to-transparent" />
        </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-slate-600 text-white shadow-lg shadow-slate-600/40 transition-all hover:bg-slate-700 hover:shadow-xl animate-scale-in"
          aria-label="Yukarı çık"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 text-accent-400">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
        <p className="text-sm text-white">{value}</p>
      </div>
    </div>
  );
}
