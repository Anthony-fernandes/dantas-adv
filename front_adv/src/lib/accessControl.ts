export const ACCESS_ROLE_CODES = ["OWNER", "ADMIN", "LAWYER", "ASSISTANT", "FINANCE", "CLIENT"] as const;

export type AccessRoleCode = (typeof ACCESS_ROLE_CODES)[number];

const FULL_ACCESS_ROLES = new Set<AccessRoleCode>(["OWNER", "ADMIN"]);

const ROLE_PERMISSION_DEFAULTS: Record<AccessRoleCode, string[]> = {
  OWNER: [],
  ADMIN: [],
  LAWYER: [
    "cause.view",
    "cause.create",
    "cause.update",
    "process.view",
    "process.create",
    "process.update",
    "client.view",
    "knowledge.view",
    "knowledge.create",
  ],
  ASSISTANT: [
    "cause.view",
    "process.view",
    "process.create",
    "process.update",
    "client.view",
    "employee.view",
    "position.view",
    "knowledge.view",
  ],
  FINANCE: [
    "finance.view",
    "finance.create",
    "finance.issue",
    "finance.invoice",
    "client.view",
  ],
  CLIENT: [
    "portal.view",
  ],
};

export function normalizeAccessRoleCode(role: string): AccessRoleCode | null {
  const normalized = String(role || "").trim().toUpperCase();

  if (normalized === "SOCIO") return "OWNER";
  if (["OWNER", "ADMIN", "LAWYER", "ASSISTANT", "FINANCE", "CLIENT"].includes(normalized)) {
    return normalized as AccessRoleCode;
  }
  if (normalized === "ADVOGADO") return "LAWYER";
  if (normalized === "ASSISTENTE") return "ASSISTANT";
  if (normalized === "FINANCEIRO") return "FINANCE";
  if (normalized === "CLIENTE") return "CLIENT";

  return null;
}

export function getInheritedPermissionsForRoles(roleCodes: string[], availablePermissionCodes: string[]): string[] {
  const normalizedRoles = roleCodes
    .map(normalizeAccessRoleCode)
    .filter((role): role is AccessRoleCode => role !== null);

  if (normalizedRoles.some((role) => FULL_ACCESS_ROLES.has(role))) {
    return [...availablePermissionCodes];
  }

  const availableSet = new Set(availablePermissionCodes);
  const inherited = new Set<string>();

  normalizedRoles.forEach((role) => {
    ROLE_PERMISSION_DEFAULTS[role].forEach((code) => {
      if (availableSet.has(code)) inherited.add(code);
    });
  });

  return [...inherited];
}

export function stripInheritedPermissions(permissionCodes: string[], inheritedPermissionCodes: string[]): string[] {
  const inheritedSet = new Set(inheritedPermissionCodes);
  return permissionCodes.filter((code) => !inheritedSet.has(code));
}
