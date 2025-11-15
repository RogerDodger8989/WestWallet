import { create } from 'zustand';
import { categoryApi } from '../api/categoryApi';

export interface Category {
  id: string;
  name: string;
}

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string;
  fetchCategories: () => Promise<void>;
  addCategory: (name: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: '',
  fetchCategories: async () => {
    set({ loading: true, error: '' });
    try {
      const data = await categoryApi.getCategories();
      set({ categories: data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kunde inte hämta kategorier', loading: false });
    }
  },
  addCategory: async (name) => {
    set({ loading: true, error: '' });
    try {
      const res = await categoryApi.createCategory(name);
      if (res.statusCode === 400) {
        set({ error: res.message || 'Dublettkategori', loading: false });
        return;
      }
      await get().fetchCategories();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || 'Kunde inte skapa kategori', loading: false });
    }
  },
}));
