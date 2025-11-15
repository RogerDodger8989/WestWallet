import React from 'react';
import { useParams } from 'react-router-dom';
import { useAdminStore } from '../../store/useAdminStore';

const UserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const user = useAdminStore(state => state.users.find(u => u.id === id));

  if (!user) {
    return <div className="p-8">Användare hittades inte.</div>;
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Användardetaljer</h1>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Namn</label>
        <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded">{user.name}</div>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">E-post</label>
        <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded">{user.email}</div>
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Roll</label>
        <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded">{user.role}</div>
      </div>
      {/* Lägg till fler fält här */}
    </div>
  );
};

export default UserDetailsPage;
