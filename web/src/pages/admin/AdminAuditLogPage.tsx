import React from 'react';

const mockLogs = [
  { id: 'L001', userId: '1', entityType: 'user', entityId: '2', action: 'update', changes: { role: 'admin' }, timestamp: '2025-11-15 10:23' },
  { id: 'L002', userId: '1', entityType: 'settings', entityId: 'S001', action: 'update', changes: { price: 19 }, timestamp: '2025-11-14 09:12' },
];

const AdminAuditLogPage: React.FC = () => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300">Audit Log</h1>
      <table className="min-w-full bg-white dark:bg-slate-900 rounded shadow">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">User</th>
            <th className="py-2 px-4 border-b">Typ</th>
            <th className="py-2 px-4 border-b">Entity</th>
            <th className="py-2 px-4 border-b">Action</th>
            <th className="py-2 px-4 border-b">Ändringar</th>
            <th className="py-2 px-4 border-b">Tid</th>
          </tr>
        </thead>
        <tbody>
          {mockLogs.map(log => (
            <tr key={log.id}>
              <td className="py-2 px-4 border-b">{log.id}</td>
              <td className="py-2 px-4 border-b">{log.userId}</td>
              <td className="py-2 px-4 border-b">{log.entityType}</td>
              <td className="py-2 px-4 border-b">{log.entityId}</td>
              <td className="py-2 px-4 border-b">{log.action}</td>
              <td className="py-2 px-4 border-b">{JSON.stringify(log.changes)}</td>
              <td className="py-2 px-4 border-b">{log.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminAuditLogPage;
