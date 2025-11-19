
import axios from './axios';

export const supplierApi = {
  /**
   * Hämta alla leverantörer (kan filtreras på kategori)
   */
  async getSuppliers(categoryId?: string) {
    try {
      const params = categoryId ? { categoryId } : {};
      const res = await axios.get('/suppliers', { params });
      console.log('[supplierApi] getSuppliers:', res.data);
      return res.data;
    } catch (err) {
      console.error('[supplierApi] getSuppliers error:', err);
      throw err;
    }
  },

  /**
   * Skapa ny leverantör
   */
  async createSupplier(name: string, categoryId: string) {
    try {
      const res = await axios.post('/suppliers', { name, categoryId });
      console.log('[supplierApi] createSupplier:', res.data);
      return res.data;
    } catch (err) {
      console.error('[supplierApi] createSupplier error:', err);
      throw err;
    }
  },
};
