import type { AppRole } from '@/contexts/AuthContext';

export type CanonicalRole = Exclude<AppRole, 'admin' | 'socio' | 'advogado' | 'assistente' | 'financeiro' | 'cliente'>;

export function normalizeRole(role: AppRole): CanonicalRole {
  const up = String(role).toUpperCase().replace(/^ROLE_/, '');
  if (up === 'SOCIO') return 'OWNER';
  if (up === 'ADVOGADO') return 'LAWYER';
  if (up === 'FINANCEIRO') return 'FINANCE';
  if (up === 'ASSISTENTE') return 'ASSISTANT';
  if (up === 'CLIENTE') return 'CLIENT';
  if (['ADMIN', 'ADMINISTRADOR', 'ADMINISTRADORA'].includes(up)) return 'ADMIN';
  if (up === 'OWNER') return 'OWNER';
  if (up === 'LAWYER') return 'LAWYER';
  if (up === 'FINANCE') return 'FINANCE';
  if (up === 'ASSISTANT') return 'ASSISTANT';
  if (up === 'CLIENT') return 'CLIENT';
  // fallback (treat unknown as least privilege)
  return 'CLIENT';
}

export function hasAnyRole(userRoles: AppRole[], allowed: AppRole[]): boolean {
  if (!allowed?.length) return true;
  const normalized = new Set(userRoles.map(normalizeRole));
  return allowed.some((r) => normalized.has(normalizeRole(r)));
}

export const RoleGroups = {
  ADMIN: ['OWNER', 'ADMIN'] as AppRole[],
  LEGAL: ['OWNER', 'ADMIN', 'LAWYER', 'ASSISTANT'] as AppRole[],
  FINANCE: ['OWNER', 'ADMIN', 'FINANCE'] as AppRole[],
} as const;
