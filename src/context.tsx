import { createContext, useContext, useState, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import type { MenuState, MenuItem, Category, RestaurantInfo } from './types';
import { api } from './api';
import { MenuStore } from './menu-store';

type ItemInput = Omit<MenuItem, 'id' | 'sortOrder'> & { sortOrder?: number };
interface MenuContextValue extends MenuState {
  dirty: boolean; saving: boolean; loading: boolean; error: string; loaded: boolean;
  publish: () => Promise<boolean>;
  reload: (admin?: boolean, discard?: boolean) => Promise<void>;
  saveRestaurant: (info: RestaurantInfo) => Promise<boolean>;
  saveItem: (item: ItemInput, id?: string) => Promise<boolean>;
  updateRestaurant: (info: Partial<RestaurantInfo>) => void;
  addCategory: (name: string, icon: string) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
  addItem: (item: ItemInput) => void;
  updateItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteItem: (id: string) => void;
  reorderItems: (items: MenuItem[]) => void;
}
const MenuContext = createContext<MenuContextValue | null>(null);
function itemWithId(menu: MenuState, item: ItemInput): MenuItem {
  return { ...item, id: `item-${crypto.randomUUID()}`, sortOrder: item.sortOrder ?? Math.max(0, ...menu.items.filter(i => i.categoryId === item.categoryId).map(i => i.sortOrder)) + 1 };
}
export function MenuProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new MenuStore(api));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => { void store.reload().catch(() => {}); }, [store]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (state.dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.dirty]);
  return <MenuContext.Provider value={{
    ...state.menu, dirty: state.dirty, saving: state.saving, loading: state.loading, loaded: state.loaded, error: state.error,
    publish: () => store.publish(), reload: store.reload,
    saveRestaurant: info => store.publish({ ...store.getSnapshot().menu, restaurant: info }),
    saveItem: (item, id) => {
      const menu = store.getSnapshot().menu;
      const exists = id && menu.items.some(i => i.id === id);
      return store.publish({ ...menu, items: exists ? menu.items.map(i => i.id === id ? { ...i, ...item } : i) : [...menu.items, { ...itemWithId(menu, item), ...(id ? { id } : {}) }] });
    },
    updateRestaurant: info => store.edit(m => ({ ...m, restaurant: { ...m.restaurant, ...info } })),
    addCategory: (name, icon) => store.edit(m => ({ ...m, categories: [...m.categories, { id: `cat-${crypto.randomUUID()}`, name, icon, sortOrder: Math.max(0, ...m.categories.map(c => c.sortOrder)) + 1 }] })),
    updateCategory: (id, updates) => store.edit(m => ({ ...m, categories: m.categories.map(c => c.id === id ? { ...c, ...updates } : c) })),
    deleteCategory: id => store.edit(m => ({ ...m, categories: m.categories.filter(c => c.id !== id), items: m.items.filter(i => i.categoryId !== id) })),
    reorderCategories: categories => store.edit(m => ({ ...m, categories })),
    addItem: item => store.edit(m => ({ ...m, items: [...m.items, itemWithId(m, item)] })),
    updateItem: (id, updates) => store.edit(m => ({ ...m, items: m.items.map(i => i.id === id ? { ...i, ...updates } : i) })),
    deleteItem: id => store.edit(m => ({ ...m, items: m.items.filter(i => i.id !== id) })),
    reorderItems: items => store.edit(m => ({ ...m, items })),
  }}>{children}</MenuContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error('useMenu must be used within MenuProvider');
  return context;
}
