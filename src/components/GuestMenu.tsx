import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Instagram, MapPin, Phone, Settings, Wifi, X, ZoomIn } from 'lucide-react';
import { useMenu } from '@/context';
import { formatPrice } from './Badge';
import type { MenuItem } from '@/types';
import './GuestMenu.css';

const placeholder = '/img/placeholder.svg';
export function GuestMenu({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  const { restaurant, categories, items } = useMenu();
  const [panel, setPanel] = useState<'menu' | 'location' | null>('menu');
  const [selection, setSelection] = useState('');
  const [zoom, setZoom] = useState<MenuItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const sorted = useMemo(() => [...categories].sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const selected = sorted.find(c => c.id === selection) ?? sorted[0];
  const visibleItems = useMemo(() => items.filter(i => i.categoryId === selected?.id).sort((a, b) => a.sortOrder - b.sortOrder), [items, selected?.id]);
  useEffect(() => { list.current?.scrollTo({ top: 0 }); }, [selected?.id]);
  useEffect(() => { if (zoom) dialog.current?.showModal(); }, [zoom]);
  useEffect(() => {
    const previous = document.title; document.title = `${restaurant.name} | QR Menü`;
    return () => { document.title = previous; };
  }, [restaurant.name]);
  const closeZoom = () => { dialog.current?.close(); setZoom(null); };
  const location = restaurant.address.trim();
  const mapSource = location ? `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed` : '';
  const onImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (!event.currentTarget.src.endsWith(placeholder)) event.currentTarget.src = placeholder;
  };
  return (
    <div className="guest-menu-page">
      <div className="guest-backdrop" style={{ backgroundImage: `url(${JSON.stringify(restaurant.backgroundImage || '/img/background/full-bg-c.jpg')})` }} />
      <header className="guest-header">
        <div className="guest-nav">
          <button className="guest-brand" onClick={() => setPanel(null)} aria-label={`${restaurant.name} ana ekran`}>{restaurant.name}</button>
          <nav aria-label="Sayfa bölümleri" className="guest-actions">
            <button className="guest-button guest-button-menu" aria-pressed={panel === 'menu'} onClick={() => setPanel(panel === 'menu' ? null : 'menu')}>Menü</button>
            <button className="guest-button guest-button-location" aria-pressed={panel === 'location'} onClick={() => setPanel(panel === 'location' ? null : 'location')}>Konum</button>
          </nav>
        </div>
      </header>
      <main className="guest-main">
        {panel === 'menu' && <section className="guest-panel guest-menu-panel" aria-label="Restoran menüsü">
          <nav className="guest-categories" aria-label="Menü kategorileri">
            {sorted.map((category, index) => <button key={category.id} className={`guest-category ${index % 2 ? 'guest-category-blue' : ''}`} aria-pressed={selected?.id === category.id} onClick={() => setSelection(category.id)}>{category.name}</button>)}
          </nav>
          <div className="guest-menu-scroll" ref={list}>
            {selected && <h1 className="guest-category-title">{selected.name}</h1>}
            {visibleItems.length === 0 ? <p className="guest-empty">{sorted.length ? 'Bu kategoride henüz ürün yok.' : 'Menümüz hazırlanıyor.'}</p> :
              <ul className="guest-products">{visibleItems.map(item => <li key={item.id} className={`guest-product ${item.available ? '' : 'guest-product-unavailable'}`}>
                <button className="guest-product-image" aria-label={`${item.name} görselini büyüt`} onClick={() => setZoom(item)}>
                  <img src={item.image || placeholder} onError={onImageError} alt={item.name} loading="lazy" decoding="async" />
                  <ZoomIn aria-hidden="true" size={13} />
                </button>
                <div className="guest-product-content">
                  <div className="guest-product-heading"><h2>{item.name}</h2><div className="guest-product-price">{item.oldPrice != null && item.oldPrice > 0 && <del>{formatPrice(item.oldPrice)}</del>}<strong>{formatPrice(item.price)}</strong></div></div>
                  {item.description && <p className="guest-product-description">{item.description}</p>}
                  <div className="guest-product-badges">{!item.available && <span className="guest-sold-out">Tükendi</span>}{item.badges.map((badge, index) => <span key={`${badge.type}-${index}`}>{badge.label}</span>)}</div>
                </div>
              </li>)}</ul>}
          </div>
        </section>}
        {panel === 'location' && <section className="guest-panel guest-location" aria-labelledby="guest-location-title">
          <h1 id="guest-location-title">Bize Ulaşın</h1>
          {mapSource && <iframe src={mapSource} title={`${restaurant.name} konumu`} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />}
          <div className="guest-contact">
            {location && <p><MapPin size={18} aria-hidden="true" /><span><strong>Adres</strong>{location}</span></p>}
            {restaurant.phone && <p><Phone size={18} aria-hidden="true" /><span><strong>Telefon</strong><a href={`tel:${restaurant.phone.replace(/[^+\d]/g, '')}`}>{restaurant.phone}</a></span></p>}
            {restaurant.hours && <p><Clock size={18} aria-hidden="true" /><span><strong>Çalışma Saatleri</strong>{restaurant.hours}</span></p>}
            {restaurant.wifiPassword && <p><Wifi size={18} aria-hidden="true" /><span><strong>Wi-Fi Şifresi</strong>{restaurant.wifiPassword}</span></p>}
            {!location && !restaurant.phone && !restaurant.hours && <p>İletişim bilgileri henüz eklenmedi.</p>}
            <div className="guest-contact-links">
              {(restaurant.mapsUrl || location) && <a href={restaurant.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> Yol Tarifi</a>}
              {restaurant.instagram && <a href={`https://www.instagram.com/${restaurant.instagram}/`} target="_blank" rel="noopener noreferrer"><Instagram size={16} /> Instagram</a>}
            </div>
          </div>
        </section>}
        {!panel && <div className="guest-welcome"><h1>{restaurant.name}</h1>{restaurant.tagline && <p>{restaurant.tagline}</p>}<button className="guest-button guest-button-menu" onClick={() => setPanel('menu')}>Menüyü İncele</button></div>}
      </main>
      <footer className="guest-footer"><span>© {new Date().getFullYear()} {restaurant.name} QR Menü</span><button onClick={onGoToDashboard} aria-label="Yönetici girişi" title="Yönetici girişi"><Settings size={16} /></button></footer>
      <dialog ref={dialog} className="guest-image-dialog" onClose={() => setZoom(null)} onCancel={() => setZoom(null)} onClick={event => { if (event.target === event.currentTarget) closeZoom(); }} aria-label={zoom ? `${zoom.name} görseli` : 'Ürün görseli'}>
        {zoom && <div className="guest-image-content"><button autoFocus onClick={closeZoom} aria-label="Görseli kapat"><X size={24} /></button><img src={zoom.image || placeholder} onError={onImageError} alt={zoom.name} /><p>{zoom.name} <strong>{formatPrice(zoom.price)}</strong></p></div>}
      </dialog>
    </div>
  );
}
