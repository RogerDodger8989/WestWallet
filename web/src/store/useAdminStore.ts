import { create } from 'zustand';

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
  fetchUsers: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  loading: false,
  error: '',
  fetchUsers: () => {
    set({ loading: true, error: '' });
    // Mock fetch, replace with real API call
    setTimeout(() => {
      set({
        users: [
          { id: '1', name: 'Admin', email: 'admin@westwallet.se', role: 'admin' },
          { id: '2', name: 'User', email: 'user@westwallet.se', role: 'user' },
        ],
        loading: false,
        error: '',
      });
    }, 1000);
  },
  addUser: (user) => {
    const id = Math.random().toString(36).substr(2, 9);
    set({ users: [...get().users, { ...user, id }] });
  },
  updateUser: (user) => {
    set({ users: get().users.map(u => u.id === user.id ? user : u) });
  },
}));
