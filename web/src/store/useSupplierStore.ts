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
  selectedSupplier?: string;
  fetchSuppliers: () => Promise<void>;
  addSupplier: (name: string, categoryId: string) => Promise<void>;
}

export const useSupplierStore = create<SupplierState>((set, get) => ({
  suppliers: [],
  loading: false,
  error: '',
  selectedSupplier: undefined,
  fetchSuppliers: async () => {
    set({ loading: true, error: '' });
    try {
      const data = await supplierApi.getSuppliers();
      console.log('suppliers fetched from API', data);
      let selectedSupplier = get().selectedSupplier;
      if (data.length > 0) {
        selectedSupplier = selectedSupplier && data.find((sup: Supplier) => sup.id === selectedSupplier)
          ? selectedSupplier
          : data[0].id;
        console.log('selectedSupplier set to', selectedSupplier);
      } else {
        selectedSupplier = undefined;
      }
      set({ suppliers: data, loading: false, selectedSupplier });
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
        alert(res.message || 'Dublettleverantör');
        return;
      }
      await get().fetchSuppliers();
      set({ loading: false });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Kunde inte skapa leverantör';
      set({ error: msg, loading: false });
      alert(msg);
    }
  },
}));
