import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  isAdminRoute?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAdminRoute = false }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdminRoute && user?.role !== 'admin') {
    return <Navigate to="/login" replace />; 
  }

  return <Outlet />;
};

export default ProtectedRoute;