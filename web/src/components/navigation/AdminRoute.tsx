import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const AdminRoute: React.FC = () => {
  const { user } = useAuthStore();
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
};

export default AdminRoute;
