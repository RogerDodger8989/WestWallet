import { create } from 'zustand';
import { supplierApi } from '../api/supplierApi';

export interface Supplier {
  id: string;
  name: string;
  categoryId: string;
}

interface SupplierState {
  suppliers: Supplier[];
  loading: boolean;
  error: string;
  fetchSuppliers: (categoryId?: string) => Promise<void>;
  addSupplier: (name: string, categoryId: string) => Promise<void>;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  loading: false,
  error: '',
  fetchSuppliers: async (categoryId) => {
    set({ loading: true, error: '' });
    try {
      const data = await supplierApi.getSuppliers(categoryId);
      set({ suppliers: data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kunde inte hämta leverantörer', loading: false });
    }
  },
  addSupplier: async (name, categoryId) => {
    set({ loading: true, error: '' });
    try {
      const res = await supplierApi.createSupplier(name, categoryId);
      if (res.statusCode === 400) {
        set({ error: res.message || 'Dublettleverantör', loading: false });
        return;
      }
      await get().fetchSuppliers(categoryId);
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || error.message || 'Kunde inte skapa leverantör', loading: false });
    }
  },
}));
