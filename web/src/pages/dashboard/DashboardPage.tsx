import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Jan', income: 32000, expense: 21000 },
  { name: 'Feb', income: 28000, expense: 19000 },
  { name: 'Mar', income: 35000, expense: 22000 },
];

const DashboardPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Ekonomisk översikt</h1>
      <div className="mb-8">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={mockData}>
            <XAxis dataKey="name" stroke="#2563eb" />
            <YAxis stroke="#2563eb" />
            <Tooltip />
            <Bar dataKey="income" fill="#22c55e" name="Inkomst" />
            <Bar dataKey="expense" fill="#ef4444" name="Utgift" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded shadow">
          <h2 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Total inkomst (Q1)</h2>
          <div className="text-3xl font-bold text-green-600 dark:text-green-300">{mockData.reduce((sum, d) => sum + d.income, 0).toLocaleString()} kr</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded shadow">
          <h2 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">Total utgift (Q1)</h2>
          <div className="text-3xl font-bold text-red-600 dark:text-red-300">{mockData.reduce((sum, d) => sum + d.expense, 0).toLocaleString()} kr</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
