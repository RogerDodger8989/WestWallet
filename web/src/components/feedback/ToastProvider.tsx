import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Toast {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info';
}

const ToastContext = createContext<{
  showToast: (message: string, type?: Toast['type']) => void;
} | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type?: Toast['type']) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter(t => t.id !== id)), 3500);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`px-4 py-2 rounded shadow text-white ${toast.type === 'error' ? 'bg-red-600' : toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
