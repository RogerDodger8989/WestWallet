import React, { useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useNavigate } from 'react-router-dom';
import UserModal from '../../components/admin/UserModal';

const AdminUsersPage: React.FC = () => {
  const { users, loading, error, fetchUsers } = useAdminStore();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Användare (Admin)</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        onClick={() => { setEditUser(null); setModalOpen(true); }}
      >
        Skapa användare
      </button>
      {loading && <div className="text-blue-500">Laddar användare...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <table className="min-w-full bg-white dark:bg-slate-900 rounded shadow">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Namn</th>
            <th className="py-2 px-4 border-b">E-post</th>
            <th className="py-2 px-4 border-b">Roll</th>
            <th className="py-2 px-4 border-b">Åtgärder</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr
              key={user.id}
              className="hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
            >
              <td className="py-2 px-4 border-b" onClick={() => navigate(`/admin/users/${user.id}`)}>{user.name}</td>
              <td className="py-2 px-4 border-b" onClick={() => navigate(`/admin/users/${user.id}`)}>{user.email}</td>
              <td className="py-2 px-4 border-b" onClick={() => navigate(`/admin/users/${user.id}`)}>{user.role}</td>
              <td className="py-2 px-4 border-b">
                <button
                  className="px-2 py-1 bg-yellow-400 rounded mr-2"
                  onClick={() => { setEditUser(user); setModalOpen(true); }}
                >Redigera</button>
                <button
                  className="px-2 py-1 bg-red-500 text-white rounded"
                  onClick={async () => {
                    if (window.confirm(`Radera användare ${user.name}?`)) {
                      await useAdminStore.getState().deleteUser(user.id);
                    }
                  }}
                >Radera</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <UserModal open={modalOpen} onClose={() => setModalOpen(false)} user={editUser} />
    </div>
  );
};

export default AdminUsersPage;
