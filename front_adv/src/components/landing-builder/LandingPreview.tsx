import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Scale,
  Shield,
  Star,
  Twitter,
  Users,
  Youtube,
  Menu,
} from "lucide-react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  LandingDifferential,
  LandingPost,
  LandingProcessStep,
  LandingSettings,
  LandingSocialLink,
} from "@/types/landing";

export type LandingPreviewDevice = "desktop" | "mobile";

type AreaPreviewItem = {
  id: string;
  name?: string;
  description?: string | null;
  landing_icon?: string;
  landing_link?: string;
  show_on_landing?: boolean;
  is_active?: boolean;
};

type LandingPreviewProps = {
  device: LandingPreviewDevice;
  companyName: string;
  companyTagline?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  companyLogoUrl?: string;
  publicUrl?: string;
  settings: LandingSettings & { theme?: Record<string, any> };
  areas: AreaPreviewItem[];
  differentials: LandingDifferential[];
  steps: LandingProcessStep[];
  posts: LandingPost[];
  socialLinks: LandingSocialLink[];
};

const ICON_MAP: Record<string, any> = {
  BookOpenText,
  CheckCircle2,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Scale,
  Shield,
  Star,
  Twitter,
  Users,
  Youtube,
};

function pickThemeValue(theme: Record<string, any> | undefined, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = theme?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function buildThemeStyle(settings: LandingSettings | undefined) {
  const theme = settings?.theme || {};
  return {
    "--landing-accent": pickThemeValue(theme, ["accent", "primary_color"], "#c9ab76"),
    "--landing-accent-strong": pickThemeValue(theme, ["accent_strong", "secondary_color"], "#f0d7a1"),
    "--landing-dark-base": pickThemeValue(theme, ["dark_base"], "#081d36"),
    "--landing-surface-muted": pickThemeValue(theme, ["surface_muted"], "#f5f2ec"),
    "--landing-surface-soft": pickThemeValue(theme, ["surface_soft"], "#f6f3ed"),
    "--landing-border-soft": pickThemeValue(theme, ["border_soft", "border_color"], "#d8d5cf"),
    "--landing-cta-success": pickThemeValue(theme, ["cta_success", "whatsapp_color"], "#30d366"),
    "--landing-hero-start": pickThemeValue(theme, ["hero_start", "hero_color_from"], "#081d36"),
    "--landing-hero-mid": pickThemeValue(theme, ["hero_mid", "hero_color_mid"], "#0a2649"),
    "--landing-hero-end": pickThemeValue(theme, ["hero_end", "hero_color_to"], "#0d355f"),
  } as Record<string, string>;
}

function hasText(...values: Array<string | null | undefined>) {
  return values.some((value) => !!String(value || "").trim());
}

function sectionVisible(enabled: boolean | undefined, hasContentValue: boolean) {
  return enabled !== false && hasContentValue;
}

function actionVisible(label?: string | null, href?: string | null) {
  return !!String(label || "").trim() && !!String(href || "").trim();
}

function buildMapEmbedUrl(source?: string | null, addressFallback?: string | null) {
  const primary = String(source || "").trim();
  if (primary) {
    if (/^https?:\/\//i.test(primary)) return primary;
    return `https://www.google.com/maps?q=${encodeURIComponent(primary)}&output=embed`;
  }

  const address = String(addressFallback || "").trim();
  if (!address) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
}

function resolveActionHref(raw?: string | null, fallback = "") {
  const value = String(raw || "").trim();
  if (!value) return fallback;
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(value)) return value;

  const digits = value.replace(/\D/g, "");
  if (digits) return `https://wa.me/${digits}`;

  return value;
}

function colorToRgba(color: string | undefined, opacity: number, fallback = "#081d36") {
  const input = String(color || fallback).trim() || fallback;
  const normalized = input.replace("#", "");

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
    const red = Number.parseInt(normalized[0] + normalized[0], 16);
    const green = Number.parseInt(normalized[1] + normalized[1], 16);
    const blue = Number.parseInt(normalized[2] + normalized[2], 16);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  return input;
}

function uiIcon(name?: string, fallback: any = Scale) {
  return ICON_MAP[name || ""] || fallback;
}

function socialIcon(name?: string) {
  return ICON_MAP[name || "Globe"] || Globe;
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function heroAlignmentFrom(theme: Record<string, any> | undefined) {
  const value = String(theme?.hero_alignment || "center").toLowerCase();
  if (value === "left" || value === "right" || value === "center") return value;
  return "center";
}

export function LandingPreview(props: LandingPreviewProps) {
  const {
    device,
    companyName,
    companyTagline,
    companyPhone,
    companyEmail,
    companyAddress,
    companyLogoUrl,
    publicUrl,
    settings,
    areas,
    differentials,
    steps,
    posts,
    socialLinks,
  } = props;

  const isMobile = device === "mobile";
  const themeStyle = buildThemeStyle(settings);
  const theme = settings.theme || {};
  const heroAlignment = heroAlignmentFrom(theme);
  const heroImage = settings.hero_background_image_url || settings.hero_background_image || "";
  const aboutImage = settings.about_image_url || settings.about_image || "";
  const finalImage = settings.final_cta_background_image_url || settings.final_cta_background_image || "";
  const overlayOpacity = Number(settings.hero_overlay_opacity ?? 0.74);
  const heroOverlay = colorToRgba(settings.hero_overlay_color, overlayOpacity);
  const finalOverlay = colorToRgba(settings.hero_overlay_color, 0.86);
  const navOverlay = colorToRgba(pickThemeValue(theme, ["dark_base"], "#081d36"), 0.9);

  const primaryCtaLabel = settings.hero_primary_cta_label || "Agendar consulta";
  const servicesButtonText = settings.services_button_text || "Fale pelo WhatsApp";
  const finalCtaButtonText = settings.final_cta_button_text || "Fale pelo WhatsApp";
  const primaryCtaHref = resolveActionHref(settings.hero_primary_cta_url, "#contato");
  const whatsappHref = resolveActionHref(settings.final_cta_button_url || companyPhone, primaryCtaHref);
  const finalCtaButtonUrl = resolveActionHref(settings.final_cta_button_url, whatsappHref);
  const clientPortalLabel = settings.client_portal_label || "Ãrea do Cliente";
  const clientPortalHref = settings.client_portal_url || "/portal/login";
  const internalAreaLabel = settings.internal_area_label || "Ãrea Interna";
  const internalAreaHref = settings.internal_area_url || "/app/login";
  const mapUrl = buildMapEmbedUrl(settings.map_embed_url, companyAddress);

  const activeAreas = areas.filter((item) => item.show_on_landing !== false && item.is_active !== false);
  const activeDifferentials = differentials.filter((item) => item.is_active !== false);
  const activeSteps = steps.filter((item) => item.is_active !== false);
  const publishedPosts = posts.filter((item) => item.is_published !== false);
  const activeSocialLinks = socialLinks.filter((item) => item.is_active !== false);

  const showHero = sectionVisible(
    settings.hero_enabled,
    hasText(settings.hero_subtitle, settings.hero_title, settings.hero_description, primaryCtaLabel, heroImage),
  );
  const showServices = sectionVisible(settings.services_enabled, activeAreas.length > 0);
  const showAbout = sectionVisible(
    settings.about_enabled,
    hasText(
      settings.about_eyebrow,
      settings.about_title,
      settings.about_highlight,
      settings.about_description,
      settings.about_secondary_description,
      aboutImage,
    ),
  );
  const showDifferentials = sectionVisible(settings.differentials_enabled, activeDifferentials.length > 0);
  const showProcess = sectionVisible(settings.process_enabled, activeSteps.length > 0);
  const showBlog = sectionVisible(settings.blog_enabled, publishedPosts.length > 0);
  const showMap = sectionVisible(settings.map_enabled, !!mapUrl);
  const showFinalCta = sectionVisible(
    settings.final_cta_enabled,
    hasText(settings.final_cta_eyebrow, settings.final_cta_title, settings.final_cta_description, finalCtaButtonText, finalImage),
  );

  const navLinks = [
    { label: "Home", url: "#inicio" },
    showAbout ? { label: "Sobre", url: "#sobre" } : null,
    showServices ? { label: "Serviços", url: "#servicos" } : null,
    showBlog ? { label: "Artigos", url: "#blog" } : null,
    (showMap || showFinalCta) ? { label: "Contato", url: "#contato" } : null,
  ].filter(Boolean) as Array<{ label: string; url: string }>;
  const accessLinks = [
    actionVisible(clientPortalLabel, clientPortalHref) ? { label: clientPortalLabel, url: clientPortalHref } : null,
    actionVisible(internalAreaLabel, internalAreaHref) ? { label: internalAreaLabel, url: internalAreaHref } : null,
  ].filter(Boolean) as Array<{ label: string; url: string }>;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroContainerClass =
    heroAlignment === "left"
      ? "max-w-3xl text-left"
      : heroAlignment === "right"
        ? "ml-auto max-w-3xl text-right"
        : "mx-auto max-w-3xl text-center";

  const heroActionClass =
    heroAlignment === "left" ? "justify-start" : heroAlignment === "right" ? "justify-end" : "justify-center";

  return (
    <div className="bg-white text-slate-900" style={themeStyle as any}>
      <section
        className="text-white"
        style={{
          backgroundImage: `${
            heroImage ? `linear-gradient(${heroOverlay}, ${heroOverlay}), url(${heroImage}), ` : ""
          }linear-gradient(135deg, var(--landing-hero-start), var(--landing-hero-mid), var(--landing-hero-end))`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="border-b border-white/10 backdrop-blur-sm" style={{ backgroundColor: navOverlay }}>
          {isMobile ? (
            <div className="mx-auto max-w-7xl px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {companyLogoUrl ? (
                    <img src={companyLogoUrl} alt={companyName || "Logo"} className="h-10 w-10 shrink-0 rounded-sm object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-white/10">
                      <Scale className="h-5 w-5" style={{ color: "var(--landing-accent)" }} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-serif text-base uppercase leading-tight" style={{ color: "var(--landing-accent)" }}>
                      {companyName || "Nome do escritório"}
                    </p>
                    {companyTagline ? (
                      <p className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] leading-4 text-white/60">{companyTagline}</p>
                    ) : null}
                  </div>
                </div>
                {accessLinks.length ? (
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-none border border-white/20 px-3 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-white/10"
                    aria-expanded={mobileMenuOpen}
                    aria-label="Abrir menu"
                  >
                    <Menu className="h-4 w-4" />
                    Menu
                  </button>
                ) : null}
              </div>

              {mobileMenuOpen && accessLinks.length ? (
                <div className="mt-4 space-y-2 border border-white/10 bg-white/5 p-3">
                  {accessLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.url}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-none border border-white/20 px-3 py-2.5 text-center text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-white/10"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5">
              <div className="flex min-w-0 items-center gap-3">
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt={companyName || "Logo"} className="h-12 w-12 rounded-sm object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-white/10 bg-white/10">
                    <Scale className="h-5 w-5" style={{ color: "var(--landing-accent)" }} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-serif text-2xl uppercase" style={{ color: "var(--landing-accent)" }}>
                    {companyName || "Nome do escritório"}
                  </p>
                  {companyTagline ? (
                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-white/60">{companyTagline}</p>
                  ) : null}
                </div>
              </div>

              <div className="hidden items-center gap-7 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/78 lg:flex">
                {navLinks.map((item) => (
                  <a key={item.label} href={item.url} className="hover:text-white">
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {accessLinks.map((item) => (
                  <a key={item.label} href={item.url} className="rounded-none border border-white/20 px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-white/10">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        {showHero ? (
          <div className={cn("mx-auto", isMobile ? "px-4 pb-12 pt-10" : "px-6 pb-20 pt-16")}>
            <div className={heroContainerClass}>
              {settings.hero_subtitle ? (
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--landing-accent-strong)" }}>
                  {settings.hero_subtitle}
                </p>
              ) : null}
              {settings.hero_title ? (
                <h1 className={cn("mt-5 font-bold uppercase leading-[1.04] tracking-[-0.04em]", isMobile ? "text-[1.9rem]" : "text-[3.5rem]")}>
                  {settings.hero_title}
                </h1>
              ) : null}
              {settings.hero_description ? (
                <p className={cn("mt-4 text-white/82", isMobile ? "text-sm leading-7" : "text-base leading-8")}>
                  {settings.hero_description}
                </p>
              ) : null}
              {actionVisible(primaryCtaLabel, primaryCtaHref) ? (
                <div className={cn("mt-8 flex", heroActionClass)}>
                  <Button
                    className="rounded-none bg-white/5 px-6 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white hover:bg-white/10"
                    style={{ borderColor: "var(--landing-accent)" }}
                  >
                    {primaryCtaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {showServices ? (
        <section id="servicos" className={cn(isMobile ? "px-4 py-10" : "px-6 py-14")} style={{ backgroundColor: "var(--landing-surface-muted)" }}>
          <div className="mx-auto max-w-6xl">
            <div className={cn(isMobile ? "text-left" : "mx-auto max-w-3xl text-center")}>
              {settings.services_eyebrow ? <p className="text-sm italic text-slate-500">{settings.services_eyebrow}</p> : null}
              <h2 className={cn("mt-3 font-serif font-medium", isMobile ? "text-2xl" : "text-3xl")} style={{ color: "var(--landing-dark-base)" }}>
                {settings.services_title || "Ãreas e serviÃ§os"}
              </h2>
              {settings.services_description ? <p className="mt-3 text-sm leading-7 text-slate-600">{settings.services_description}</p> : null}
            </div>
            <div className={cn("mt-8 grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3")}>
              {activeAreas.slice(0, isMobile ? 3 : 6).map((area) => {
                const Icon = uiIcon(area.landing_icon, Scale);
                return (
                  <Card key={area.id} className="rounded-none bg-white shadow-none" style={{ borderColor: "var(--landing-border-soft)" }}>
                    <CardContent className="p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ backgroundColor: "var(--landing-dark-base)" }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-5 font-serif text-xl" style={{ color: "var(--landing-dark-base)" }}>{area.name || "Nova Ã¡rea"}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{area.description || "DescriÃ§Ã£o da Ã¡rea de atuaÃ§Ã£o."}</p>
                      {servicesButtonText ? (
                        <Button className="mt-5 rounded-full px-5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white hover:opacity-90" style={{ backgroundColor: "var(--landing-dark-base)" }}>
                          {servicesButtonText}
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {showAbout ? (
        <section id="sobre" className={cn("bg-white", isMobile ? "px-4 py-10" : "px-6 py-14")}>
          <div className={cn("mx-auto gap-8", isMobile ? "max-w-6xl" : "grid max-w-6xl grid-cols-[minmax(300px,0.9fr)_minmax(0,1.1fr)] items-center")}>
            {aboutImage ? (
              <div className={cn("overflow-hidden border", isMobile ? "mb-6" : "")} style={{ borderColor: "var(--landing-border-soft)", backgroundColor: "var(--landing-surface-soft)" }}>
                <img src={aboutImage} alt={settings.about_title || companyName} className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div>
              {settings.about_eyebrow ? <p className="text-sm italic text-slate-500">{settings.about_eyebrow}</p> : null}
              <h2 className={cn("mt-3 font-serif font-medium uppercase", isMobile ? "text-2xl" : "text-4xl")} style={{ color: "var(--landing-dark-base)" }}>
                {settings.about_title || "Sobre o escritÃ³rio"}
              </h2>
              {settings.about_highlight ? (
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--landing-accent)" }}>{settings.about_highlight}</p>
              ) : null}
              {settings.about_description ? <p className="mt-5 text-sm leading-8 text-slate-600">{settings.about_description}</p> : null}
              {settings.about_secondary_description ? (
                <p className="mt-4 text-sm leading-8 text-slate-600">{settings.about_secondary_description}</p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {showDifferentials ? (
        <section style={{ backgroundColor: "var(--landing-surface-muted)" }}>
          <div className={cn("text-white", isMobile ? "px-4 py-10" : "px-6 py-14")} style={{ backgroundColor: "var(--landing-dark-base)" }}>
            <div className="mx-auto max-w-6xl">
              {showDifferentials ? (
                <div>
                  {settings.differentials_eyebrow ? <p className="text-sm italic text-white/72">{settings.differentials_eyebrow}</p> : null}
                  <h2 className={cn("mt-3 font-serif font-medium", isMobile ? "text-2xl" : "text-4xl")}>
                    {settings.differentials_title || "Diferenciais"}
                  </h2>
                  {settings.differentials_description ? (
                    <p className="mt-4 max-w-2xl text-sm leading-8 text-white/72">{settings.differentials_description}</p>
                  ) : null}
                  <div className={cn("mt-8 grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-3")}>
                    {activeDifferentials.slice(0, isMobile ? 3 : 6).map((item) => {
                      const Icon = uiIcon(item.icon, Shield);
                      return (
                        <div key={item.id} className="border border-white/12 bg-white/[0.05] px-4 py-5">
                          <Icon className="h-7 w-7" style={{ color: "var(--landing-accent)" }} />
                          <h3 className="mt-4 font-serif text-xl">{item.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-white/70">{item.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {showProcess ? (
            <div className={cn(isMobile ? "px-4 pb-10 pt-10" : "px-6 pb-16 pt-16")}>
              <div className="mx-auto max-w-6xl">
                {settings.process_eyebrow ? <p className="text-sm italic text-slate-500">{settings.process_eyebrow}</p> : null}
                <h2 className={cn("mt-3 font-serif font-medium", isMobile ? "text-2xl" : "text-4xl")} style={{ color: "var(--landing-dark-base)" }}>
                  {settings.process_title || "Como funciona o atendimento"}
                </h2>
                {settings.process_description ? (
                  <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">{settings.process_description}</p>
                ) : null}
                <div className="mt-8 space-y-4">
                  {activeSteps.slice(0, 4).map((step) => {
                    const Icon = uiIcon(step.icon, CheckCircle2);
                    return (
                      <div key={step.id} className="flex gap-4 border bg-white p-5" style={{ borderColor: "var(--landing-border-soft)" }}>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center text-white" style={{ backgroundColor: "var(--landing-dark-base)" }}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-serif text-xl" style={{ color: "var(--landing-dark-base)" }}>{step.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {showBlog ? (
        <section id="blog" className={cn("bg-white", isMobile ? "px-4 py-10" : "px-6 py-14")}>
          <div className="mx-auto max-w-6xl">
            <div className={cn(isMobile ? "text-left" : "text-center")}>
              <p className="text-sm italic text-slate-500">Blog institucional</p>
              <h2 className={cn("mt-3 font-serif font-medium", isMobile ? "text-2xl" : "text-4xl")} style={{ color: "var(--landing-dark-base)" }}>
                ConteÃºdo jurÃ­dico para fortalecer a autoridade do escritÃ³rio
              </h2>
            </div>
            <div className={cn("mt-8 grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-3")}>
              {publishedPosts.slice(0, 3).map((post) => (
                <Card key={post.id} className="rounded-none bg-white shadow-none" style={{ borderColor: "var(--landing-border-soft)" }}>
                  <CardContent className="p-6">
                    <BookOpenText className="h-5 w-5" style={{ color: "var(--landing-dark-base)" }} />
                    <h3 className="mt-4 font-serif text-xl" style={{ color: "var(--landing-dark-base)" }}>{post.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{post.summary || "Resumo do artigo."}</p>
                    {(post.author_name || post.published_at) ? (
                      <div className="mt-4 flex flex-wrap gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {post.author_name ? <span>{post.author_name}</span> : null}
                        {post.published_at ? <span>{formatDate(post.published_at)}</span> : null}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showMap ? (
        <section id="contato" className={cn("bg-white", isMobile ? "px-4 py-8" : "px-6 py-10")}>
          <div className="mx-auto max-w-6xl overflow-hidden border" style={{ borderColor: "var(--landing-border-soft)" }}>
            <iframe title="Mapa do escritÃ³rio" src={mapUrl} className={cn("w-full", isMobile ? "h-56" : "h-80")} loading="lazy" />
          </div>
        </section>
      ) : null}

      {showFinalCta ? (
        <section
          id={!showMap ? "contato" : undefined}
          className={cn("text-white", isMobile ? "px-4 py-10" : "px-6 py-14")}
          style={{
            backgroundImage: `${
              finalImage ? `linear-gradient(${finalOverlay}, ${finalOverlay}), url(${finalImage}), ` : ""
            }linear-gradient(180deg, var(--landing-dark-base) 0%, var(--landing-hero-end) 100%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="mx-auto max-w-4xl text-center">
            {settings.final_cta_eyebrow ? <p className="text-sm italic text-white/70">{settings.final_cta_eyebrow}</p> : null}
            <h2 className={cn("mt-3 font-serif font-medium leading-tight", isMobile ? "text-2xl" : "text-4xl")}>
              {settings.final_cta_title || "Pronto para conversar com um especialista?"}
            </h2>
            {settings.final_cta_description ? (
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/74">{settings.final_cta_description}</p>
            ) : null}
            {actionVisible(finalCtaButtonText, finalCtaButtonUrl) ? (
              <div className="mt-6 flex justify-center">
                <Button className="rounded-none px-7 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white hover:opacity-90" style={{ backgroundColor: "var(--landing-cta-success)" }}>
                  {finalCtaButtonText}
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {settings.footer_enabled !== false ? (
        <footer className={cn("text-white", isMobile ? "px-4 py-10" : "px-6 py-12")} style={{ backgroundColor: "var(--landing-dark-base)" }}>
          <div className={cn("mx-auto gap-8", isMobile ? "max-w-6xl" : "grid max-w-6xl grid-cols-[minmax(0,1.3fr)_0.9fr_0.9fr]")}>
            <div>
              <div className="flex items-center gap-3">
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt={companyName || "Logo"} className="h-12 w-12 rounded-sm object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-white/10 bg-white/10 text-xl font-semibold" style={{ color: "var(--landing-accent)" }}>
                    <Scale className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-serif text-2xl uppercase" style={{ color: "var(--landing-accent)" }}>
                    {companyName || "EscritÃ³rio"}
                  </p>
                  {companyTagline ? <p className="text-[0.65rem] uppercase tracking-[0.18em] text-white/60">{companyTagline}</p> : null}
                </div>
              </div>
              {settings.footer_description ? <p className="mt-5 max-w-md text-sm leading-8 text-white/70">{settings.footer_description}</p> : null}
              <div className="mt-5 space-y-2 text-sm text-white/68">
                {companyAddress ? <p>{companyAddress}</p> : null}
                {companyEmail ? <p>{companyEmail}</p> : null}
                {companyPhone ? <p>{companyPhone}</p> : null}
              </div>
            </div>

            {!isMobile ? (
              <div>
                <p className="font-serif text-2xl" style={{ color: "var(--landing-accent)" }}>
                  NavegaÃ§Ã£o
                </p>
                <div className="mt-5 space-y-3 text-sm text-white/68">
                  {navLinks.map((item) => (
                    <div key={item.label}>{item.label}</div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className={cn(isMobile ? "mt-8" : "")}>
              <p className="font-serif text-2xl" style={{ color: "var(--landing-accent)" }}>
                Redes sociais
              </p>
              <div className="mt-5 flex gap-3">
                {activeSocialLinks.slice(0, 5).map((item) => {
                  const Icon = socialIcon(item.icon);
                  return (
                    <div key={item.id} className="flex h-10 w-10 items-center justify-center border border-white/12 bg-white/8 text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-4 text-xs text-white/45">
            {settings.footer_copyright || "Â© Todos os direitos reservados."}
          </div>
        </footer>
      ) : null}

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-[0.68rem] uppercase tracking-[0.14em] text-slate-500">
        PrÃ©via do site {publicUrl ? `â€¢ ${publicUrl}` : ""}
      </div>
    </div>
  );
}
