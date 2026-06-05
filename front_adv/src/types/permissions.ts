import { Permission, UserRole } from './models';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SOCIO: [
    'process.view', 'process.create', 'process.update', 'process.delete',
    'finance.view', 'finance.create', 'finance.issue', 'finance.invoice',
    'client.view', 'client.create', 'client.update', 'client.delete',
    'admin.manage_users', 'admin.audit', 'admin.settings',
    'knowledge.view', 'knowledge.create',
  ],
  ADVOGADO: [
    'process.view', 'process.create', 'process.update',
    'finance.view',
    'client.view', 'client.create', 'client.update',
    'knowledge.view', 'knowledge.create',
  ],
  ESTAGIARIO: [
    'process.view',
    'client.view',
    'knowledge.view',
  ],
  FINANCEIRO: [
    'process.view',
    'finance.view', 'finance.create', 'finance.issue', 'finance.invoice',
    'client.view',
  ],
  CLIENTE: [
    'portal.view',
  ],
};

export function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: Permission[], required: Permission[]): boolean {
  return required.some(p => userPermissions.includes(p));
}
