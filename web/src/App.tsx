import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext';
import { Navigation } from './components/Navigation';
import Login from './pages/Login';
import Wallets from './pages/Wallets';
import { CategoriesSuppliers } from './pages/CategoriesSuppliers';
import { Expenses } from './pages/Expenses';
import { About } from './pages/About';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authNotice, clearNotice } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <>
  <Navigation />
      {/* Global auth banner */}
      {authNotice && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 flex items-start gap-2 text-sm">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 18h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{authNotice}</span>
          <button
            onClick={clearNotice}
            className="ml-auto hover:text-yellow-900 transition-colors"
            aria-label="Stäng"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Wallets />
            </PrivateRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <CategoriesSuppliers />
            </PrivateRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <PrivateRoute>
              <Expenses />
            </PrivateRoute>
          }
        />
        <Route
          path="/about"
          element={
            <PrivateRoute>
              <About />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
