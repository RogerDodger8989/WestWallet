import axios from './axios';

export const categoryApi = {
  getCategories: async () => {
    const res = await axios.get('/categories');
    return res.data;
  },
  createCategory: async (name: string) => {
    const res = await axios.post('/categories', { name });
    return res.data;
  },
};
