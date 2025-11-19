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
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Fel e-post eller lösenord');
      const data = await res.json();
      localStorage.setItem('accessToken', data.access_token);
      set({ user: data.user, isLoading: false });
      localStorage.setItem('authUser', JSON.stringify(data.user));
      if (navigate) navigate('/admin/dashboard');
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },
  logout: () => {
    set({ user: null });
    localStorage.removeItem('authUser');
    localStorage.removeItem('accessToken');
  },
}));
