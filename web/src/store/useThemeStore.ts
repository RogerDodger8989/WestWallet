import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: ThemeState['theme']) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('westwallet-theme') as ThemeState['theme']) || 'dark',
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('westwallet-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  },
}));
