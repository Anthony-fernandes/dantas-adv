import React from 'react';
import { useAuth, type AppRole } from '@/contexts/AuthContext';
import { hasAnyRole } from '@/lib/rbac';

/**
 * Component-level RBAC guard.
 * Use to hide actions/buttons without breaking layout.
 */
export function Can({ roles, children, fallback = null }: { roles: AppRole[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { roles: userRoles, isSuperuser } = useAuth();
  if (isSuperuser) return <>{children}</>;
  if (!hasAnyRole(userRoles, roles)) return <>{fallback}</>;
  return <>{children}</>;
}
