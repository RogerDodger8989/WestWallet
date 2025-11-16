import React, { useEffect, useState } from 'react';

interface UndoToastProps {
  message: string;
  type?: 'success' | 'error';
  seconds?: number;
  onUndo: () => void;
  onTimeout: () => void;
}

const UndoToast: React.FC<UndoToastProps & { position?: string }> = ({ message, type = 'error', seconds = 10, onUndo, onTimeout, position }) => {
  const [count, setCount] = useState(seconds);

  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => {
      if (count - 1 === 0) {
        onTimeout();
      }
      setCount(c => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [count, onTimeout]);

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white flex items-center gap-4 ${type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}
      style={position === 'under-topbar' ? { top: '64px' } : { top: '16px', right: '16px', left: 'auto', transform: 'none' }}
    >
      <span>{message}</span>
      <span className="font-bold">{count}</span>
      <button
        className={`bg-white px-2 py-1 rounded ${type === 'error' ? 'text-red-600' : 'text-green-600'}`}
        onClick={() => {
          setCount(0); // stoppa timer
          onUndo();
        }}
      >
        Ångra
      </button>
    </div>
  );
};

export default UndoToast;
