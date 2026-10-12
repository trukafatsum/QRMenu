import type { MenuState } from './types';

type Envelope = { menu: MenuState; revision: string };
type Transport = (path: string, options?: RequestInit) => Promise<Envelope>;
const empty: MenuState = { restaurant: { name: '', tagline: '', description: '', coverImage: '', logoText: '', address: '', phone: '', hours: '', wifiPassword: '', instagram: '', mapsUrl: '' }, categories: [], items: [] };

export class MenuStore {
  private listeners = new Set<() => void>();
  private generation = 0;
  private state = { menu: empty, revision: 'initial', saved: '', dirty: false, loaded: false, loading: true, saving: false, error: '' };
  constructor(private transport: Transport) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private set(patch: Partial<typeof this.state>) {
    this.state = { ...this.state, ...patch };
    this.state.dirty = this.state.loaded && JSON.stringify(this.state.menu) !== this.state.saved;
    this.listeners.forEach(listener => listener());
  }
  edit = (change: (menu: MenuState) => MenuState) => {
    if (this.state.saving) return;
    this.generation++;
    this.set({ menu: change(this.state.menu), loading: false, error: '' });
  };
  commit = async (change: (menu: MenuState) => MenuState): Promise<boolean> => {
    if (this.state.saving || !this.state.loaded) return false;
    if (this.state.dirty) { this.set({ error: 'Önce restoran ayarlarındaki değişiklikleri kaydedin.' }); return false; }
    const previous = this.state.menu;
    const success = await this.publish(change(previous));
    if (!success) this.set({ menu: previous });
    return success;
  };
  reload = async (admin = false, discard = false) => {
    if (this.state.saving || (this.state.dirty && !discard)) return;
    const generation = ++this.generation;
    this.set({ loading: true, error: '' });
    try {
      const result = await this.transport(admin ? '/api/admin-menu' : '/api/menu');
      if (generation !== this.generation) return;
      this.set({ menu: result.menu, revision: result.revision, saved: JSON.stringify(result.menu), loaded: true, loading: false });
    } catch (e) {
      if (generation !== this.generation) return;
      this.set({ error: e instanceof Error ? e.message : 'Menü yüklenemedi.', loading: false });
      throw e;
    }
  };
  publish = async (candidate?: MenuState): Promise<boolean> => {
    if (this.state.saving || !this.state.loaded) return false;
    ++this.generation; // A pending GET must never overwrite a save or an edited draft.
    const menu = candidate ?? this.state.menu;
    this.set({ menu, saving: true, loading: false, error: '' });
    try {
      const result = await this.transport('/api/admin-menu', { method: 'PUT', body: JSON.stringify({ menu, revision: this.state.revision }) });
      this.set({ menu: result.menu, revision: result.revision, saved: JSON.stringify(result.menu), saving: false });
      return true;
    } catch (e) {
      this.set({ error: e instanceof Error ? e.message : 'Kaydedilemedi.', saving: false });
      return false;
    }
  };
}
