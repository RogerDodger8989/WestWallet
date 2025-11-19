
import axios from './axios';

export const categoryApi = {
  /**
   * Hämta alla kategorier för inloggad användare
   */
  async getCategories() {
    try {
      const res = await axios.get('/categories');
      console.log('[categoryApi] getCategories:', res.data);
      return res.data;
    } catch (err) {
      console.error('[categoryApi] getCategories error:', err);
      throw err;
    }
  },

  /**
   * Skapa ny kategori för användare
   */
  async createCategory(name: string) {
    try {
      const res = await axios.post('/categories', { name });
      console.log('[categoryApi] createCategory:', res.data);
      return res.data;
    } catch (err) {
      console.error('[categoryApi] createCategory error:', err);
      throw err;
    }
  },
};
