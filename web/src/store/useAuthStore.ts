import { create } from 'zustand';

interface AuthState {
  user: null | { id: string; name: string; email: string; role: string };
  isLoading: boolean;
  login: (email: string, password: string, navigate?: (path: string) => void) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('authUser') || 'null'),
  isLoading: false,
  login: async (email, password, navigate) => {
    set({ isLoading: true });
    await new Promise(res => setTimeout(res, 1000));
    if (
      (email === 'admin@westwallet.se' && password === 'admin') ||
      (email === 'dennis800121@gmail.com' && password === 'lottasas123')
    ) {
      const user = { id: '1', name: 'Admin', email, role: 'admin' };
      set({ user, isLoading: false });
      localStorage.setItem('authUser', JSON.stringify(user));
      if (navigate) navigate('/admin/dashboard');
    } else if (email === 'user@westwallet.se' && password === 'user') {
      const user = { id: '2', name: 'User', email, role: 'user' };
      set({ user, isLoading: false });
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      set({ isLoading: false });
      throw new Error('Fel e-post eller lösenord');
    }
  },
  logout: () => {
    set({ user: null });
    localStorage.removeItem('authUser');
  },
}));
