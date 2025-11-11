import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { API_BASE_URL } from '../api/api';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      console.log('Login: API_BASE_URL =', API_BASE_URL);
      console.log('Login: username =', username);
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      const status = error?.response?.status;
      let details = '';
      if (error?.response) {
        details = JSON.stringify(error.response.data, null, 2);
      } else if (error?.message) {
        details = error.message;
      }
      if (status === 400) {
        setFormError('Fel användarnamn eller lösenord.\n' + details);
      } else if (status === 500) {
        setFormError('Serverfel. Försök igen senare.\n' + details);
      } else {
        setFormError((error.response?.data?.message || 'Ett fel uppstod') + '\n' + details);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load one-shot auth/session expiration message
  React.useEffect(() => {
    const msg = localStorage.getItem('authMessage');
    if (msg) {
      setSessionMessage(msg);
      localStorage.removeItem('authMessage');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-600 dark:bg-primary-500 mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            WestWallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Din personliga ekonomiassistent
          </p>
        </div>

        {/* Session expired banner */}
        {sessionMessage && (
          <div className="mb-4 rounded-lg bg-yellow-100 border border-yellow-300 px-4 py-3 text-sm text-yellow-800 flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 18h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">{sessionMessage}</p>
            </div>
            <button
              onClick={() => setSessionMessage(null)}
              className="ml-2 text-yellow-700 hover:text-yellow-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="card p-8">
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 rounded-md font-medium transition-all duration-200 ${
                isLogin 
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Logga in
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 rounded-md font-medium transition-all duration-200 ${
                !isLogin 
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Registrera
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="mb-2 text-red-600 text-sm font-medium text-left whitespace-pre-wrap">
                <strong>Fel vid inloggning:</strong>\n{formError}
              </div>
            )}
            <div className="mb-2 text-xs text-gray-400 text-left">
              <strong>API_BASE_URL:</strong> {API_BASE_URL}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Användarnamn
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                placeholder="Ange användarnamn"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Ange lösenord"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Laddar...
                </span>
              ) : (
                isLogin ? 'Logga in' : 'Skapa konto'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? (
              <p>
                Har du inget konto?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  Registrera dig här
                </button>
              </p>
            ) : (
              <p>
                Har du redan ett konto?{' '}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  Logga in här
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          © 2025 WestWallet. Alla rättigheter förbehållna.
        </p>
      </div>
    </div>
  );
};

export default Login;
