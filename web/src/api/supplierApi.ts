import axios from './axios';

export const supplierApi = {
  getSuppliers: async (categoryId?: string) => {
    const res = await axios.get('/suppliers', { params: categoryId ? { categoryId } : {} });
  console.log('getSuppliers response', res.data);
  return res.data;
  },
  createSupplier: async (name: string, categoryId: string) => {
    const res = await axios.post('/suppliers', { name, categoryId });
    return res.data;
  },
};
