import { create } from 'zustand';

export interface EconomyItem {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  supplier: string;
  note?: string;
  month: string;
  images?: string[];
}

interface EconomyState {
  items: EconomyItem[];
  loading: boolean;
  error: string;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<EconomyItem, 'id'>) => Promise<void>;
  updateItem: (item: EconomyItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  items: [],
  loading: false,
  error: '',
  fetchItems: async () => {
    set({ loading: true, error: '' });
    try {
      const items = await import('../api/economyApi').then(api => api.fetchEconomyItems());
      set({ items, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Kunde inte hämta poster', loading: false });
    }
  },
  addItem: async (item) => {
    set({ loading: true, error: '' });
    try {
      const newItem = await import('../api/economyApi').then(api => api.addEconomyItem(item));
      set({ items: [...get().items, newItem], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Kunde inte spara post', loading: false });
    }
  },
  updateItem: async (item) => {
    set({ loading: true, error: '' });
    try {
      const updated = await import('../api/economyApi').then(api => api.updateEconomyItem(item));
      set({ items: get().items.map(i => i.id === updated.id ? updated : i), loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Kunde inte uppdatera post', loading: false });
    }
  },
  deleteItem: async (id) => {
    set({ loading: true, error: '' });
    try {
      await import('../api/economyApi').then(api => api.deleteEconomyItem(id));
      set({ items: get().items.filter(i => i.id !== id), loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Kunde inte radera post', loading: false });
    }
  },
}));
