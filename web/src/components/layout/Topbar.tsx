import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

const Topbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 shadow">
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-700 dark:text-blue-300 text-xl">💳 WestWallet</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          className={`p-2 rounded-full ${theme === 'dark' ? 'bg-blue-800 text-blue-300' : 'bg-blue-100 text-blue-700'}`}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Växla tema"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        {user && (
          <>
            <span className="font-semibold text-blue-700 dark:text-blue-300 cursor-pointer" onClick={() => navigate('/settings')}>{user.name}</span>
            <button onClick={logout} className="ml-2 px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Logga ut</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Topbar;
