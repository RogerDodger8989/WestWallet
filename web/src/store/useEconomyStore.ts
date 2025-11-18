import { create } from 'zustand';

export interface EconomyItem {
  id: string;
  displayId: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  supplier: string;
  note?: string;
  month: number;
  year: number;
  images?: string[];
}

interface EconomyState {
  items: EconomyItem[];
  loading: boolean;
  error: string;
  fetchItems: () => Promise<void>;
  addItem: (item: {
    name: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    supplier: string;
    note?: string;
    year: number;
    month: number;
  }) => Promise<void>;
  updateItem: (item: EconomyItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  restoreItem: (item: EconomyItem) => Promise<void>;
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
  restoreItem: async (item) => {
    set({ loading: true, error: '' });
    try {
      // Skicka både id och _id till backend
      const restorePayload = { ...item, _id: item.id };
      const restored = await import('../api/economyApi').then(api => api.restoreEconomyItem(restorePayload));
      set({ items: [...get().items, restored], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Kunde inte återställa post', loading: false });
    }
  },
}));
