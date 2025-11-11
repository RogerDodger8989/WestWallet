// React import not needed due to react-jsx transform
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../context/ThemeContext';

export function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Nav Links */}
          <div className="flex items-center space-x-8">
            <Link to="/about" className="flex items-center space-x-2" title="Om & kontakt">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="text-xl font-bold text-gray-900 dark:text-white">WestWallet</span>
            </Link>

            <div className="hidden md:flex space-x-6">
              <Link 
                to="/" 
                className={isActive('/') ? 'nav-link-active' : 'nav-link'}
              >
                Plånböcker
              </Link>
              <Link 
                to="/categories" 
                className={isActive('/categories') ? 'nav-link-active' : 'nav-link'}
              >
                Kategorier & Leverantörer
              </Link>
              <Link 
                to="/expenses" 
                className={isActive('/expenses') ? 'nav-link-active' : 'nav-link'}
              >
                Ekonomihantering
              </Link>
            </div>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center space-x-4">
            <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
              {user?.username}
            </span>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Växla tema"
              title="Växla tema"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="btn-secondary text-sm flex items-center gap-2"
              title="Skriv ut"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-1M6 14h12v8H6v-8z" />
              </svg>
              Skriv ut
            </button>

            <button
              onClick={logout}
              className="btn-secondary text-sm"
            >
              Logga ut
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden pb-3 space-x-4">
          <Link 
            to="/" 
            className={`inline-block ${isActive('/') ? 'nav-link-active' : 'nav-link'}`}
          >
            Plånböcker
          </Link>
          <Link 
            to="/categories" 
            className={`inline-block ${isActive('/categories') ? 'nav-link-active' : 'nav-link'}`}
          >
            Kategorier
          </Link>
          <Link 
            to="/expenses" 
            className={`inline-block ${isActive('/expenses') ? 'nav-link-active' : 'nav-link'}`}
          >
            Ekonomi
          </Link>
        </div>
      </div>
    </nav>
  );
}
