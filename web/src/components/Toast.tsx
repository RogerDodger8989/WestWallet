
import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded shadow-lg z-50 text-white ${type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
      {message}
    </div>
  );
};

export default Toast;
