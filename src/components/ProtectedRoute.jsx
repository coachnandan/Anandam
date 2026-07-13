import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Loader from './Loader';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, authLoading } = useAppContext();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-offwhite">
        <Loader />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
