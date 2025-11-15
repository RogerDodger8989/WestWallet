import React from 'react';
import { Outlet } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';

const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-900 text-slate-900 dark:text-white">
      <Topbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
