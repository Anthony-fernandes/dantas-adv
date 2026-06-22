import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Eye,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  Monitor,
  Palette,
  Plus,
  Rocket,
  Save,
  Settings2,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { apiGetAllPages } from "@/integrations/api/client";
import { useScopedTenant } from "@/hooks/useScopedTenant";
import { loadOfficeTenantMeta } from "@/pages/app/office-settings/storage";
import { causeService, landingCmsService } from "@/services/api";
import type {
  LandingDifferential,
  LandingPost,
  LandingProcessStep,
  LandingSettings,
  LandingSocialLink,
} from "@/types/landing";
import {
  LandingPreview,
  type LandingPreviewDevice,
} from "@/components/landing-builder/LandingPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type AreaAdminItem = {
  id: string;
  name: string;
  area: string;
  description?: string | null;
  landing_icon?: string;
  landing_link?: string;
  display_order?: number;
  show_on_landing?: boolean;
  is_active?: boolean;
};

type SettingsFormState = LandingSettings & {
  theme_text: string;
  clear_hero_background_image?: boolean;
  clear_about_image?: boolean;
  clear_final_cta_background_image?: boolean;
};

type AreaFormState = {
  name: string;
  area: string;
  description: string;
  landing_icon: string;
  landing_link: string;
  display_order: number;
  show_on_landing: boolean;
  is_active: boolean;
};

