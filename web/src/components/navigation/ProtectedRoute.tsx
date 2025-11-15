import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const ProtectedRoute: React.FC = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
