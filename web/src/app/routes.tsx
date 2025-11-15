
import React from 'react';
import { RouteObject } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import SettingsPage from '../pages/settings/SettingsPage';
import ProtectedRoute from '../components/navigation/ProtectedRoute';
import AdminRoute from '../components/navigation/AdminRoute';
import UserDetailsPage from '../pages/admin/UserDetailsPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminMailPage from '../pages/admin/AdminMailPage';
import AdminAuditLogPage from '../pages/admin/AdminAuditLogPage';
import EconomyPage from '../pages/economy/EconomyPage';

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'economy', element: <EconomyPage /> },
      { path: 'settings', element: <SettingsPage /> },
      {
        element: <AdminRoute />,
        children: [
          { path: 'admin/dashboard', element: <AdminDashboardPage /> },
          { path: 'admin/users', element: <AdminUsersPage /> },
          { path: 'admin/users/:id', element: <UserDetailsPage /> },
          { path: 'admin/settings', element: <AdminSettingsPage /> },
          { path: 'admin/mail', element: <AdminMailPage /> },
          { path: 'admin/audit', element: <AdminAuditLogPage /> },
        ],
      },
    ],
  },
  // Lägg till fler routes här
];