type DifferentialFormState = {
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

type StepFormState = {
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

type SocialLinkFormState = {
  label: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

type SectionId =
  | "hero"
  | "identity"
  | "about"
  | "services"
  | "differentials"
  | "process"
  | "blog"
  | "contact"
  | "finalCta"
  | "footer"
  | "seo";

type BuilderSectionProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  open: boolean;
  onToggleOpen: () => void;
  summary?: string;
  enabled?: boolean;
  onEnabledChange?: (value: boolean) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

type ColorFieldProps = {
  label: string;
  value: string;
  hint?: string;
  onChange: (value: string) => void;
};

const SECTION_IDS: SectionId[] = [
  "hero",
  "identity",
  "about",
  "services",
  "differentials",
  "process",
  "blog",
  "contact",
  "finalCta",
  "footer",
  "seo",
];

const DEFAULT_OPEN_SECTIONS: SectionId[] = ["hero", "identity", "about", "services", "seo"];

const DEFAULT_THEME_COLORS = {
  primary: "#c9ab76",
  secondary: "#f0d7a1",
  dark: "#081d36",
  muted: "#f5f2ec",
  soft: "#f6f3ed",
  border: "#d8d5cf",
  heroStart: "#081d36",
  heroMid: "#0a2649",
  heroEnd: "#0d355f",
  success: "#30d366",
};

const COLOR_PRESETS = [
  {
    id: "classico",
    label: "Clássico jurídico",
    colors: {
      primary: "#c9ab76",
      secondary: "#f0d7a1",
      dark: "#081d36",
      muted: "#f5f2ec",
      soft: "#f6f3ed",
      border: "#d8d5cf",
      heroStart: "#081d36",
      heroMid: "#0a2649",
      heroEnd: "#0d355f",
      success: "#30d366",
    },
  },
  {
    id: "corporativo",
    label: "Corporativo sóbrio",
    colors: {
      primary: "#2f56d3",
      secondary: "#93c5fd",
      dark: "#111c34",
      muted: "#eef3ff",
      soft: "#f8faff",
      border: "#cad5e5",
      heroStart: "#111c34",
      heroMid: "#1a2d56",
      heroEnd: "#264a88",
      success: "#21b66f",
    },
  },
  {
    id: "esmeralda",
    label: "Esmeralda elegante",
    colors: {
      primary: "#1f8a63",
      secondary: "#c8e3d8",
      dark: "#102a2a",
      muted: "#eef6f2",
      soft: "#f8fcfa",
      border: "#cfe0d8",
      heroStart: "#102a2a",
      heroMid: "#18493e",
      heroEnd: "#246c56",
      success: "#28b86e",
    },
  },
  {
    id: "bordo",
    label: "Bordô premium",
    colors: {
      primary: "#8b1e3f",
      secondary: "#f3d9df",
      dark: "#2a1020",
      muted: "#faf3f5",
      soft: "#fff8fa",
      border: "#e3c8d0",
      heroStart: "#2a1020",
      heroMid: "#4a1732",
      heroEnd: "#6f2348",
      success: "#26b96c",
    },
  },
];

const LANDING_SETTINGS_FORMDATA_OMIT_KEYS = new Set([
  "id",
  "tenant",
  "created_at",
  "updated_at",
  "theme_text",
  "hero_background_image",
  "hero_background_image_url",
  "about_image",
  "about_image_url",
  "final_cta_background_image",
  "final_cta_background_image_url",
]);

const LANDING_FIELD_LABELS: Record<string, string> = {
  hero_background_image: "Imagem de fundo",
  about_image: "Imagem da seção sobre",
  final_cta_background_image: "Imagem da chamada final",
  footer_email: "Email do rodapé",
  contact_recipient_emails: "Emails de recebimento",
  client_portal_url: "URL da área do cliente",
  internal_area_url: "URL da área interna",
  map_embed_url: "Mapa incorporado",
};

const EMPTY_SETTINGS: SettingsFormState = {
  is_published: false,
  brand_name: "",
  brand_tagline: "",
  hero_enabled: true,
  hero_subtitle: "",
  hero_title: "",
  hero_description: "",
  hero_primary_cta_label: "",
  hero_primary_cta_url: "",
  services_enabled: true,
  services_eyebrow: "",
  services_title: "",
  services_description: "",
  services_button_text: "",
  about_enabled: true,
  about_eyebrow: "",
  about_title: "",
  about_highlight: "",
  about_description: "",
  about_secondary_description: "",
  differentials_enabled: true,
  differentials_eyebrow: "",
  differentials_title: "",
  differentials_description: "",
  contact_enabled: true,
  contact_eyebrow: "",
  contact_title: "",
  contact_description: "",
  contact_button_text: "",
  contact_success_message: "",
  contact_recipient_emails: "",
  contact_send_email: true,
  process_enabled: true,
  process_eyebrow: "",
  process_title: "",
  process_description: "",
  blog_enabled: true,
  final_cta_enabled: true,
  final_cta_eyebrow: "",
  final_cta_title: "",
  final_cta_description: "",
  final_cta_button_text: "",
  final_cta_button_url: "",
  map_enabled: true,
  map_embed_url: "",
  footer_enabled: true,
  footer_description: "",
  footer_address: "",
  footer_phone: "",
  footer_email: "",
  footer_copyright: "",
  seo_title: "",
  seo_description: "",
  seo_keywords: "",
  theme_text: "{}",
};

const EMPTY_AREA: AreaFormState = {
  name: "",
  area: "civel",
  description: "",
  landing_icon: "Scale",
  landing_link: "",
  display_order: 0,
  show_on_landing: true,
  is_active: true,
};

const EMPTY_DIFFERENTIAL: DifferentialFormState = {
  icon: "Shield",
  title: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

const EMPTY_STEP: StepFormState = {
  icon: "CheckCircle2",
  title: "",
  description: "",
  sort_order: 0,
  is_active: true,
};

const EMPTY_SOCIAL_LINK: SocialLinkFormState = {
  label: "",
  url: "",
  icon: "Instagram",
  sort_order: 0,
  is_active: true,
};

function parseTheme(value: string) {
  try {
    return value.trim() ? JSON.parse(value) : {};
  } catch {
    throw new Error("A configuração interna do tema está inválida.");
  }
}

function parseThemeSafely(value: string) {
  try {
    return value.trim() ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function pickThemeColor(theme: Record<string, any> | undefined, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = theme?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function hasThemeColor(theme: Record<string, any> | undefined, keys: string[]) {
  return keys.some((key) => typeof theme?.[key] === "string" && String(theme[key]).trim());
}

function normalizeHexColor(value: string | undefined, fallback: string) {
  const input = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(input)) return input;
  if (/^#[0-9a-fA-F]{3}$/.test(input)) {
    return `#${input[1]}${input[1]}${input[2]}${input[2]}${input[3]}${input[3]}`;
  }
  return fallback;
}

function asResults<T>(payload: any): T[] {
  if (Array.isArray(payload?.results)) return payload.results as T[];
  if (Array.isArray(payload)) return payload as T[];
  return [];
}

function boolToString(value: boolean | undefined) {
  return value ? "true" : "false";
}

function appendFormDataValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (typeof value === "boolean") {
    formData.append(key, boolToString(value));
    return;
  }
  if (typeof value === "number") {
    formData.append(key, String(value));
    return;
  }
  if (typeof value === "object") {
    formData.append(key, JSON.stringify(value));
    return;
  }
  formData.append(key, String(value));
}

function humanizeLandingFieldName(field: string) {
  return LANDING_FIELD_LABELS[field] || field.replace(/_/g, " ");
}

function flattenValidationDetails(details: unknown, parentKey = ""): string[] {
  if (details === undefined || details === null) return [];

  if (Array.isArray(details)) {
    return details.flatMap((item) => flattenValidationDetails(item, parentKey));
  }

  if (typeof details === "object") {
    return Object.entries(details as Record<string, unknown>).flatMap(([key, value]) =>
      flattenValidationDetails(value, key),
    );
  }

  const message = String(details).trim();
  if (!message) return [];
  if (!parentKey) return [message];
  return [`${humanizeLandingFieldName(parentKey)}: ${message}`];
}

function buildLandingSaveErrorMessage(error: any, fallback: string) {
  const rawMessage = String(error?.message || "").trim();
  const detailMessages = flattenValidationDetails(error?.details);
  const detailMessage = detailMessages[0];

  if (detailMessage) return detailMessage;
  if (rawMessage) return rawMessage;
  return fallback;
}

function buildGooglePreviewUrl(slug?: string) {
  if (typeof window === "undefined") return "https://seusite.com";
  const normalizedSlug = String(slug || "").trim();
  if (!normalizedSlug) return window.location.origin;
  return `${window.location.origin}/?slug=${encodeURIComponent(normalizedSlug)}`;
}

function heroAlignmentFrom(theme: Record<string, any> | undefined) {
  const value = String(theme?.hero_alignment || "center").toLowerCase();
  if (value === "left" || value === "right" || value === "center") return value;
  return "center";
}

function sectionCount(settings: SettingsFormState) {
  return [
    settings.hero_enabled !== false,
    settings.about_enabled !== false,
    settings.services_enabled !== false,
    settings.differentials_enabled !== false,
    settings.process_enabled !== false,
    settings.blog_enabled !== false,
    settings.map_enabled !== false,
    settings.final_cta_enabled !== false,
    settings.footer_enabled !== false,
  ].filter(Boolean).length;
}

function BuilderSection(props: BuilderSectionProps) {
  const { title, description, icon: Icon, open, onToggleOpen, summary, enabled, onEnabledChange, actions, children } = props;

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <div className="flex flex-col gap-3 border-b bg-slate-50/80 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                {summary ? <Badge variant="outline">{summary}</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {typeof enabled === "boolean" && onEnabledChange ? (
            <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
              <span>Exibir</span>
              <Switch checked={enabled} onCheckedChange={onEnabledChange} />
            </div>
          ) : null}
          <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={onToggleOpen}>
            {open ? "Recolher" : "Expandir"}
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {open ? <CardContent className="space-y-5 p-5">{children}</CardContent> : null}
    </Card>
  );
}

function ColorField(props: ColorFieldProps) {
  const { label, value, hint, onChange } = props;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      <div className="flex items-center gap-3">
        <Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-16 p-1" />
        <Input value={value} readOnly className="font-mono" />
      </div>
    </div>
  );
}

function SectionEmpty(props: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  const { title, description, actionLabel, onAction } = props;

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
export default function LandingCmsBuilder() {
  const queryClient = useQueryClient();
  const { companies, isSuperuser, selectedTenantId, setSelectedTenantId } = useScopedTenant("landing-cms");

  const [settingsForm, setSettingsForm] = useState<SettingsFormState>(EMPTY_SETTINGS);
  const [previewDevice, setPreviewDevice] = useState<LandingPreviewDevice>("desktop");
  const [openSections, setOpenSections] = useState<SectionId[]>(DEFAULT_OPEN_SECTIONS);

  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [finalImageFile, setFinalImageFile] = useState<File | null>(null);

  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [areaForm, setAreaForm] = useState<AreaFormState>(EMPTY_Área);

  const [differentialDialogOpen, setDifferentialDialogOpen] = useState(false);
  const [editingDifferentialId, setEditingDifferentialId] = useState<string | null>(null);
  const [differentialForm, setDifferentialForm] = useState<DifferentialFormState>(EMPTY_DIFFERENTIAL);

  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [stepForm, setStepForm] = useState<StepFormState>(EMPTY_STEP);

  const [socialDialogOpen, setSocialDialogOpen] = useState(false);
  const [editingSocialId, setEditingSocialId] = useState<string | null>(null);
  const [socialForm, setSocialForm] = useState<SocialLinkFormState>(EMPTY_SOCIAL_LINK);

  const settingsQuery = useQuery({
    queryKey: ["landing-cms-settings", selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: () => landingCmsService.getSettings(),
  });

  const officeMetaQuery = useQuery({
    queryKey: ["landing-cms-office-meta", selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: () => loadOfficeTenantMeta(selectedTenantId),
    retry: false,
  });

  const areasQuery = useQuery({
    queryKey: ["landing-cms-areas", selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: () => apiGetAllPages<AreaAdminItem>("/causes/"),
  });

  const differentialsQuery = useQuery({
    queryKey: ["landing-cms-differentials", selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: () => landingCmsService.listDifferentials(),
  });

  const stepsQuery = useQuery({
    queryKey: ["landing-cms-steps", selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: () => landingCmsService.listProcessSteps(),
  });

  const postsQuery = useQuery({
    queryKey: ["landing-cms-posts", selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: () => landingCmsService.listAllPosts(),
  });

  const socialLinksQuery = useQuery({
    queryKey: ["landing-cms-social-links", selectedTenantId],
    enabled: !!selectedTenantId,
    queryFn: () => landingCmsService.listSocialLinks(),
  });

  const areas = useMemo(() => areasQuery.data || [], [areasQuery.data]);
  const differentials = useMemo(() => asResults<LandingDifferential>(differentialsQuery.data), [differentialsQuery.data]);
  const steps = useMemo(() => asResults<LandingProcessStep>(stepsQuery.data), [stepsQuery.data]);
  const posts = useMemo(() => postsQuery.data || [], [postsQuery.data]);
  const socialLinks = useMemo(() => asResults<LandingSocialLink>(socialLinksQuery.data), [socialLinksQuery.data]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedTenantId),
    [companies, selectedTenantId],
  );

  useEffect(() => {
    if (!settingsQuery.data) return;
    const data = settingsQuery.data;
    const theme = { ...(data.theme || {}) };
    const fallbackPrimary = officeMetaQuery.data?.company.primaryColor || DEFAULT_THEME_COLORS.primary;
    const fallbackSecondary = officeMetaQuery.data?.company.secondaryColor || DEFAULT_THEME_COLORS.dark;

    if (!hasThemeColor(theme, ["accent", "primary_color"])) {
      theme.accent = fallbackPrimary;
      theme.primary_color = fallbackPrimary;
    }

    if (!hasThemeColor(theme, ["accent_strong", "secondary_color"])) {
      theme.accent_strong = fallbackSecondary;
      theme.secondary_color = fallbackSecondary;
    }

    if (!hasThemeColor(theme, ["dark_base"])) {
      theme.dark_base = fallbackSecondary;
    }

    if (!hasThemeColor(theme, ["surface_muted"])) {
      theme.surface_muted = DEFAULT_THEME_COLORS.muted;
    }

    if (!hasThemeColor(theme, ["surface_soft"])) {
      theme.surface_soft = DEFAULT_THEME_COLORS.soft;
    }

    if (!hasThemeColor(theme, ["border_soft", "border_color"])) {
      theme.border_soft = DEFAULT_THEME_COLORS.border;
      theme.border_color = DEFAULT_THEME_COLORS.border;
    }

    if (!hasThemeColor(theme, ["hero_start", "hero_color_from"])) {
      theme.hero_start = theme.dark_base || fallbackSecondary;
      theme.hero_color_from = theme.hero_start;
    }

    if (!hasThemeColor(theme, ["hero_mid", "hero_color_mid"])) {
      theme.hero_mid = DEFAULT_THEME_COLORS.heroMid;
      theme.hero_color_mid = DEFAULT_THEME_COLORS.heroMid;
    }

    if (!hasThemeColor(theme, ["hero_end", "hero_color_to"])) {
      theme.hero_end = DEFAULT_THEME_COLORS.heroEnd;
      theme.hero_color_to = DEFAULT_THEME_COLORS.heroEnd;
    }

    if (!hasThemeColor(theme, ["cta_success", "whatsapp_color"])) {
      theme.cta_success = DEFAULT_THEME_COLORS.success;
      theme.whatsapp_color = DEFAULT_THEME_COLORS.success;
    }

    if (!theme.hero_alignment) {
      theme.hero_alignment = "center";
    }

    setSettingsForm({
      ...EMPTY_SETTINGS,
      ...data,
      footer_email: data.footer_email || "",
      theme_text: JSON.stringify(theme, null, 2),
      clear_about_image: false,
      clear_final_cta_background_image: false,
      clear_hero_background_image: false,
    });
    setHeroImageFile(null);
    setAboutImageFile(null);
    setFinalImageFile(null);
  }, [settingsQuery.data, officeMetaQuery.data]);

  const themeDraft = useMemo(() => parseThemeSafely(settingsForm.theme_text), [settingsForm.theme_text]);
  const previewSettings = useMemo(() => ({ ...settingsForm, theme: themeDraft }), [settingsForm, themeDraft]);
  const deferredPreviewSettings = useDeferredValue(previewSettings);

  const fallbackPrimaryColor = officeMetaQuery.data?.company.primaryColor || DEFAULT_THEME_COLORS.primary;
  const fallbackSecondaryColor = officeMetaQuery.data?.company.secondaryColor || DEFAULT_THEME_COLORS.dark;

  const landingPrimaryColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["accent", "primary_color"], fallbackPrimaryColor),
    fallbackPrimaryColor,
  );
  const landingSecondaryColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["accent_strong", "secondary_color"], fallbackSecondaryColor),
    fallbackSecondaryColor,
  );
  const landingDarkColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["dark_base"], fallbackSecondaryColor),
    fallbackSecondaryColor,
  );
  const landingMutedSurfaceColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["surface_muted"], DEFAULT_THEME_COLORS.muted),
    DEFAULT_THEME_COLORS.muted,
  );
  const landingSoftSurfaceColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["surface_soft"], DEFAULT_THEME_COLORS.soft),
    DEFAULT_THEME_COLORS.soft,
  );
  const landingBorderColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["border_soft", "border_color"], DEFAULT_THEME_COLORS.border),
    DEFAULT_THEME_COLORS.border,
  );
  const landingHeroStartColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["hero_start", "hero_color_from"], landingDarkColor),
    landingDarkColor,
  );
  const landingHeroMidColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["hero_mid", "hero_color_mid"], DEFAULT_THEME_COLORS.heroMid),
    DEFAULT_THEME_COLORS.heroMid,
  );
  const landingHeroEndColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["hero_end", "hero_color_to"], DEFAULT_THEME_COLORS.heroEnd),
    DEFAULT_THEME_COLORS.heroEnd,
  );
  const landingSuccessColor = normalizeHexColor(
    pickThemeColor(themeDraft, ["cta_success", "whatsapp_color"], DEFAULT_THEME_COLORS.success),
    DEFAULT_THEME_COLORS.success,
  );
  const heroAlignment = heroAlignmentFrom(themeDraft);

  const visibleAreas = useMemo(
    () =>
      [...areas]
        .filter((item) => item.show_on_landing !== false && item.is_active !== false)
        .sort((left, right) => (left.display_order || 0) - (right.display_order || 0)),
    [areas],
  );
  const activeDifferentials = useMemo(
    () => [...differentials].filter((item) => item.is_active !== false).sort((left, right) => left.sort_order - right.sort_order),
    [differentials],
  );
  const activeSteps = useMemo(
    () => [...steps].filter((item) => item.is_active !== false).sort((left, right) => left.sort_order - right.sort_order),
    [steps],
  );
  const publishedPosts = useMemo(
    () =>
      [...posts]
        .filter((item) => item.is_published !== false)
        .sort((left, right) => {
          const leftDate = new Date(left.published_at || left.created_at || "").getTime();
          const rightDate = new Date(right.published_at || right.created_at || "").getTime();
          return rightDate - leftDate;
        }),
    [posts],
  );
  const activeSocialLinks = useMemo(
    () => [...socialLinks].filter((item) => item.is_active !== false).sort((left, right) => left.sort_order - right.sort_order),
    [socialLinks],
  );

  const quickMetrics = useMemo(
    () => [
      { label: "Seções ativas", value: String(sectionCount(settingsForm)), icon: Sparkles },
      { label: "Áreas visíveis", value: String(visibleAreas.length), icon: Briefcase },
      { label: "Artigos publicados", value: String(publishedPosts.length), icon: Globe },
      { label: "Redes sociais", value: String(activeSocialLinks.length), icon: Star },
    ],
    [activeSocialLinks.length, publishedPosts.length, settingsForm, visibleAreas.length],
  );

  const loadingAny =
    settingsQuery.isLoading ||
    areasQuery.isLoading ||
    differentialsQuery.isLoading ||
    stepsQuery.isLoading ||
    postsQuery.isLoading ||
    socialLinksQuery.isLoading;

  const saveSettingsMutation = useMutation({
    mutationFn: async (nextState?: SettingsFormState) => {
      const state = { ...(nextState ?? settingsForm), is_published: true };
      const formData = new FormData();
      const payload = {
        ...state,
        theme: parseTheme(state.theme_text),
      } as Record<string, any>;

      Object.entries(payload).forEach(([key, value]) => {
        if (LANDING_SETTINGS_FORMDATA_OMIT_KEYS.has(key)) return;
        appendFormDataValue(formData, key, value);
      });
      if (heroImageFile) formData.append("hero_background_image", heroImageFile);
      if (aboutImageFile) formData.append("about_image", aboutImageFile);
      if (finalImageFile) formData.append("final_cta_background_image", finalImageFile);

      return landingCmsService.updateSettingsForm(formData);
    },
    onSuccess: async (data) => {
      setSettingsForm((prev) => ({ ...prev, is_published: true }));
      toast.success("Landing pública atualizada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["landing-cms-settings", selectedTenantId] });
    },
    onError: (error: any) => toast.error(buildLandingSaveErrorMessage(error, "Não foi possível salvar as configurações do site.")),
  });

  const saveAreaMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...areaForm, description: areaForm.description || "" };
      if (editingAreaId) return causeService.update(editingAreaId, payload);
      return causeService.create(payload);
    },
    onSuccess: async () => {
      toast.success(editingAreaId ? "Área atualizada." : "Área criada.");
      setAreaDialogOpen(false);
      setEditingAreaId(null);
      setAreaForm(EMPTY_AREA);
      await queryClient.invalidateQueries({ queryKey: ["landing-cms-areas", selectedTenantId] });
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao salvar a área."),
  });

  const saveDifferentialMutation = useMutation({
    mutationFn: async () => {
      if (editingDifferentialId) return landingCmsService.updateDifferential(editingDifferentialId, differentialForm);
      return landingCmsService.createDifferential(differentialForm);
    },
    onSuccess: async () => {
      toast.success(editingDifferentialId ? "Diferencial atualizado." : "Diferencial criado.");
      setDifferentialDialogOpen(false);
      setEditingDifferentialId(null);
      setDifferentialForm(EMPTY_DIFFERENTIAL);
      await queryClient.invalidateQueries({ queryKey: ["landing-cms-differentials", selectedTenantId] });
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao salvar o diferencial."),
  });

  const saveStepMutation = useMutation({
    mutationFn: async () => {
      if (editingStepId) return landingCmsService.updateProcessStep(editingStepId, stepForm);
      return landingCmsService.createProcessStep(stepForm);
    },
    onSuccess: async () => {
      toast.success(editingStepId ? "Etapa atualizada." : "Etapa criada.");
      setStepDialogOpen(false);
      setEditingStepId(null);
      setStepForm(EMPTY_STEP);
      await queryClient.invalidateQueries({ queryKey: ["landing-cms-steps", selectedTenantId] });
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao salvar a etapa."),
  });

  const saveSocialMutation = useMutation({
    mutationFn: async () => {
      if (editingSocialId) return landingCmsService.updateSocialLink(editingSocialId, socialForm);
      return landingCmsService.createSocialLink(socialForm);
    },
    onSuccess: async () => {
      toast.success(editingSocialId ? "Rede social atualizada." : "Rede social criada.");
      setSocialDialogOpen(false);
      setEditingSocialId(null);
      setSocialForm(EMPTY_SOCIAL_LINK);
      await queryClient.invalidateQueries({ queryKey: ["landing-cms-social-links", selectedTenantId] });
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao salvar a rede social."),
  });

  const removeMutation = useMutation({
    mutationFn: async ({ type, id }: { type: "area" | "differential" | "step" | "social"; id: string }) => {
      if (type === "area") return causeService.remove(id);
      if (type === "differential") return landingCmsService.removeDifferential(id);
      if (type === "step") return landingCmsService.removeProcessStep(id);
      return landingCmsService.removeSocialLink(id);
    },
    onSuccess: async (_data, variables) => {
      toast.success("Item removido.");
      const queryKeyMap = {
        area: "landing-cms-areas",
        differential: "landing-cms-differentials",
        step: "landing-cms-steps",
        social: "landing-cms-social-links",
      } as const;
      await queryClient.invalidateQueries({ queryKey: [queryKeyMap[variables.type], selectedTenantId] });
    },
    onError: (error: any) => toast.error(error?.message || "Falha ao remover o item."),
  });

  function updateThemeFields(patch: Record<string, any>) {
    setSettingsForm((prev) => ({
      ...prev,
      theme_text: JSON.stringify({ ...parseThemeSafely(prev.theme_text), ...patch }, null, 2),
    }));
  }

  function updateLandingColors(next: {
    primaryColor?: string;
    secondaryColor?: string;
    darkColor?: string;
    mutedSurfaceColor?: string;
    softSurfaceColor?: string;
    borderColor?: string;
    heroStartColor?: string;
    heroMidColor?: string;
    heroEndColor?: string;
    successColor?: string;
  }) {
    const primaryColor = normalizeHexColor(next.primaryColor || landingPrimaryColor, fallbackPrimaryColor);
    const secondaryColor = normalizeHexColor(next.secondaryColor || landingSecondaryColor, fallbackSecondaryColor);
    const darkColor = normalizeHexColor(next.darkColor || landingDarkColor, fallbackSecondaryColor);
    const mutedSurfaceColor = normalizeHexColor(next.mutedSurfaceColor || landingMutedSurfaceColor, DEFAULT_THEME_COLORS.muted);
    const softSurfaceColor = normalizeHexColor(next.softSurfaceColor || landingSoftSurfaceColor, DEFAULT_THEME_COLORS.soft);
    const borderColor = normalizeHexColor(next.borderColor || landingBorderColor, DEFAULT_THEME_COLORS.border);
    const heroStartColor = normalizeHexColor(next.heroStartColor || landingHeroStartColor, darkColor);
    const heroMidColor = normalizeHexColor(next.heroMidColor || landingHeroMidColor, DEFAULT_THEME_COLORS.heroMid);
    const heroEndColor = normalizeHexColor(next.heroEndColor || landingHeroEndColor, DEFAULT_THEME_COLORS.heroEnd);
    const successColor = normalizeHexColor(next.successColor || landingSuccessColor, DEFAULT_THEME_COLORS.success);

    updateThemeFields({
      accent: primaryColor,
      primary_color: primaryColor,
      accent_strong: secondaryColor,
      secondary_color: secondaryColor,
      dark_base: darkColor,
      surface_muted: mutedSurfaceColor,
      surface_soft: softSurfaceColor,
      border_soft: borderColor,
      border_color: borderColor,
      hero_start: heroStartColor,
      hero_color_from: heroStartColor,
      hero_mid: heroMidColor,
      hero_color_mid: heroMidColor,
      hero_end: heroEndColor,
      hero_color_to: heroEndColor,
      cta_success: successColor,
      whatsapp_color: successColor,
    });
  }

  function setSectionOpen(sectionId: SectionId, nextOpen: boolean) {
    setOpenSections((prev) => {
      if (nextOpen) return prev.includes(sectionId) ? prev : [...prev, sectionId];
      return prev.filter((item) => item !== sectionId);
    });
  }

  function openAreaDialog(item?: AreaAdminItem) {
    setEditingAreaId(item?.id || null);
    setAreaForm(
      item
        ? {
            name: item.name || "",
            area: item.area || "civel",
            description: item.description || "",
            landing_icon: item.landing_icon || "Scale",
            landing_link: item.landing_link || "",
            display_order: item.display_order || 0,
            show_on_landing: item.show_on_landing !== false,
            is_active: item.is_active !== false,
          }
        : EMPTY_AREA,
    );
    setAreaDialogOpen(true);
  }

  function openDifferentialDialog(item?: LandingDifferential) {
    setEditingDifferentialId(item?.id || null);
    setDifferentialForm(
      item
        ? {
            icon: item.icon || "Shield",
            title: item.title || "",
            description: item.description || "",
            sort_order: item.sort_order || 0,
            is_active: item.is_active !== false,
          }
        : EMPTY_DIFFERENTIAL,
    );
    setDifferentialDialogOpen(true);
  }

  function openStepDialog(item?: LandingProcessStep) {
    setEditingStepId(item?.id || null);
    setStepForm(
      item
        ? {
            icon: item.icon || "CheckCircle2",
            title: item.title || "",
            description: item.description || "",
            sort_order: item.sort_order || 0,
            is_active: item.is_active !== false,
          }
        : EMPTY_STEP,
    );
    setStepDialogOpen(true);
  }

  function openSocialDialog(item?: LandingSocialLink) {
    setEditingSocialId(item?.id || null);
    setSocialForm(
      item
        ? {
            label: item.label || "",
            url: item.url || "",
            icon: item.icon || "Instagram",
            sort_order: item.sort_order || 0,
            is_active: item.is_active !== false,
          }
        : EMPTY_SOCIAL_LINK,
    );
    setSocialDialogOpen(true);
  }

  const previewCompanyName = settingsForm.brand_name || selectedCompany?.name || "Seu escritório";
  const previewCompanyTagline = settingsForm.brand_tagline || "";
  const previewPublicUrl = buildGooglePreviewUrl(String((selectedCompany as any)?.slug || "").trim() || undefined);
  const googleTitle = settingsForm.seo_title || settingsForm.hero_title || previewCompanyName || "Site institucional";
  const googleDescription =
    settingsForm.seo_description ||
    settingsForm.hero_description ||
    "Apresentação institucional do escritório com serviços, diferenciais e canais de contato.";

  const showLoadingState = loadingAny && !settingsQuery.data;
  return (
    <div className="page-container space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="inline-flex rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Construtor visual do site institucional
          </div>
          <div>
            <h1 className="page-title">Site Institucional</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Organize as seções da landing page, ajuste a identidade visual e acompanhe o resultado em tempo real sem sair do painel.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Atualização imediata</Badge>
            <Badge variant="outline">Preview em tempo real</Badge>
            <Badge variant="outline">{sectionCount(settingsForm)} seções visíveis</Badge>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 xl:max-w-xl">
          {isSuperuser ? (
            <Card>
              <CardContent className="space-y-2 p-4">
                <Label>Empresa ativa</Label>
                <Select value={selectedTenantId || ""} onValueChange={setSelectedTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={() => saveSettingsMutation.mutate(settingsForm)} disabled={saveSettingsMutation.isPending || !selectedTenantId} className="gap-2">
              <Save className="h-4 w-4" />
              {saveSettingsMutation.isPending ? "Salvando..." : "Salvar e atualizar landing"}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(previewPublicUrl, "_blank", "noopener,noreferrer")}
              disabled={!selectedTenantId}
              className="gap-2"
            >
              <ArrowUpRight className="h-4 w-4" />
              Abrir landing pública
            </Button>
          </div>
        </div>
      </div>

      {showLoadingState ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
            <Settings2 className="h-4 w-4 animate-spin" />
            Carregando o construtor da landing page...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(520px,760px)] 2xl:grid-cols-[minmax(0,0.9fr)_minmax(620px,900px)]">
          <div className="space-y-5">
            <BuilderSection
              icon={Sparkles}
              title="Seção inicial"
              description="Ajuste a primeira dobra da página e veja como o escritório se apresenta logo no início."
              summary={heroAlignment === "left" ? "Alinhado à esquerda" : heroAlignment === "right" ? "Alinhado à direita" : "Centralizado"}
              open={openSections.includes("hero")}
              onToggleOpen={() => setSectionOpen("hero", !openSections.includes("hero"))}
              enabled={settingsForm.hero_enabled !== false}
              onEnabledChange={(checked) => setSettingsForm((prev) => ({ ...prev, hero_enabled: checked }))}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input value={settingsForm.hero_subtitle || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, hero_subtitle: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Alinhamento do conteúdo</Label>
                  <Select value={heroAlignment} onValueChange={(value) => updateThemeFields({ hero_alignment: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha o alinhamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Esquerda</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="right">Direita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título principal</Label>
                <Textarea value={settingsForm.hero_title || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, hero_title: e.target.value }))} rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={settingsForm.hero_description || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, hero_description: e.target.value }))} rows={4} />
              </div>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <Label>Imagem de fundo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setHeroImageFile(file);
                      if (file) {
                        setSettingsForm((prev) => ({ ...prev, clear_hero_background_image: false }));
                      }
                    }}
                  />
                  {settingsForm.hero_background_image_url ? (
                    <div className="rounded-xl border p-3 text-xs text-muted-foreground break-all">
                      Atual: {settingsForm.hero_background_image_url}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" className="gap-2" onClick={() => {
                    setHeroImageFile(null);
                    setSettingsForm((prev) => ({ ...prev, clear_hero_background_image: true, hero_background_image_url: "", hero_background_image: null }));
                  }}>
                    <Trash2 className="h-4 w-4" />
                    Remover imagem
                  </Button>
                </div>
              </div>
            </BuilderSection>

            <BuilderSection
              icon={Palette}
              title="Identidade e cores"
              description="Defina a assinatura visual do escritório e acompanhe o resultado em botões, destaques e fundo do site."
              summary={`${landingPrimaryColor} · ${landingDarkColor} · ${landingMutedSurfaceColor}`}
              open={openSections.includes("identity")}
              onToggleOpen={() => setSectionOpen("identity", !openSections.includes("identity"))}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome da marca</Label>
                  <Input value={settingsForm.brand_name || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, brand_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Linha de apoio</Label>
                  <Input value={settingsForm.brand_tagline || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, brand_tagline: e.target.value }))} />
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50/70 p-4">
                <p className="text-sm font-medium text-slate-900">Paleta completa do site</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Essas cores controlam o hero, seções claras, faixas escuras, bordas, destaques e o botão principal de WhatsApp.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <ColorField label="Cor principal" value={landingPrimaryColor} hint="marca e destaques" onChange={(value) => updateLandingColors({ primaryColor: value })} />
                  <ColorField label="Cor de apoio" value={landingSecondaryColor} hint="detalhes suaves" onChange={(value) => updateLandingColors({ secondaryColor: value })} />
                  <ColorField label="Fundo escuro" value={landingDarkColor} hint="rodapé e faixas" onChange={(value) => updateLandingColors({ darkColor: value })} />
                  <ColorField label="Fundo claro das seções" value={landingMutedSurfaceColor} hint="blocos bege claros" onChange={(value) => updateLandingColors({ mutedSurfaceColor: value })} />
                  <ColorField label="Fundo suave de apoio" value={landingSoftSurfaceColor} hint="caixas e imagem" onChange={(value) => updateLandingColors({ softSurfaceColor: value })} />
                  <ColorField label="Cor das bordas" value={landingBorderColor} hint="contornos e divisões" onChange={(value) => updateLandingColors({ borderColor: value })} />
                  <ColorField label="Hero: início" value={landingHeroStartColor} hint="degradê superior" onChange={(value) => updateLandingColors({ heroStartColor: value })} />
                  <ColorField label="Hero: meio" value={landingHeroMidColor} hint="degradê central" onChange={(value) => updateLandingColors({ heroMidColor: value })} />
                  <ColorField label="Hero: fim" value={landingHeroEndColor} hint="degradê final" onChange={(value) => updateLandingColors({ heroEndColor: value })} />
                  <ColorField label="Botão WhatsApp" value={landingSuccessColor} hint="CTA final" onChange={(value) => updateLandingColors({ successColor: value })} />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Paletas prontas</Label>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className="rounded-2xl border bg-white p-3 text-left transition hover:border-primary hover:shadow-sm"
                      onClick={() =>
                        updateLandingColors({
                          primaryColor: preset.colors.primary,
                          secondaryColor: preset.colors.secondary,
                          darkColor: preset.colors.dark,
                          mutedSurfaceColor: preset.colors.muted,
                          softSurfaceColor: preset.colors.soft,
                          borderColor: preset.colors.border,
                          heroStartColor: preset.colors.heroStart,
                          heroMidColor: preset.colors.heroMid,
                          heroEndColor: preset.colors.heroEnd,
                          successColor: preset.colors.success,
                        })
                      }
                    >
                      <div className="grid grid-cols-5 gap-2">
                        <span className="h-7 rounded-full" style={{ backgroundColor: preset.colors.primary }} />
                        <span className="h-7 rounded-full" style={{ backgroundColor: preset.colors.secondary }} />
                        <span className="h-7 rounded-full" style={{ backgroundColor: preset.colors.dark }} />
                        <span className="h-7 rounded-full border" style={{ backgroundColor: preset.colors.muted, borderColor: preset.colors.border }} />
                        <span className="h-7 rounded-full" style={{ backgroundColor: preset.colors.success }} />
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-900">{preset.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50/70 p-4">
                <p className="text-sm font-medium text-slate-900">Prévia dos componentes</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${landingHeroStartColor}, ${landingHeroMidColor}, ${landingHeroEndColor})` }}>
                    <p className="text-[0.68rem] uppercase tracking-[0.18em]" style={{ color: landingSecondaryColor }}>Hero</p>
                    <p className="mt-3 text-lg font-semibold">Faixa principal da landing</p>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ backgroundColor: landingMutedSurfaceColor, borderColor: landingBorderColor }}>
                    <p className="text-sm font-medium" style={{ color: landingDarkColor }}>Card claro</p>
                    <p className="mt-2 text-sm text-slate-600">Seções, blocos e caixas internas.</p>
                  </div>
                  <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: landingDarkColor }}>
                    <p className="text-sm font-medium" style={{ color: landingPrimaryColor }}>Faixa escura</p>
                    <p className="mt-2 text-sm text-white/75">Rodapé, diferenciais e fundos de destaque.</p>
                  </div>
                  <div className="rounded-2xl border p-4" style={{ backgroundColor: landingSoftSurfaceColor, borderColor: landingBorderColor }}>
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: landingPrimaryColor }}>
                        Botão principal
                      </button>
                      <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: landingSuccessColor }}>
                        WhatsApp
                      </button>
                    </div>
                    <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: landingBorderColor }} />
                  </div>
                </div>
              </div>
            </BuilderSection>

            <BuilderSection icon={ImageIcon} title="Sobre o escritório" description="Conte a história da marca, destaque autoridade e atualize a imagem institucional." summary={settingsForm.about_title ? "Conteúdo configurado" : "Aguardando texto"} open={openSections.includes("about")} onToggleOpen={() => setSectionOpen("about", !openSections.includes("about"))} enabled={settingsForm.about_enabled !== false} onEnabledChange={(checked) => setSettingsForm((prev) => ({ ...prev, about_enabled: checked }))}>
              <div className="space-y-2">
                <Label>Texto de apoio</Label>
                <Input value={settingsForm.about_eyebrow || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, about_eyebrow: e.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input value={settingsForm.about_title || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, about_title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Destaque</Label>
                  <Input value={settingsForm.about_highlight || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, about_highlight: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição principal</Label>
                <Textarea value={settingsForm.about_description || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, about_description: e.target.value }))} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Descrição complementar</Label>
                <Textarea value={settingsForm.about_secondary_description || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, about_secondary_description: e.target.value }))} rows={4} />
              </div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-2">
                  <Label>Imagem institucional</Label>
                  <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setAboutImageFile(file);
                    if (file) setSettingsForm((prev) => ({ ...prev, clear_about_image: false }));
                  }} />
                  {settingsForm.about_image_url ? <div className="rounded-xl border p-3 text-xs text-muted-foreground break-all">Atual: {settingsForm.about_image_url}</div> : null}
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" className="gap-2" onClick={() => {
                    setAboutImageFile(null);
                    setSettingsForm((prev) => ({ ...prev, clear_about_image: true, about_image_url: "", about_image: null }));
                  }}>
                    <Trash2 className="h-4 w-4" />
                    Remover imagem
                  </Button>
                </div>
              </div>
            </BuilderSection>

            <BuilderSection icon={Briefcase} title="Áreas e serviços" description="Ajuste os textos da seção e gerencie as áreas jurídicas que aparecem na landing." summary={`${visibleAreas.length} áreas visíveis`} open={openSections.includes("services")} onToggleOpen={() => setSectionOpen("services", !openSections.includes("services"))} enabled={settingsForm.services_enabled !== false} onEnabledChange={(checked) => setSettingsForm((prev) => ({ ...prev, services_enabled: checked }))} actions={<Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openAreaDialog()}><Plus className="h-4 w-4" />Adicionar área</Button>}>
              <div className="space-y-2"><Label>Texto de apoio</Label><Input value={settingsForm.services_eyebrow || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, services_eyebrow: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Título da seção</Label><Input value={settingsForm.services_title || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, services_title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={settingsForm.services_description || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, services_description: e.target.value }))} rows={4} /></div>
              {areas.length ? <div className="grid gap-4 md:grid-cols-2">{areas.slice().sort((left, right) => (left.display_order || 0) - (right.display_order || 0)).map((area) => (<div key={area.id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-slate-900">{area.name}</p><p className="mt-1 text-sm text-muted-foreground">{area.description || "Sem descrição cadastrada."}</p></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => openAreaDialog(area)}>Editar</Button><Button type="button" variant="outline" size="sm" onClick={() => removeMutation.mutate({ type: "area", id: area.id })}>Remover</Button></div></div><div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>Ícone: {area.landing_icon || "Scale"}</span><span>Ordem: {area.display_order || 0}</span><span>Landing: {area.show_on_landing === false ? "Oculta" : "Visível"}</span></div></div>))}</div> : null}
            </BuilderSection>

            <BuilderSection icon={Star} title="Diferenciais" description="Destaque autoridade, experiência e outros argumentos que fortalecem a confiança do visitante." summary={`${activeDifferentials.length} itens ativos`} open={openSections.includes("differentials")} onToggleOpen={() => setSectionOpen("differentials", !openSections.includes("differentials"))} enabled={settingsForm.differentials_enabled !== false} onEnabledChange={(checked) => setSettingsForm((prev) => ({ ...prev, differentials_enabled: checked }))} actions={<Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openDifferentialDialog()}><Plus className="h-4 w-4" />Novo diferencial</Button>}>
              <div className="space-y-2"><Label>Texto de apoio</Label><Input value={settingsForm.differentials_eyebrow || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, differentials_eyebrow: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Título</Label><Input value={settingsForm.differentials_title || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, differentials_title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={settingsForm.differentials_description || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, differentials_description: e.target.value }))} rows={3} /></div>
              {differentials.length ? <div className="grid gap-4 md:grid-cols-2">{differentials.slice().sort((left, right) => left.sort_order - right.sort_order).map((item) => (<div key={item.id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-slate-900">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => openDifferentialDialog(item)}>Editar</Button><Button type="button" variant="outline" size="sm" onClick={() => removeMutation.mutate({ type: "differential", id: item.id })}>Remover</Button></div></div><div className="mt-3 text-xs text-muted-foreground">Ícone: {item.icon} · Ordem: {item.sort_order} · {item.is_active === false ? "Oculto" : "Visível"}</div></div>))}</div> : <SectionEmpty title="Nenhum diferencial cadastrado" description="Cadastre os diferenciais que aparecem na faixa escura da página." actionLabel="Adicionar diferencial" onAction={() => openDifferentialDialog()} />}
            </BuilderSection>

            <BuilderSection icon={Mail} title="Fluxo de atendimento" description="Organize o passo a passo que explica como o escritório atende um novo cliente." summary={`${activeSteps.length} etapas ativas`} open={openSections.includes("process")} onToggleOpen={() => setSectionOpen("process", !openSections.includes("process"))} enabled={settingsForm.process_enabled !== false} onEnabledChange={(checked) => setSettingsForm((prev) => ({ ...prev, process_enabled: checked }))} actions={<Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openStepDialog()}><Plus className="h-4 w-4" />Nova etapa</Button>}>
              <div className="space-y-2"><Label>Texto de apoio</Label><Input value={settingsForm.process_eyebrow || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, process_eyebrow: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Título</Label><Input value={settingsForm.process_title || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, process_title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={settingsForm.process_description || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, process_description: e.target.value }))} rows={3} /></div>
              {steps.length ? <div className="grid gap-4 md:grid-cols-2">{steps.slice().sort((left, right) => left.sort_order - right.sort_order).map((item) => (<div key={item.id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-slate-900">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => openStepDialog(item)}>Editar</Button><Button type="button" variant="outline" size="sm" onClick={() => removeMutation.mutate({ type: "step", id: item.id })}>Remover</Button></div></div><div className="mt-3 text-xs text-muted-foreground">Ícone: {item.icon} · Ordem: {item.sort_order} · {item.is_active === false ? "Oculta" : "Visível"}</div></div>))}</div> : <SectionEmpty title="Nenhuma etapa cadastrada" description="Crie o fluxo para explicar como o atendimento acontece do primeiro contato até a execução." actionLabel="Adicionar etapa" onAction={() => openStepDialog()} />}
            </BuilderSection>
            <BuilderSection icon={Globe} title="Blog institucional" description="Controle a exibição do bloco de artigos na landing e acesse o módulo editorial completo." summary={`${publishedPosts.length} artigos publicados`} open={openSections.includes("blog")} onToggleOpen={() => setSectionOpen("blog", !openSections.includes("blog"))} enabled={settingsForm.blog_enabled !== false} onEnabledChange={(checked) => setSettingsForm((prev) => ({ ...prev, blog_enabled: checked }))}>
              <div className="rounded-2xl border bg-slate-50/70 p-4"><p className="text-sm font-medium text-slate-900">Exibição na landing</p><p className="mt-1 text-sm text-muted-foreground">Quando ativado, o site público mostra os artigos mais recentes cadastrados no módulo de blog.</p></div>
              <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" className="gap-2" asChild><a href="/app/blog">Abrir módulo do blog<ArrowUpRight className="h-4 w-4" /></a></Button></div>
              {posts.length ? <div className="grid gap-4 md:grid-cols-2">{posts.slice(0, 4).map((post) => (<div key={post.id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-slate-900">{post.title}</p><p className="mt-1 text-sm text-muted-foreground">{post.summary || "Sem resumo cadastrado."}</p></div><Badge variant={post.is_published === false ? "secondary" : "outline"}>{post.is_published === false ? "Rascunho" : "Publicado"}</Badge></div></div>))}</div> : <SectionEmpty title="Nenhum artigo encontrado" description="Crie artigos no módulo de blog para fortalecer a presença digital do escritório." actionLabel="Ir para o blog" onAction={() => window.location.assign("/app/blog")} />}
            </BuilderSection>

            <BuilderSection icon={MapPin} title="Mapa" description="Controle a exibição do mapa e informe uma URL incorporada quando quiser usar uma localização específica." summary={settingsForm.map_enabled !== false ? "Mapa visível" : "Mapa oculto"} open={openSections.includes("contact")} onToggleOpen={() => setSectionOpen("contact", !openSections.includes("contact"))} enabled={settingsForm.map_enabled !== false} onEnabledChange={(checked) => setSettingsForm((prev) => ({ ...prev, map_enabled: checked }))}>
              <div className="rounded-2xl border bg-slate-50/70 p-4"><p className="text-sm font-medium text-slate-900">Mapa público</p><p className="mt-1 text-sm text-muted-foreground">A landing usa o endereço da empresa automaticamente. Se preferir, você pode informar abaixo uma URL incorporada do Google Maps.</p></div>
              <div className="space-y-2"><Label>URL incorporada do Google Maps</Label><Input value={settingsForm.map_embed_url || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, map_embed_url: e.target.value }))} /></div>
            </BuilderSection>

            <BuilderSection icon={Eye} title="Chamada final" description="Ajuste o último bloco de conversão antes do rodapé para manter a página convincente até o fim." summary={settingsForm.final_cta_enabled !== false ? "Ativa" : "Oculta"} open={openSections.includes("finalCta")} onToggleOpen={() => setSectionOpen("finalCta", !openSections.includes("finalCta"))} enabled={settingsForm.final_cta_enabled !== false} onEnabledChange={(checked) => setSettingsForm((prev) => ({ ...prev, final_cta_enabled: checked }))}>
              <div className="space-y-2"><Label>Texto de apoio</Label><Input value={settingsForm.final_cta_eyebrow || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, final_cta_eyebrow: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Título</Label><Input value={settingsForm.final_cta_title || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, final_cta_title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={settingsForm.final_cta_description || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, final_cta_description: e.target.value }))} rows={3} /></div>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]"><div className="space-y-2"><Label>Imagem de fundo</Label><Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setFinalImageFile(file);
                if (file) setSettingsForm((prev) => ({ ...prev, clear_final_cta_background_image: false }));
              }} />{settingsForm.final_cta_background_image_url ? <div className="rounded-xl border p-3 text-xs text-muted-foreground break-all">Atual: {settingsForm.final_cta_background_image_url}</div> : null}</div><div className="flex items-end"><Button type="button" variant="outline" className="gap-2" onClick={() => {
                setFinalImageFile(null);
                setSettingsForm((prev) => ({ ...prev, clear_final_cta_background_image: true, final_cta_background_image_url: "", final_cta_background_image: null }));
              }}><Trash2 className="h-4 w-4" />Remover imagem</Button></div></div>
            </BuilderSection>

            <BuilderSection icon={MapPin} title="Rodapé" description="Atualize os dados institucionais, os canais de contato e as redes sociais do escritório." summary={`${activeSocialLinks.length} redes ativas`} open={openSections.includes("footer")} onToggleOpen={() => setSectionOpen("footer", !openSections.includes("footer"))} enabled={settingsForm.footer_enabled !== false} onEnabledChange={(checked) => setSettingsForm((prev) => ({ ...prev, footer_enabled: checked }))} actions={<Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => openSocialDialog()}><Plus className="h-4 w-4" />Nova rede</Button>}>
              <div className="space-y-2"><Label>Descrição institucional</Label><Textarea value={settingsForm.footer_description || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, footer_description: e.target.value }))} rows={3} /></div>
              <div className="space-y-2"><Label>Copyright</Label><Input value={settingsForm.footer_copyright || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, footer_copyright: e.target.value }))} /></div>
              {socialLinks.length ? <div className="grid gap-4 md:grid-cols-2">{socialLinks.slice().sort((left, right) => left.sort_order - right.sort_order).map((item) => (<div key={item.id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-slate-900">{item.label}</p><p className="mt-1 text-sm text-muted-foreground">{item.url}</p></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => openSocialDialog(item)}>Editar</Button><Button type="button" variant="outline" size="sm" onClick={() => removeMutation.mutate({ type: "social", id: item.id })}>Remover</Button></div></div><div className="mt-3 text-xs text-muted-foreground">Ícone: {item.icon} · Ordem: {item.sort_order} · {item.is_active === false ? "Oculta" : "Visível"}</div></div>))}</div> : <SectionEmpty title="Nenhuma rede social cadastrada" description="Adicione Instagram, LinkedIn, WhatsApp ou outros canais para completar o rodapé." actionLabel="Adicionar rede social" onAction={() => openSocialDialog()} />}
            </BuilderSection>

            <BuilderSection icon={Rocket} title="SEO e publicação" description="Defina como o site aparece no Google e acompanhe a URL pública da landing institucional." summary="Atualização imediata" open={openSections.includes("seo")} onToggleOpen={() => setSectionOpen("seo", !openSections.includes("seo"))}>
              <div className="rounded-2xl border bg-slate-50/70 p-4"><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-medium text-slate-900">Atualização da landing pública</p><p className="mt-1 text-sm text-muted-foreground">As alterações salvas aqui atualizam diretamente o site institucional da empresa ativa.</p></div><Badge>Ao vivo</Badge></div></div>
              <div className="space-y-2"><Label>Título para o Google</Label><Input value={settingsForm.seo_title || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, seo_title: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Descrição para o Google</Label><Textarea value={settingsForm.seo_description || ""} onChange={(e) => setSettingsForm((prev) => ({ ...prev, seo_description: e.target.value }))} rows={3} /></div>
              <div className="rounded-2xl border bg-white p-5"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground"><Eye className="h-4 w-4" />Preview do Google</div><div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4"><p className="text-xs text-emerald-700">{previewPublicUrl}</p><p className="mt-2 text-lg font-medium text-blue-700">{googleTitle}</p><p className="mt-2 text-sm leading-6 text-slate-600">{googleDescription}</p></div></div>
            </BuilderSection>
          </div>

          <Card className="overflow-hidden border-slate-200 shadow-sm xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)]">
            <CardHeader className="border-b bg-slate-950 text-white">
              <div className="flex flex-col gap-4"><div className="flex items-start justify-between gap-4"><div><CardTitle className="text-white">Preview em tempo real</CardTitle><CardDescription className="text-slate-300">Acompanhe o resultado das alterações antes de salvar e atualizar a landing do escritório.</CardDescription></div><ToggleGroup type="single" value={previewDevice} onValueChange={(value) => { if (value === "desktop" || value === "mobile") setPreviewDevice(value); }} variant="outline" size="sm"><ToggleGroupItem value="desktop" aria-label="Visualização desktop" className="gap-2"><Monitor className="h-4 w-4" />Desktop</ToggleGroupItem><ToggleGroupItem value="mobile" aria-label="Visualização mobile" className="gap-2"><Smartphone className="h-4 w-4" />Mobile</ToggleGroupItem></ToggleGroup></div></div>
            </CardHeader>
            <div className="bg-[radial-gradient(circle_at_top,_rgba(29,78,216,0.18),_transparent_52%),linear-gradient(180deg,#eef4ff_0%,#f8fafc_100%)] p-4"><ScrollArea className="h-[calc(100vh-13.5rem)] rounded-[28px]"><div className={cn("mx-auto transition-all duration-300", previewDevice === "mobile" ? "max-w-[390px]" : "max-w-[560px]")}><div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.12)]" style={previewDevice === "desktop" ? { width: 1180, zoom: 0.42 } : undefined}><LandingPreview device={previewDevice} publicUrl={previewPublicUrl} companyName={previewCompanyName} companyTagline={previewCompanyTagline} companyPhone={selectedCompany?.phone || ""} companyEmail={selectedCompany?.email || ""} companyAddress={selectedCompany?.address || ""} companyLogoUrl={selectedCompany?.logo_url || ""} settings={deferredPreviewSettings} areas={visibleAreas} differentials={activeDifferentials} steps={activeSteps} posts={publishedPosts} socialLinks={activeSocialLinks} /></div></div></ScrollArea></div>
          </Card>
        </div>
      )}

      <Dialog open={areaDialogOpen} onOpenChange={setAreaDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingAreaId ? "Editar área" : "Nova área"}</DialogTitle><DialogDescription>Esses itens alimentam a seção de áreas e serviços da landing.</DialogDescription></DialogHeader><div className="space-y-4"><Input placeholder="Nome da área" value={areaForm.name} onChange={(e) => setAreaForm((prev) => ({ ...prev, name: e.target.value }))} /><Select value={areaForm.area} onValueChange={(value) => setAreaForm((prev) => ({ ...prev, area: value }))}><SelectTrigger><SelectValue placeholder="Área jurídica" /></SelectTrigger><SelectContent><SelectItem value="civel">Cível</SelectItem><SelectItem value="trabalhista">Trabalhista</SelectItem><SelectItem value="criminal">Criminal</SelectItem><SelectItem value="tributario">Tributário</SelectItem><SelectItem value="empresarial">Empresarial</SelectItem><SelectItem value="familia">Família</SelectItem><SelectItem value="consumidor">Consumidor</SelectItem></SelectContent></Select><Textarea placeholder="Descrição" value={areaForm.description} onChange={(e) => setAreaForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} /><div className="grid gap-4 md:grid-cols-2"><Input placeholder="Ícone" value={areaForm.landing_icon} onChange={(e) => setAreaForm((prev) => ({ ...prev, landing_icon: e.target.value }))} /><Input placeholder="Link" value={areaForm.landing_link} onChange={(e) => setAreaForm((prev) => ({ ...prev, landing_link: e.target.value }))} /></div><div className="grid gap-4 md:grid-cols-3"><Input type="number" placeholder="Ordem" value={areaForm.display_order} onChange={(e) => setAreaForm((prev) => ({ ...prev, display_order: Number(e.target.value) }))} /><div className="flex items-center justify-between rounded-xl border px-3 py-2"><span className="text-sm">Mostrar na landing</span><Switch checked={areaForm.show_on_landing} onCheckedChange={(checked) => setAreaForm((prev) => ({ ...prev, show_on_landing: checked }))} /></div><div className="flex items-center justify-between rounded-xl border px-3 py-2"><span className="text-sm">Ativa</span><Switch checked={areaForm.is_active} onCheckedChange={(checked) => setAreaForm((prev) => ({ ...prev, is_active: checked }))} /></div></div><Button className="w-full" onClick={() => saveAreaMutation.mutate()}>{saveAreaMutation.isPending ? "Salvando..." : "Salvar área"}</Button></div></DialogContent></Dialog>
      <Dialog open={differentialDialogOpen} onOpenChange={setDifferentialDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingDifferentialId ? "Editar diferencial" : "Novo diferencial"}</DialogTitle><DialogDescription>Esses itens aparecem na faixa de diferenciais da landing.</DialogDescription></DialogHeader><div className="space-y-4"><Input placeholder="Ícone" value={differentialForm.icon} onChange={(e) => setDifferentialForm((prev) => ({ ...prev, icon: e.target.value }))} /><Input placeholder="Título" value={differentialForm.title} onChange={(e) => setDifferentialForm((prev) => ({ ...prev, title: e.target.value }))} /><Textarea placeholder="Descrição" value={differentialForm.description} onChange={(e) => setDifferentialForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} /><div className="grid gap-4 md:grid-cols-2"><Input type="number" placeholder="Ordem" value={differentialForm.sort_order} onChange={(e) => setDifferentialForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))} /><div className="flex items-center justify-between rounded-xl border px-3 py-2"><span className="text-sm">Ativo</span><Switch checked={differentialForm.is_active} onCheckedChange={(checked) => setDifferentialForm((prev) => ({ ...prev, is_active: checked }))} /></div></div><Button className="w-full" onClick={() => saveDifferentialMutation.mutate()}>{saveDifferentialMutation.isPending ? "Salvando..." : "Salvar diferencial"}</Button></div></DialogContent></Dialog>
      <Dialog open={stepDialogOpen} onOpenChange={setStepDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingStepId ? "Editar etapa" : "Nova etapa"}</DialogTitle><DialogDescription>Etapas que alimentam o fluxo de atendimento da landing.</DialogDescription></DialogHeader><div className="space-y-4"><Input placeholder="Ícone" value={stepForm.icon} onChange={(e) => setStepForm((prev) => ({ ...prev, icon: e.target.value }))} /><Input placeholder="Título" value={stepForm.title} onChange={(e) => setStepForm((prev) => ({ ...prev, title: e.target.value }))} /><Textarea placeholder="Descrição" value={stepForm.description} onChange={(e) => setStepForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} /><div className="grid gap-4 md:grid-cols-2"><Input type="number" placeholder="Ordem" value={stepForm.sort_order} onChange={(e) => setStepForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))} /><div className="flex items-center justify-between rounded-xl border px-3 py-2"><span className="text-sm">Ativa</span><Switch checked={stepForm.is_active} onCheckedChange={(checked) => setStepForm((prev) => ({ ...prev, is_active: checked }))} /></div></div><Button className="w-full" onClick={() => saveStepMutation.mutate()}>{saveStepMutation.isPending ? "Salvando..." : "Salvar etapa"}</Button></div></DialogContent></Dialog>
      <Dialog open={socialDialogOpen} onOpenChange={setSocialDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingSocialId ? "Editar rede social" : "Nova rede social"}</DialogTitle><DialogDescription>Esses links aparecem no rodapé da landing pública.</DialogDescription></DialogHeader><div className="space-y-4"><Input placeholder="Nome" value={socialForm.label} onChange={(e) => setSocialForm((prev) => ({ ...prev, label: e.target.value }))} /><Input placeholder="URL" value={socialForm.url} onChange={(e) => setSocialForm((prev) => ({ ...prev, url: e.target.value }))} /><Input placeholder="Ícone" value={socialForm.icon} onChange={(e) => setSocialForm((prev) => ({ ...prev, icon: e.target.value }))} /><Input type="number" placeholder="Ordem" value={socialForm.sort_order} onChange={(e) => setSocialForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))} /><div className="flex items-center justify-between rounded-xl border px-3 py-2"><span className="text-sm">Ativa</span><Switch checked={socialForm.is_active} onCheckedChange={(checked) => setSocialForm((prev) => ({ ...prev, is_active: checked }))} /></div><Button className="w-full" onClick={() => saveSocialMutation.mutate()}>{saveSocialMutation.isPending ? "Salvando..." : "Salvar rede social"}</Button></div></DialogContent></Dialog>
    </div>
  );
}
