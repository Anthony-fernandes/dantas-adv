import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type AppRole } from '@/contexts/AuthContext';
import { hasAnyRole } from '@/lib/rbac';

/**
 * Route-level RBAC guard.
 * - If the user lacks required roles, redirect to 403.
 */
export function RequireRole({ roles, children }: { roles: AppRole[]; children: React.ReactNode }) {
  const { roles: userRoles, isLoading, isSuperuser } = useAuth();
  if (isLoading) return null;
  if (isSuperuser) return <>{children}</>;
  if (!hasAnyRole(userRoles, roles)) return <Navigate to="/error/403" replace />;
  return <>{children}</>;
}
