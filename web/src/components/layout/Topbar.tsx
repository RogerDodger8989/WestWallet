import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

const Topbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 shadow">
      <div className="flex items-center gap-2">
        <span className="font-bold text-blue-700 dark:text-blue-300 text-xl">💳 WestWallet</span>
        <nav className="ml-8 flex gap-4">
          <div className="relative group">
            <button className="p-2 rounded transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none" onClick={() => navigate('/dashboard')} aria-label="Dashboard">
              <span className="text-2xl">📊</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">Dashboard</span>
          </div>
          <div className="relative group">
            <button className="p-2 rounded transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none" onClick={() => navigate('/economy')} aria-label="Ekonomihantering">
              <span className="text-2xl">💰</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">Ekonomihantering</span>
          </div>
          <div className="relative group">
            <button className="p-2 rounded transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none" onClick={() => navigate('/contracts')} aria-label="Avtal & abonnemang">
              <span className="text-2xl">📄</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">Avtal & abonnemang</span>
          </div>
          <div className="relative group">
            <button className="p-2 rounded transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none" onClick={() => navigate('/cars')} aria-label="Bilkostnader">
              <span className="text-2xl">🚗</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">Bilkostnader</span>
          </div>
          <div className="relative group">
            <button className="p-2 rounded transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none" onClick={() => navigate('/settings')} aria-label="Inställningar">
              <span className="text-2xl">⚙️</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">Inställningar</span>
          </div>
          {user?.role === 'admin' && (
            <div className="relative group">
              <button className="p-2 rounded transition-colors duration-200 hover:bg-blue-100 dark:hover:bg-blue-800 focus:outline-none" onClick={() => navigate('/admin/dashboard')} aria-label="Adminpanel">
                <span className="text-2xl">🛠️</span>
              </button>
              <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs rounded bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">Adminpanel</span>
            </div>
          )}
        </nav>
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
