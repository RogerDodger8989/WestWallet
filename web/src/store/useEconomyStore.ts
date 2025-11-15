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
    // TODO: Anropa backend API
    set({ loading: false });
  },
  addItem: async (item) => {
    set({ loading: true, error: '' });
    // TODO: Anropa backend API
    set({ loading: false });
  },
  updateItem: async (item) => {
    set({ loading: true, error: '' });
    // TODO: Anropa backend API
    set({ loading: false });
  },
  deleteItem: async (id) => {
    set({ loading: true, error: '' });
    // TODO: Anropa backend API
    set({ loading: false });
  },
}));
