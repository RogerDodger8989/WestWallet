import React, { useEffect, useState } from 'react';
import { walletsAPI } from '../api/api';

const Wallets: React.FC = () => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await walletsAPI.list();
      setWallets(data || []);
    } catch (e) {
      alert('Kunde inte ladda plånböcker');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createWallet = async () => {
    const name = prompt('Namn på ny plånbok');
    if (!name) return;
    await walletsAPI.create(name, 'SEK');
    await load();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mina plånböcker
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Hantera dina plånböcker och transaktioner
        </p>
      </div>

      <div className="mb-6">
        <button onClick={createWallet} className="btn-primary">
          <svg className="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Skapa ny plånbok
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : wallets.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Inga plånböcker ännu</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Klicka på knappen ovan för att skapa din första plånbok</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map(w => (
            <div key={w.id} className="card p-6 hover:scale-105 transition-transform duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {w.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{w.currency}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Saldo</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(w.balance ?? 0).toFixed(2)}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{w.currency}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wallets;
