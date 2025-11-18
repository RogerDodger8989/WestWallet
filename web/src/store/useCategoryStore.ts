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
  selectedCategory?: string;
  fetchCategories: () => Promise<void>;
  addCategory: (name: string) => Promise<any>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,
  error: '',
  selectedCategory: undefined,
  fetchCategories: async () => {
    set({ loading: true, error: '' });
    try {
      const data = await categoryApi.getCategories();
      console.log('categories fetched from API', data);
      set({ categories: data, loading: false });
      // Sätt default selectedCategory om ingen är vald och data finns
      if (data.length > 0) {
        set(state => ({
          selectedCategory: state.selectedCategory && data.find((cat: Category) => cat.id === state.selectedCategory) ? state.selectedCategory : data[0].id
        }));
        console.log('selectedCategory set to', data[0].id);
      }
    } catch (error: any) {
      set({ error: error.message || 'Kunde inte hämta kategorier', loading: false });
    }
  },
    addCategory: async (name) => {
      set({ loading: true, error: '' });
      try {
        const response = await categoryApi.createCategory(name);
        console.log('addCategory backend response', response);
        await get().fetchCategories();
        set({ loading: false });
        return response;
      } catch (error: any) {
        set({ error: error.message || 'Kunde inte skapa kategori', loading: false });
        return null;
      }
  }
}));
