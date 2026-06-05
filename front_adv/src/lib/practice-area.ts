import type { CSSProperties } from "react";
import {
  Building2,
  CircleDollarSign,
  FileText,
  Gavel,
  Landmark,
  Scale,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PracticeAreaIconKey =
  | "scale"
  | "gavel"
  | "building"
  | "shield"
  | "landmark"
  | "money"
  | "users"
  | "file";

export type PracticeAreaCore = {
  id: string;
  name?: string | null;
  area?: string | null;
  description?: string | null;
  landing_icon?: string | null;
  landing_link?: string | null;
  display_order?: number | null;
  show_on_landing?: boolean | null;
  is_active?: boolean | null;
};

export type PracticeAreaUiMeta = {
  description?: string;
  color?: string;
  icon?: PracticeAreaIconKey;
  responsibleId?: string;
  responsibleName?: string;
  status?: "active" | "inactive";
};

export type PracticeAreaPreset = {
  code: string;
  label: string;
  description: string;
  color: string;
  icon: PracticeAreaIconKey;
};

export const PRACTICE_AREA_PRESETS: PracticeAreaPreset[] = [
  { code: "civel", label: "Direito Civil", description: "Contratos, responsabilidade civil, obrigações e contencioso cível do escritório.", color: "#2563eb", icon: "scale" },
  { code: "trabalhista", label: "Direito Trabalhista", description: "Reclamações, defesas patronais, acordos, verbas e rotina trabalhista.", color: "#7c3aed", icon: "gavel" },
  { code: "criminal", label: "Direito Penal", description: "Defesa criminal, audiências, medidas cautelares e estratégia probatória.", color: "#dc2626", icon: "shield" },
  { code: "empresarial", label: "Direito Empresarial", description: "Societário, governança, negociação empresarial e contencioso estratégico.", color: "#0f766e", icon: "building" },
  { code: "previdenciario", label: "Direito Previdenciário", description: "Benefícios, revisões, aposentadorias e contencioso previdenciário.", color: "#0ea5e9", icon: "users" },
  { code: "tributario", label: "Direito Tributário", description: "Planejamento, execução fiscal, consultivo e recuperação de créditos.", color: "#ca8a04", icon: "money" },
  { code: "familia", label: "Direito de Família", description: "Guarda, alimentos, sucessões e conflitos familiares com abordagem sensível.", color: "#db2777", icon: "users" },
  { code: "consumidor", label: "Direito do Consumidor", description: "Demandas consumeristas, defesa empresarial e estratégia de composição.", color: "#f97316", icon: "file" },
];

export const PRACTICE_AREA_ICON_OPTIONS: Array<{ value: PracticeAreaIconKey; label: string }> = [
  { value: "scale", label: "Balança" },
  { value: "gavel", label: "Martelo" },
  { value: "building", label: "Empresa" },
  { value: "shield", label: "Escudo" },
  { value: "landmark", label: "Tribunal" },
  { value: "money", label: "Financeiro" },
  { value: "users", label: "Pessoas" },
  { value: "file", label: "Documentos" },
];

const PRACTICE_AREA_ICON_MAP: Record<PracticeAreaIconKey, LucideIcon> = {
  scale: Scale,
  gavel: Gavel,
  building: Building2,
  shield: Shield,
  landmark: Landmark,
  money: CircleDollarSign,
  users: Users,
  file: FileText,
};

const PRACTICE_TO_LANDING_ICON: Record<PracticeAreaIconKey, string> = {
  scale: "Scale",
  gavel: "Gavel",
  building: "Building2",
  shield: "Shield",
  landmark: "Landmark",
  money: "CircleDollarSign",
  users: "Users",
  file: "FileText",
};

const LANDING_TO_PRACTICE_ICON: Record<string, PracticeAreaIconKey> = Object.fromEntries(
  Object.entries(PRACTICE_TO_LANDING_ICON).map(([practiceIcon, landingIcon]) => [landingIcon, practiceIcon as PracticeAreaIconKey]),
) as Record<string, PracticeAreaIconKey>;

export function getPracticeAreaIcon(icon?: PracticeAreaIconKey | null) {
  return PRACTICE_AREA_ICON_MAP[icon || "scale"] || Scale;
}

export function practiceAreaIconToLandingIcon(icon?: PracticeAreaIconKey | null) {
  return PRACTICE_TO_LANDING_ICON[icon || "scale"] || "Scale";
}

export function landingIconToPracticeAreaIcon(icon?: string | null) {
  const normalized = String(icon || "").trim();
  return LANDING_TO_PRACTICE_ICON[normalized] || "scale";
}

export function normalizePracticeAreaCode(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

export function getPracticeAreaPreset(code?: string | null): PracticeAreaPreset {
  const normalized = normalizePracticeAreaCode(code);
  return PRACTICE_AREA_PRESETS.find((item) => item.code === normalized)
    || { code: normalized || "geral", label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Área geral", description: "Atuação jurídica configurada pelo escritório.", color: "#475569", icon: "landmark" };
}

export function resolvePracticeAreaMeta(area: PracticeAreaCore, uiMap?: Record<string, PracticeAreaUiMeta>) {
  const preset = getPracticeAreaPreset(area.area);
  const meta = uiMap?.[area.id] || {};
  return {
    code: normalizePracticeAreaCode(area.area) || preset.code,
    label: String(area.name || preset.label),
    description: meta.description || String(area.description || "").trim() || preset.description,
    color: meta.color || preset.color,
    icon: meta.icon || landingIconToPracticeAreaIcon(area.landing_icon) || preset.icon,
    responsibleId: meta.responsibleId || "",
    responsibleName: meta.responsibleName || "",
    isActive: meta.status ? meta.status === "active" : area.is_active !== false,
  };
}

export function resolvePracticeAreaByCode(
  code?: string | null,
  areas?: PracticeAreaCore[],
  uiMap?: Record<string, PracticeAreaUiMeta>,
) {
  const normalized = normalizePracticeAreaCode(code);
  const area = (areas || []).find((item) => normalizePracticeAreaCode(item.area) === normalized);
  if (area) return resolvePracticeAreaMeta(area, uiMap);
  const preset = getPracticeAreaPreset(normalized);
  return {
    code: preset.code,
    label: preset.label,
    description: preset.description,
    color: preset.color,
    icon: preset.icon,
    responsibleId: "",
    responsibleName: "",
    isActive: true,
  };
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return null;
  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value)) return null;
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgba(hex: string, alpha: number) {
  const color = hexToRgb(hex);
  if (!color) return undefined;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function contrast(hex: string) {
  const color = hexToRgb(hex);
  if (!color) return "#0f172a";
  const luminance = (0.299 * color.r + 0.587 * color.g + 0.114 * color.b) / 255;
  return luminance > 0.68 ? "#0f172a" : "#f8fafc";
}

export function practiceAreaPillStyle(color?: string): CSSProperties {
  const base = color || "#475569";
  return {
    backgroundColor: rgba(base, 0.14),
    borderColor: rgba(base, 0.3),
    color: base,
  };
}

export function practiceAreaAccentStyle(color?: string): CSSProperties {
  const base = color || "#475569";
  return {
    background: `linear-gradient(135deg, ${rgba(base, 0.16)} 0%, ${rgba(base, 0.08)} 100%)`,
    borderColor: rgba(base, 0.24),
  };
}

export function practiceAreaSolidStyle(color?: string): CSSProperties {
  const base = color || "#475569";
  return {
    backgroundColor: base,
    color: contrast(base),
  };
}
