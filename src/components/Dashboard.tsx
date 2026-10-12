import { useState } from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
  QrCode,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  X,
  ArrowUp,
  ArrowDown,
  ChefHat,
  Check,
} from 'lucide-react';
import { useMenu } from '@/context';
import { formatPrice } from './Badge';
import { QRCodeView } from './QRCodeView';
import type { MenuItem, Category } from '@/types';

type Tab = 'overview' | 'menu' | 'settings' | 'qr';

export function Dashboard({ onLogout, onViewMenu }: { onLogout: () => void; onViewMenu: () => void }) {
  const [tab, setTab] = useState<Tab>('overview');
  const { restaurant, categories, items, dirty, saving, error, publish, reload } = useMenu();
  const [notice, setNotice] = useState('');
  const backup = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ restaurant, categories, items }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'menu-yedek.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Genel Bakış', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'menu', label: 'Menü Yönetimi', icon: <UtensilsCrossed className="h-5 w-5" /> },
    { id: 'settings', label: 'Restoran Ayarları', icon: <Settings className="h-5 w-5" /> },
    { id: 'qr', label: 'QR Kod', icon: <QrCode className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-ink-900/80 backdrop-blur-md lg:flex">
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <p className="font-serif text-base font-bold text-white">{restaurant.name}</p>
            <p className="text-xs text-ink-400">Yönetim Paneli</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                tab === item.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'text-ink-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="space-y-2 border-t border-white/5 p-4">
          <button
            onClick={onViewMenu}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-ink-300 transition hover:bg-white/5"
          >
            <ExternalLink className="h-5 w-5" />
            Menüyü Görüntüle
          </button>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-error transition hover:bg-error/10"
          >
            <LogOut className="h-5 w-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-ink-900/80 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary-600" />
            <span className="font-serif text-sm font-bold text-white">Yönetim Paneli</span>
          </div>
          <div className="flex gap-1">
            <button aria-label="Menüyü önizle" onClick={onViewMenu} className="rounded-lg p-2 text-ink-300 hover:bg-white/5">
              <ExternalLink className="h-4 w-4" />
            </button>
            <button aria-label="Çıkış yap" onClick={onLogout} className="rounded-lg p-2 text-error hover:bg-error/10">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-2 pb-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
                tab === item.id ? 'bg-primary-600 text-white' : 'text-ink-300 hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
          <div className="mb-6 rounded-xl border border-white/10 bg-ink-800 p-4">
            <p className="text-sm" role="status">{dirty ? 'Yayınlanmamış değişiklikler var.' : notice || 'Menü güncel.'}</p>
            <p className="mt-1 text-xs text-ink-300">Düzenlemeler taslakta tutulur. Yayından en geç 1 dakika sonra menüyü açan veya yenileyen ziyaretçiler güncel halini görür.</p>
            {error && <p role="alert" className="mt-2 text-red-300">{error} <a href="#login" className="underline">Giriş ekranı</a></p>}
            <div className="mt-3 flex flex-wrap gap-3">
              <button disabled={!dirty || saving} className="rounded-lg bg-primary-600 px-4 py-2 disabled:opacity-50" onClick={async () => { if (await publish()) setNotice('Menü başarıyla yayınlandı.'); }}>{saving ? 'Yayınlanıyor…' : 'Değişiklikleri Yayınla'}</button>
              <button disabled={saving} className="underline" onClick={backup}>Taslağı yedekle</button>
              <button disabled={saving} className="underline" onClick={() => { if (!dirty || confirm('Taslak silinip yayınlanan menü yüklensin mi?')) void reload(true, true).catch(() => {}); }}>Güncel menüyü yükle</button>
            </div>
          </div>
          <fieldset disabled={saving} className="min-w-0">
          {tab === 'overview' && <Overview items={items} categories={categories} restaurantName={restaurant.name} setTab={setTab} />}
          {tab === 'menu' && <MenuManager />}
          {tab === 'settings' && <RestaurantSettings />}
          {tab === 'qr' && <QRCodeView restaurantName={restaurant.name} />}
          </fieldset>
        </div>
      </main>
    </div>
  );
}

