import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, navigate);
    } catch (err: any) {
      setError(err?.message || 'Fel vid inloggning');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-900 dark:to-blue-800">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Logga in</h2>
        <input
          type="email"
          placeholder="E-post"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-400 dark:bg-slate-800 dark:text-white"
          required
        />
        <input
          type="password"
          placeholder="Lösenord"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-400 dark:bg-slate-800 dark:text-white"
          required
        />
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Loggar in...' : 'Logga in'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
