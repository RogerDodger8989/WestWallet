import axios from './axios';

export const adminApi = {
  getUsers: async () => {
    const res = await axios.get('/admin/users');
    return res.data;
  },
  createUser: async (user: { name: string; email: string; role: string }) => {
    const res = await axios.post('/admin/users', user);
    return res.data;
  },
  updateUser: async (user: { id: string; name: string; email: string; role: string }) => {
    const res = await axios.put(`/admin/users/${user.id}`, user);
    return res.data;
  },
  deleteUser: async (id: string) => {
    const res = await axios.delete(`/admin/users/${id}`);
    return res.data;
  },
};
