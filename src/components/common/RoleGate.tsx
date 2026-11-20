import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { allowedPathsForRole } from '@/lib/roleNav';

export const RoleGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (loading || !profile) {
    return (
      <div className="py-20 text-center text-sm text-slate-500">
        Verifying permissions…
      </div>
    );
  }

  // Role is always sourced from the non-editable `profiles` record, never user_metadata
  const role = profile.role;

  if (path === '/admin' && role !== 'Administrator') {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === 'Administrator') {
    return <>{children}</>;
  }

  const allowed = new Set([
    ...allowedPathsForRole(role),
    '/dashboard',
    '/settings',
  ]);

  if (!allowed.has(path)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
