
import { create } from 'zustand';
import { adminApi } from '../api/adminApi';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminState {
  users: User[];
  loading: boolean;
  error: string;
  fetchUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  loading: false,
  error: '',
  fetchUsers: async () => {
    set({ loading: true, error: '' });
    try {
      const users = await adminApi.getUsers();
      set({ users, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kunde inte hämta användare', loading: false });
    }
  },
  addUser: async (user) => {
    set({ loading: true, error: '' });
    try {
      await adminApi.createUser(user);
      await get().fetchUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kunde inte skapa användare', loading: false });
    }
  },
  updateUser: async (user) => {
    set({ loading: true, error: '' });
    try {
      await adminApi.updateUser(user);
      await get().fetchUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kunde inte uppdatera användare', loading: false });
    }
  },
  deleteUser: async (id) => {
    set({ loading: true, error: '' });
    try {
      await adminApi.deleteUser(id);
      await get().fetchUsers();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Kunde inte radera användare', loading: false });
    }
  },
}));
