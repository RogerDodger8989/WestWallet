import React, { useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

const UserModal: React.FC<UserModalProps> = ({ open, onClose, user }) => {
  const isEdit = !!user?.id;
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'user');
  const { addUser, updateUser } = useAdminStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      updateUser({ id: user!.id!, name, email, role });
    } else {
      addUser({ name, email, role });
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300">{isEdit ? 'Redigera användare' : 'Skapa användare'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Namn"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full mb-3 px-4 py-2 border rounded dark:bg-slate-800 dark:text-white"
            required
          />
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full mb-3 px-4 py-2 border rounded dark:bg-slate-800 dark:text-white"
            required
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full mb-3 px-4 py-2 border rounded dark:bg-slate-800 dark:text-white"
          >
            <option value="user">Användare</option>
            <option value="admin">Admin</option>
          </select>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-300 dark:bg-slate-700">Avbryt</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">{isEdit ? 'Spara' : 'Skapa'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
