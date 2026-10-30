import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { allowedPathsForRole } from '@/lib/roleNav';

export const RoleGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const allowed = new Set([
    ...allowedPathsForRole(profile?.role),
    '/dashboard',
    '/settings',
  ]);

  if (profile?.role === 'Administrator') {
    return <>{children}</>;
  }

  if (!allowed.has(path)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
