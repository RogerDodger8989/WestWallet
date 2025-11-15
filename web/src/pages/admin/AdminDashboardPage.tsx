import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminStore } from '../../store/useAdminStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboardPage: React.FC = () => {
  const { users, fetchUsers } = useAdminStore();
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  const data = [
    { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
    { name: 'Users', value: users.filter(u => u.role === 'user').length },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Admin Dashboard</h1>
      <div className="mb-8">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded shadow">
          <h2 className="font-semibold mb-2">Totalt antal användare</h2>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">{users.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded shadow">
          <h2 className="font-semibold mb-2">Antal admins</h2>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-300">{data[0].value}</div>
        </div>
      </div>
      <div className="mt-4">
        <Link
          to="/admin/users"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 font-semibold"
        >
          Hantera användare
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