function Overview({
  items,
  categories,
  restaurantName,
  setTab,
}: {
  items: MenuItem[];
  categories: Category[];
  restaurantName: string;
  setTab: (t: Tab) => void;
}) {
  const availableItems = items.filter((i) => i.available).length;
  const unavailableItems = items.filter((i) => !i.available).length;

  const stats = [
    { label: 'Toplam Kategori', value: categories.length, icon: <UtensilsCrossed className="h-6 w-6" />, color: 'bg-primary-500/15 text-primary-400' },
    { label: 'Toplam Ürün', value: items.length, icon: <LayoutDashboard className="h-6 w-6" />, color: 'bg-accent-400/15 text-accent-300' },
    { label: 'Mevcut Ürünler', value: availableItems, icon: <Check className="h-6 w-6" />, color: 'bg-green-500/15 text-green-400' },
    { label: 'Tükenen Ürünler', value: unavailableItems, icon: <EyeOff className="h-6 w-6" />, color: 'bg-red-500/15 text-red-400' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
        Hoş geldiniz, {restaurantName}
      </h1>
      <p className="mt-1 text-sm text-ink-300">Menünüzün genel bir özeti aşağıdadır.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/5 bg-ink-800/60 p-5 shadow-lg shadow-black/20 backdrop-blur-sm">
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-ink-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setTab('menu')}
          className="flex items-center gap-4 rounded-2xl border border-white/5 bg-ink-800/60 p-5 text-left shadow-lg shadow-black/20 backdrop-blur-sm transition hover:border-primary-600/30 hover:shadow-xl"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-white">Menü Yönetimi</p>
            <p className="text-xs text-ink-400">Kategori ve ürün ekleyin, düzenleyin</p>
          </div>
        </button>
        <button
          onClick={() => setTab('qr')}
          className="flex items-center gap-4 rounded-2xl border border-white/5 bg-ink-800/60 p-5 text-left shadow-lg shadow-black/20 backdrop-blur-sm transition hover:border-primary-600/30 hover:shadow-xl"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-500 text-white">
            <QrCode className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-white">QR Kod</p>
            <p className="text-xs text-ink-400">QR kodu indirin ve yazdırın</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function MenuManager() {
  const { categories, items, addCategory, deleteCategory, saveItem, updateItem, deleteItem, reorderItems } = useMenu();
  const [expandedCat, setExpandedCat] = useState<string | null>(categories[0]?.id ?? null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Soup');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemId, setNewItemId] = useState('');

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      addCategory(newCatName.trim(), newCatIcon);
      setNewCatName('');
      setShowCatForm(false);
    }
  };

  const moveItem = (item: MenuItem, direction: 'up' | 'down') => {
    const catItems = items.filter((i) => i.categoryId === item.categoryId).sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = catItems.findIndex((i) => i.id === item.id);
    if (direction === 'up' && idx > 0) {
      const prev = catItems[idx - 1];
      const newItems = items.map((i) => {
        if (i.id === item.id) return { ...i, sortOrder: prev.sortOrder };
        if (i.id === prev.id) return { ...i, sortOrder: item.sortOrder };
        return i;
      });
      reorderItems(newItems);
    } else if (direction === 'down' && idx < catItems.length - 1) {
      const next = catItems[idx + 1];
      const newItems = items.map((i) => {
        if (i.id === item.id) return { ...i, sortOrder: next.sortOrder };
        if (i.id === next.id) return { ...i, sortOrder: item.sortOrder };
        return i;
      });
      reorderItems(newItems);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Menü Yönetimi</h1>
          <p className="mt-1 text-sm text-ink-300">Kategoriler ve ürünleri düzenleyin</p>
        </div>
        <button
          onClick={() => setShowCatForm(!showCatForm)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          Kategori
        </button>
      </div>

      {showCatForm && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/5 bg-ink-800/60 p-4 shadow-lg backdrop-blur-sm sm:flex-row">
          <input
            type="text"
            placeholder="Kategori adı (ör. Kahvaltı)"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-ink-900/60 px-4 py-2 text-sm text-white placeholder-ink-500 outline-none focus:border-primary-500"
          />
          <select
            value={newCatIcon}
            onChange={(e) => setNewCatIcon(e.target.value)}
            className="rounded-lg border border-white/10 bg-ink-900/60 px-4 py-2 text-sm text-white outline-none focus:border-primary-500"
          >
            <option value="Soup">Çorba</option>
            <option value="Salad">Salata</option>
            <option value="Leaf">Yeşillik</option>
            <option value="Flame">Izgara</option>
            <option value="Cake">Tatlı</option>
            <option value="Coffee">İçecek</option>
          </select>
          <button onClick={handleAddCategory} className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Ekle
          </button>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {sortedCategories.map((cat) => {
          const catItems = items.filter((i) => i.categoryId === cat.id).sort((a, b) => a.sortOrder - b.sortOrder);
          const isExpanded = expandedCat === cat.id;

          return (
            <div key={cat.id} className="overflow-hidden rounded-2xl border border-white/5 bg-ink-800/60 shadow-lg shadow-black/20 backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 py-3 sm:px-5">
                <button
                  onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <GripVertical className="h-5 w-5 text-ink-500" />
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-white">{cat.name}</h3>
                    <p className="text-xs text-ink-400">{catItems.length} ürün</p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setNewItemCategory(cat.id); setNewItemId(`item-${crypto.randomUUID()}`); setShowItemForm(true); }}
                    className="flex items-center gap-1 rounded-lg bg-primary-500/15 px-3 py-1.5 text-xs font-medium text-primary-400 transition hover:bg-primary-500/25"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ürün
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) {
                        deleteCategory(cat.id);
                      }
                    }}
                    className="rounded-lg p-2 text-error transition hover:bg-error/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-white/5">
                  {catItems.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-ink-400">Bu kategoride henüz ürün yok.</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {catItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                          <img
                            src={item.image}
                            alt={item.name}
                            className={`h-14 w-14 flex-shrink-0 rounded-lg object-cover ${!item.available ? 'grayscale' : ''}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-white">{item.name}</p>
                            <p className="text-sm text-ink-400">{formatPrice(item.price)}{item.oldPrice && ` · Eski: ${formatPrice(item.oldPrice)}`}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateItem(item.id, { available: !item.available })}
                              className={`rounded-lg p-2 transition ${item.available ? 'text-success hover:bg-success/10' : 'text-ink-500 hover:bg-white/5'}`}
                              title={item.available ? 'Tüketilebilir' : 'Tükenmiş'}
                            >
                              {item.available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button aria-label={`${item.name} yukarı taşı`} onClick={() => moveItem(item, 'up')} className="rounded-lg p-1.5 text-ink-400 hover:bg-white/5">
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button aria-label={`${item.name} aşağı taşı`} onClick={() => moveItem(item, 'down')} className="rounded-lg p-1.5 text-ink-400 hover:bg-white/5">
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setEditingItem(item); setShowItemForm(true); }}
                              aria-label={`${item.name} düzenle`}
                              className="rounded-lg p-2 text-primary-400 transition hover:bg-primary-500/10"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { if (confirm(`"${item.name}" silinsin mi?`)) deleteItem(item.id); }}
                              aria-label={`${item.name} sil`}
                              className="rounded-lg p-2 text-error transition hover:bg-error/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showItemForm && (
        <ItemFormModal
          initialCategoryId={newItemCategory}
          item={editingItem}
          categories={sortedCategories}
          onClose={() => { setShowItemForm(false); setEditingItem(null); }}
          onSave={async (data) => {
            if (await saveItem(data, editingItem?.id ?? newItemId)) {
              setShowItemForm(false);
              setEditingItem(null);
            }
          }}
        />
      )}
    </div>
  );
}

function ItemFormModal({
  initialCategoryId,
  item,
  categories,
  onClose,
  onSave,
}: {
  initialCategoryId: string;
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Omit<MenuItem, 'id' | 'sortOrder'>) => Promise<void>;
}) {
  const { error, saving } = useMenu();
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [price, setPrice] = useState(item?.price ?? 0);
  const [oldPrice, setOldPrice] = useState(item?.oldPrice ?? 0);
  const [image, setImage] = useState(item?.image ?? '');
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? initialCategoryId ?? categories[0]?.id ?? '');
  const [available, setAvailable] = useState(item?.available ?? true);
  const [badgeLabel, setBadgeLabel] = useState('');
  const [badgeType, setBadgeType] = useState<MenuItem['badges'][0]['type']>('popular');
  const [badges, setBadges] = useState<MenuItem['badges']>(item?.badges ?? []);

  const handleAddBadge = () => {
    if (badgeLabel.trim()) {
      setBadges([...badges, { label: badgeLabel.trim(), type: badgeType }]);
      setBadgeLabel('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name,
      description,
      price: Number(price),
      oldPrice: oldPrice > 0 ? Number(oldPrice) : undefined,
      image,
      categoryId,
      available,
      badges,
    });
  };

  const inputClass = 'w-full rounded-lg border border-white/10 bg-ink-900/60 px-4 py-2.5 text-sm text-white placeholder-ink-500 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-ink-900/90 shadow-2xl animate-scale-in backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <h2 className="font-serif text-lg font-bold text-white">
            {item ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-ink-400 hover:bg-white/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <p className="text-xs text-ink-300">Kaydettiğinizde fiyat ve görsel dahil ürün bilgileri sunucuya yazılır. Diğer açık taslak değişiklikleri de birlikte yayınlanır.</p>
          {error && <p role="alert" className="whitespace-pre-line rounded-lg bg-red-950 p-3 text-sm text-red-200">{error}</p>}
          <Field label="Ürün Adı">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </Field>

          <Field label="Açıklama">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fiyat (₺)">
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required min="0" step="0.01" className={inputClass} />
            </Field>
            <Field label="Eski Fiyat (opsiyonel)">
              <input type="number" value={oldPrice} onChange={(e) => setOldPrice(Number(e.target.value))} min="0" step="0.01" className={inputClass} />
            </Field>
          </div>

          <Field label="Görsel URL">
            <input type="text" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://... veya /img/products/kola.jpg" className={inputClass} />
          </Field>

          <Field label="Kategori">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAvailable(!available)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                available ? 'bg-success/15 text-success' : 'bg-error/15 text-error'
              }`}
            >
              {available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {available ? 'Tüketilebilir' : 'Tükenmiş'}
            </button>
          </div>

          {/* Badges */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-200">Etiketler</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {badges.map((b, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                  {b.label}
                  <button type="button" onClick={() => setBadges(badges.filter((_, idx) => idx !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={badgeLabel} onChange={(e) => setBadgeLabel(e.target.value)} placeholder="Etiket adı"
                className="flex-1 rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-white placeholder-ink-500 outline-none focus:border-primary-500" />
              <select value={badgeType} onChange={(e) => setBadgeType(e.target.value as MenuItem['badges'][0]['type'])}
                className="rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-white outline-none">
                <option value="popular">Popüler</option>
                <option value="spicy">Acılı</option>
                <option value="vegetarian">Vejetaryen</option>
                <option value="new">Yeni</option>
              </select>
              <button type="button" onClick={handleAddBadge} className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 border-t border-white/5 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-ink-300 transition hover:bg-white/5">
              İptal
            </button>
            <button type="submit"
              className="flex-1 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700">
              {saving ? 'Kaydediliyor…' : item ? 'Güncelle ve Yayınla' : 'Ekle ve Yayınla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-200">{label}</span>
      {children}
    </label>
  );
}

function RestaurantSettings() {
  const { restaurant: form, updateRestaurant: setForm, saveRestaurant, error, saving } = useMenu();
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setSaved(await saveRestaurant(form));
  };

  const fields: { key: keyof typeof form; label: string; type?: string }[] = [
    { key: 'name', label: 'Restoran Adı' },
    { key: 'tagline', label: 'Slogan' },
    { key: 'description', label: 'Açıklama' },
    { key: 'coverImage', label: 'Kapak Görseli URL' },
    { key: 'backgroundImage', label: 'Menü arka plan görseli (boşsa örnek tasarım kullanılır)' },
    { key: 'logoText', label: 'Logo Metni (kısaltma)' },
    { key: 'address', label: 'Adres' },
    { key: 'phone', label: 'Telefon' },
    { key: 'hours', label: 'Çalışma Saatleri' },
    { key: 'wifiPassword', label: 'Wi-Fi Şifresi' },
    { key: 'instagram', label: 'Instagram (kullanıcı adı, @adı veya profil bağlantısı)' },
    { key: 'mapsUrl', label: 'Google Maps URL' },
  ];

  const inputClass = 'w-full rounded-lg border border-white/10 bg-ink-900/60 px-4 py-2.5 text-sm text-white placeholder-ink-500 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20';

  return (
    <div className="animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Restoran Ayarları</h1>
      <p className="mt-1 text-sm text-ink-300">Restoran bilgilerinizi güncelleyin</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-white/5 bg-ink-800/60 p-6 shadow-lg shadow-black/20 backdrop-blur-sm">
        <p className="text-xs text-ink-300">Restoran adı dışındaki bilgiler isteğe bağlıdır. Kaydet düğmesi tüm değişiklikleri sunucuya yayınlar.</p>
        {error && <p role="alert" className="whitespace-pre-line rounded-lg bg-red-950 p-3 text-sm text-red-200">{error}</p>}
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            {f.key === 'description' ? (
              <textarea
                value={form[f.key] ?? ''}
                onChange={(e) => { setSaved(false); setForm({ ...form, [f.key]: e.target.value }); }}
                rows={3}
                className={inputClass}
              />
            ) : (
              <input
                type={f.type ?? 'text'}
                value={form[f.key] ?? ''}
                onChange={(e) => { setSaved(false); setForm({ ...form, [f.key]: e.target.value }); }}
                className={inputClass}
              />
            )}
          </Field>
        ))}

        <div className="flex items-center gap-4 border-t border-white/5 pt-4">
          <button
            type="submit"
            className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:bg-primary-700"
          >
            {saving ? 'Kaydediliyor…' : 'Ayarları Kaydet ve Yayınla'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-success animate-fade-in">
              <Check className="h-4 w-4" />
              Sunucuya kaydedildi ve yayınlandı
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
