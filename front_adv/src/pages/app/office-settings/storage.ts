import {
  loadWorkspaceStateSingleton,
  saveWorkspaceStateSingleton,
} from "@/services/workspaceState";

export type CompanyExtras = {
  description: string;
  timezone: string;
  currency: string;
  language: string;
  dateFormat: string;
  primaryColor: string;
  secondaryColor: string;
  faviconUrl: string;
  multiUserEnabled: boolean;
  defaultPermissionPolicy: "cargo" | "usuario";
  notificationsEnabled: boolean;
  planName: string;
  userLimit: string;
};

export type PositionMeta = {
  color: string;
  icon: string;
  permissionCodes: string[];
};

export type OfficeTenantMeta = {
  company: CompanyExtras;
  positions: Record<string, PositionMeta>;
};

const POSITION_COLORS = [
  "#1d4ed8",
  "#0f766e",
  "#7c3aed",
  "#c2410c",
  "#0f766e",
  "#be123c",
];

export const DEFAULT_COMPANY_EXTRAS: CompanyExtras = {
  description: "",
  timezone: "America/Fortaleza",
  currency: "BRL",
  language: "pt-BR",
  dateFormat: "DD/MM/YYYY",
  primaryColor: "#1d4ed8",
  secondaryColor: "#0f172a",
  faviconUrl: "",
  multiUserEnabled: true,
  defaultPermissionPolicy: "cargo",
  notificationsEnabled: true,
  planName: "Escritorio Premium",
  userLimit: "15",
};

export function createDefaultOfficeTenantMeta(): OfficeTenantMeta {
  return {
    company: { ...DEFAULT_COMPANY_EXTRAS },
    positions: {},
  };
}

export function normalizeOfficeTenantMeta(meta?: Partial<OfficeTenantMeta> | null): OfficeTenantMeta {
  return {
    company: { ...DEFAULT_COMPANY_EXTRAS, ...(meta?.company || {}) },
    positions: Object.fromEntries(
      Object.entries(meta?.positions || {}).map(([positionId, position]) => [
        positionId,
        {
          color: position?.color || defaultPositionMeta().color,
          icon: position?.icon || "briefcase",
          permissionCodes: Array.isArray(position?.permissionCodes) ? position.permissionCodes : [],
        },
      ]),
    ),
  };
}

export function defaultPositionMeta(index = 0): PositionMeta {
  return {
    color: POSITION_COLORS[index % POSITION_COLORS.length],
    icon: "briefcase",
    permissionCodes: [],
  };
}

export async function loadOfficeTenantMeta(tenantId?: string | null): Promise<OfficeTenantMeta> {
  if (!tenantId) return createDefaultOfficeTenantMeta();
  const meta = await loadWorkspaceStateSingleton<OfficeTenantMeta>("office_settings");
  return normalizeOfficeTenantMeta(meta);
}

export async function saveOfficeTenantMeta(tenantId: string, meta: OfficeTenantMeta) {
  if (!tenantId) return;
  await saveWorkspaceStateSingleton("office_settings", normalizeOfficeTenantMeta(meta));
}
