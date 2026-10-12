import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { MenuState, MenuItem, Category, RestaurantInfo } from './types';
import { api } from './api';

interface MenuContextValue extends MenuState {
  dirty: boolean;
  saving: boolean;
  loading: boolean;
  error: string;
  loaded: boolean;
  publish: () => Promise<boolean>;
  reload: (admin?: boolean) => Promise<void>;
  updateRestaurant: (info: Partial<RestaurantInfo>) => void;
  addCategory: (name: string, icon: string) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
  addItem: (item: Omit<MenuItem, 'id' | 'sortOrder'> & { sortOrder?: number }) => void;
  updateItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteItem: (id: string) => void;
  reorderItems: (items: MenuItem[]) => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [restaurant, setRestaurant] = useState<RestaurantInfo>({ name: '', tagline: '', description: '', coverImage: '', logoText: '', address: '', phone: '', hours: '', wifiPassword: '', instagram: '', mapsUrl: '' });
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [revision, setRevision] = useState('initial');
  const [saved, setSaved] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const serialized = JSON.stringify({ restaurant, categories, items });
  const dirty = !!saved && saved !== serialized;
  const reload = useCallback(async (admin = false) => {
    setLoading(true); setError('');
    try {
      const result = await api<{ menu: MenuState; revision: string }>(admin ? '/api/admin-menu' : '/api/menu');
      setRestaurant(result.menu.restaurant); setCategories(result.menu.categories); setItems(result.menu.items);
      setRevision(result.revision); setSaved(JSON.stringify(result.menu));
    } catch (e) { setError(e instanceof Error ? e.message : 'Menü yüklenemedi.'); throw e; }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload().catch(() => {}); }, [reload]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const publish = async () => {
    if (saving) return false;
    setSaving(true); setError('');
    try {
      const result = await api<{ menu: MenuState; revision: string }>('/api/admin-menu', { method: 'PUT', body: JSON.stringify({ menu: { restaurant, categories, items }, revision }) });
      setRestaurant(result.menu.restaurant); setCategories(result.menu.categories); setItems(result.menu.items);
      setRevision(result.revision); setSaved(JSON.stringify(result.menu));
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'Kaydedilemedi.'); return false; }
    finally { setSaving(false); }
  };

  const updateRestaurant = (info: Partial<RestaurantInfo>) => {
    setRestaurant((prev) => ({ ...prev, ...info }));
  };

  const addCategory = (name: string, icon: string) => {
    const newCat: Category = {
      id: `cat-${crypto.randomUUID()}`,
      name,
      icon,
      sortOrder: Math.max(0, ...categories.map(c => c.sortOrder)) + 1,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setItems((prev) => prev.filter((i) => i.categoryId !== id));
  };

  const reorderCategories = (newCats: Category[]) => {
    setCategories(newCats);
  };

  const addItem: MenuContextValue['addItem'] = (item) => {
    const newItem: MenuItem = {
      ...item,
      id: `item-${crypto.randomUUID()}`,
      sortOrder: item.sortOrder ?? Math.max(0, ...items.filter(i => i.categoryId === item.categoryId).map(i => i.sortOrder)) + 1,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const reorderItems = (newItems: MenuItem[]) => {
    setItems(newItems);
  };

  return (
    <MenuContext.Provider
      value={{
        dirty, saving, loading, error, loaded: !!saved, publish, reload,
        restaurant,
        categories,
        items,
        updateRestaurant,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addItem,
        updateItem,
        deleteItem,
        reorderItems,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used within MenuProvider');
  return ctx;
}
