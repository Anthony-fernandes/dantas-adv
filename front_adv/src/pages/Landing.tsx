import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  Briefcase,
  CheckCircle2,
  Facebook,
  Gavel,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  Menu,
  MapPin,
  MessageCircle,
  Phone,
  Scale,
  Shield,
  Settings2,
  Star,
  Twitter,
  Users,
  Youtube,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { maskPhoneBR } from "@/lib/masks";
import { landingPublicService } from "@/services/api";
import type { LandingPublicPayload, LandingSettings } from "@/types/landing";

const ICON_MAP: Record<string, any> = {
  ArrowRight,
  BookOpenText,
  Briefcase,
  CheckCircle2,
  Facebook,
  Gavel,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
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

function safeArray<T>(value: T[] | undefined | null) {
  return Array.isArray(value) ? value : [];
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

function socialIcon(name?: string) {
  return ICON_MAP[name || "Globe"] || Globe;
}

function uiIcon(name?: string, fallback: any = Scale) {
  return ICON_MAP[name || ""] || fallback;
}

function updateMeta(name: string, content: string) {
  if (typeof document === "undefined") return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
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

function heroAlignmentFrom(theme: Record<string, any> | undefined) {
  const value = String(theme?.hero_alignment || "center").toLowerCase();
  if (value === "left" || value === "right" || value === "center") return value;
  return "center";
}

export default function Landing() {
  const location = useLocation();
  const publicSlug = useMemo(() => {
    const value = new URLSearchParams(location.search).get("slug");
    return value?.trim() || undefined;
  }, [location.search]);

  const publicQuery = useQuery({
    queryKey: ["landing-public-v2", publicSlug],
    queryFn: async () => landingPublicService.getLanding(publicSlug),
  });

  const payload: LandingPublicPayload = (publicQuery.data || {}) as LandingPublicPayload;
  const company = payload.company || {};
  const settings = payload.settings || {};
  const practiceAreas = safeArray(payload.practice_areas || payload.areas);
  const differentials = safeArray(payload.differentials);
  const processSteps = safeArray(payload.process_steps);
  const posts = safeArray(payload.posts);
  const testimonials = safeArray(payload.testimonials);
  const socialLinks = safeArray(payload.social_links);
  const navigationLinks = safeArray(payload.navigation_links);

  const companyName = settings.brand_name || company.name || "";
  const companyTagline = settings.brand_tagline || company.tagline || "";
  const companyPhone = company.phone || "";
  const companyEmail = company.email || "";
  const companyAddress = company.address || "";
  const mapUrl = buildMapEmbedUrl(settings.map_embed_url || company.map_embed_url, companyAddress);
  const heroImage = settings.hero_background_image_url || settings.hero_background_image || "";
  const aboutImage = settings.about_image_url || settings.about_image || "";
  const finalImage = settings.final_cta_background_image_url || settings.final_cta_background_image || "";
  const primaryCtaLabel = settings.hero_primary_cta_label || "";
  const servicesButtonText = settings.services_button_text || "";
  const finalCtaButtonText = settings.final_cta_button_text || "";
  const clientPortalLabel = settings.client_portal_label || "";
  const clientPortalHref = settings.client_portal_url || "";
  const internalAreaLabel = settings.internal_area_label || "";
  const internalAreaHref = settings.internal_area_url || "";
  const overlayOpacity = Number(settings.hero_overlay_opacity ?? 0.74);
  const heroOverlay = colorToRgba(settings.hero_overlay_color, overlayOpacity);
  const finalOverlay = colorToRgba(settings.hero_overlay_color, 0.86);
  const heroAlignment = heroAlignmentFrom(settings.theme);
  const navOverlay = colorToRgba(pickThemeValue(settings.theme, ["dark_base"], "#081d36"), 0.9);

  const headerLinks = navigationLinks.filter((item) => item.location === "HEADER" || item.location === "BOTH");
  const footerLinks = navigationLinks.filter((item) => item.location === "FOOTER" || item.location === "BOTH");
  const accessLinks = [
    actionVisible(clientPortalLabel, clientPortalHref) ? { label: clientPortalLabel, url: clientPortalHref } : null,
    actionVisible(internalAreaLabel, internalAreaHref) ? { label: internalAreaLabel, url: internalAreaHref } : null,
  ].filter(Boolean) as Array<{ label: string; url: string }>;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const primaryCtaHref = useMemo(
    () => resolveActionHref(settings.hero_primary_cta_url, "#contato"),
    [settings.hero_primary_cta_url],
  );
  const whatsappHref = useMemo(
    () => resolveActionHref(settings.final_cta_button_url || companyPhone, primaryCtaHref || ""),
    [companyPhone, primaryCtaHref, settings.final_cta_button_url],
  );
  const finalCtaHref = useMemo(
    () => resolveActionHref(settings.final_cta_button_url, whatsappHref),
    [settings.final_cta_button_url, whatsappHref],
  );
  const blogQuerySuffix = publicSlug ? `?slug=${encodeURIComponent(publicSlug)}` : "";

  useEffect(() => {
    const title = settings.seo_title || companyName;
    const description = settings.seo_description || settings.hero_description || "";
    if (title) document.title = title;
    if (description) updateMeta("description", description);
  }, [companyName, settings.hero_description, settings.seo_description, settings.seo_title]);

  const themeStyle = useMemo(() => buildThemeStyle(settings), [settings]);

  const showHero = sectionVisible(settings.hero_enabled, hasText(settings.hero_subtitle, settings.hero_title, settings.hero_description, primaryCtaLabel, heroImage));
  const showServices = sectionVisible(settings.services_enabled, practiceAreas.length > 0);
  const showAbout = sectionVisible(settings.about_enabled, hasText(settings.about_eyebrow, settings.about_title, settings.about_description, settings.about_secondary_description, aboutImage));
  const showDifferentials = sectionVisible(settings.differentials_enabled, differentials.length > 0);
  const showProcess = sectionVisible(settings.process_enabled, processSteps.length > 0);
  const showBlog = sectionVisible(settings.blog_enabled, posts.length > 0);
  const showTestimonials = sectionVisible(settings.testimonials_enabled, testimonials.length > 0);
  const showMap = sectionVisible(settings.map_enabled, !!mapUrl);
  const showFinalCta = sectionVisible(settings.final_cta_enabled, hasText(settings.final_cta_eyebrow, settings.final_cta_title, settings.final_cta_description, finalCtaButtonText, finalImage));
  const heroContentClass =
    heroAlignment === "left"
      ? "max-w-4xl text-left"
      : heroAlignment === "right"
        ? "ml-auto max-w-4xl text-right"
        : "mx-auto max-w-4xl text-center";
  const heroActionClass =
    heroAlignment === "left" ? "justify-start" : heroAlignment === "right" ? "justify-end" : "justify-center";

  if (publicQuery.isLoading) {
    return (
      <div className="landing-theme min-h-screen px-6 py-20 text-white" style={{ ...(themeStyle as any), backgroundColor: "var(--landing-dark-base)" }}>
        <div className="mx-auto max-w-6xl">
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="flex items-center gap-3 p-6">
              <Settings2 className="h-4 w-4 animate-spin" />
              Carregando landing publica...
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (publicQuery.isError) {
    return (
      <div className="landing-theme min-h-screen px-6 py-20 text-white" style={{ ...(themeStyle as any), backgroundColor: "var(--landing-dark-base)" }}>
        <div className="mx-auto max-w-4xl">
          <Card className="border-red-400/40 bg-red-500/10 text-white">
            <CardContent className="space-y-4 p-6">
              <p className="text-lg font-semibold">Nao foi possivel carregar a landing.</p>
              <p className="text-sm text-white/80">Verifique se a API publica `/api/landing/` esta acessivel e configurada.</p>
              <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10" onClick={() => publicQuery.refetch()}>
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-theme min-h-screen bg-white text-slate-900" style={themeStyle as any}>
      <section
        id="inicio"
        className="text-white"
        style={{
          backgroundImage: `${heroImage ? `linear-gradient(${heroOverlay}, ${heroOverlay}), url(${heroImage}), ` : ""}linear-gradient(135deg, var(--landing-hero-start), var(--landing-hero-mid), var(--landing-hero-end))`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <nav className="border-b border-white/10 backdrop-blur-sm" style={{ backgroundColor: navOverlay }}>
          <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-5">
            <div className="flex min-w-0 items-start gap-3 xl:items-center xl:justify-between xl:gap-6">
              <div className="flex min-w-0 items-start gap-3 xl:items-center">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={companyName || "Logo"} className="h-10 w-10 shrink-0 rounded-sm object-cover xl:h-12 xl:w-12" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-white/10 xl:h-12 xl:w-12">
                    <Scale className="h-5 w-5" style={{ color: "var(--landing-accent)" }} />
                  </div>
                )}
                <div className="min-w-0">
                  {companyName ? <p className="font-serif text-[1.05rem] uppercase leading-tight sm:text-[1.25rem] xl:text-3xl" style={{ color: "var(--landing-accent)" }}>{companyName}</p> : null}
                  {companyTagline ? <p className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] leading-4 text-white/60 xl:text-[0.68rem]">{companyTagline}</p> : null}
                </div>
              </div>

              {accessLinks.length ? (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-none border border-white/20 px-3 py-2.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-white/10 xl:hidden"
                  aria-expanded={mobileMenuOpen}
                  aria-label="Abrir menu"
                >
                  <Menu className="h-4 w-4" />
                  Menu
                </button>
              ) : null}

              <div className="hidden items-center gap-7 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/78 xl:flex">
                {headerLinks.map((item) => (
                  <a key={item.id} href={item.url} target={item.open_in_new_tab ? "_blank" : undefined} rel={item.open_in_new_tab ? "noreferrer" : undefined} className="hover:text-white">
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="hidden items-center gap-3 xl:flex">
                {accessLinks.map((item) => (
                  <a key={item.label} href={item.url} className="rounded-none border border-white/20 px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white hover:bg-white/10">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {mobileMenuOpen && accessLinks.length ? (
              <div className="mt-4 space-y-2 border border-white/10 bg-white/5 p-3 xl:hidden">
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
        </nav>

        {showHero ? (
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-14 md:pb-32 md:pt-20">
            <div className={heroContentClass}>
              {settings.hero_subtitle ? <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--landing-accent-strong)" }}>{settings.hero_subtitle}</p> : null}
              {settings.hero_title ? <h1 className="mt-6 font-display text-[clamp(2.3rem,4.8vw,4.7rem)] font-bold uppercase leading-[1.02] tracking-[-0.04em] text-white">{settings.hero_title}</h1> : null}
              {settings.hero_description ? <p className="mx-auto mt-5 max-w-3xl text-lg leading-9 text-white/82">{settings.hero_description}</p> : null}
              {actionVisible(primaryCtaLabel, primaryCtaHref) ? (
                <div className={cn("mt-10 flex", heroActionClass)}>
                  <Button className="rounded-none bg-white/5 px-8 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-white hover:bg-white/10" style={{ borderColor: "var(--landing-accent)" }} asChild>
                    <a href={primaryCtaHref}>
                      {primaryCtaLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      {showServices ? (
        <section id="servicos" className="px-4 py-16 md:px-6 md:py-20" style={{ backgroundColor: "var(--landing-surface-muted)" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              {settings.services_eyebrow ? <p className="text-sm italic text-slate-500">{settings.services_eyebrow}</p> : null}
              <h2 className="mt-4 font-serif text-3xl font-medium md:text-[2.2rem]" style={{ color: "var(--landing-dark-base)" }}>{settings.services_title}</h2>
              {settings.services_description ? <p className="mt-4 text-sm leading-8 text-slate-600">{settings.services_description}</p> : null}
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {practiceAreas.map((area) => {
                const Icon = uiIcon(area.icon, Scale);
                return (
                  <Card key={area.id} className="rounded-none bg-white shadow-none" style={{ borderColor: "var(--landing-border-soft)" }}>
                    <CardContent className="p-8 pt-8 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ backgroundColor: "var(--landing-dark-base)" }}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-6 font-serif text-2xl font-medium" style={{ color: "var(--landing-dark-base)" }}>{area.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-slate-600">{area.description}</p>
                      {actionVisible(servicesButtonText, area.link || whatsappHref) ? (
                        <Button className="mt-6 rounded-full px-5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white hover:opacity-90" style={{ backgroundColor: "var(--landing-dark-base)" }} asChild>
                          <a href={area.link || whatsappHref} target={String(area.link || whatsappHref).startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                            {servicesButtonText}
                          </a>
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
        <section id="sobre" className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className={`mx-auto grid max-w-6xl gap-10 ${aboutImage ? "lg:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)] lg:items-center" : ""}`}>
            {aboutImage ? <div className="overflow-hidden border" style={{ borderColor: "var(--landing-border-soft)", backgroundColor: "var(--landing-surface-soft)" }}><img src={aboutImage} alt={settings.about_title || companyName} className="h-full w-full object-cover" /></div> : null}
            <div>
              {settings.about_eyebrow ? <p className="text-sm italic text-slate-500">{settings.about_eyebrow}</p> : null}
              <h2 className="mt-3 font-serif text-4xl font-medium uppercase" style={{ color: "var(--landing-dark-base)" }}>{settings.about_title}</h2>
              {settings.about_highlight ? <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--landing-accent)" }}>{settings.about_highlight}</p> : null}
              {settings.about_description ? <p className="mt-6 text-sm leading-8 text-slate-600">{settings.about_description}</p> : null}
              {settings.about_secondary_description ? <p className="mt-4 text-sm leading-8 text-slate-600">{settings.about_secondary_description}</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {showDifferentials ? (
        <section style={{ backgroundColor: "var(--landing-surface-muted)" }}>
          <div className="px-4 py-16 text-white md:px-6" style={{ backgroundColor: "var(--landing-dark-base)" }}>
            <div className="mx-auto max-w-6xl">
              {showDifferentials ? (
                <div>
                  {settings.differentials_eyebrow ? <p className="text-sm italic text-white/72">{settings.differentials_eyebrow}</p> : null}
                  <h2 className="mt-4 max-w-xl font-serif text-4xl font-medium leading-tight">{settings.differentials_title}</h2>
                  {settings.differentials_description ? <p className="mt-4 max-w-xl text-sm leading-8 text-white/72">{settings.differentials_description}</p> : null}
                  <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {differentials.map((item) => {
                      const Icon = uiIcon(item.icon, Shield);
                      return (
                        <div key={item.id} className="border border-white/12 bg-white/[0.05] px-5 py-6">
                          <Icon className="h-8 w-8" style={{ color: "var(--landing-accent)" }} />
                          <h3 className="mt-5 font-serif text-2xl">{item.title}</h3>
                          <p className="mt-3 text-sm leading-7 text-white/70">{item.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {showProcess ? (
            <div className="px-4 pb-16 pt-16 md:px-6 md:pb-20 md:pt-20">
              <div className="mx-auto max-w-6xl">
                {settings.process_eyebrow ? <p className="text-sm italic text-slate-500">{settings.process_eyebrow}</p> : null}
                <h2 className="mt-4 max-w-3xl font-serif text-4xl font-medium" style={{ color: "var(--landing-dark-base)" }}>{settings.process_title}</h2>
                {settings.process_description ? <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600">{settings.process_description}</p> : null}
                <div className="mt-8 space-y-4">
                  {processSteps.map((step) => {
                    const Icon = uiIcon(step.icon, CheckCircle2);
                    return (
                      <div key={step.id} className="flex gap-4 border bg-white p-5" style={{ borderColor: "var(--landing-border-soft)" }}>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center text-white" style={{ backgroundColor: "var(--landing-dark-base)" }}><Icon className="h-5 w-5" /></div>
                        <div>
                          <h3 className="font-serif text-2xl" style={{ color: "var(--landing-dark-base)" }}>{step.title}</h3>
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
        <section id="artigos" className="bg-white px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              {settings.blog_eyebrow ? <p className="text-sm italic text-slate-500">{settings.blog_eyebrow}</p> : null}
              <h2 className="mt-4 font-serif text-4xl font-medium" style={{ color: "var(--landing-dark-base)" }}>{settings.blog_title}</h2>
              {settings.blog_description ? <p className="mt-4 text-sm leading-8 text-slate-600">{settings.blog_description}</p> : null}
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {posts.map((post) => (
                <Card key={post.id} className="rounded-none bg-white shadow-none" style={{ borderColor: "var(--landing-border-soft)" }}>
                  <CardContent className="p-6 pt-6">
                    <BookOpenText className="h-5 w-5" style={{ color: "var(--landing-dark-base)" }} />
                    <h3 className="mt-4 font-serif text-2xl" style={{ color: "var(--landing-dark-base)" }}>{post.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{post.summary}</p>
                    {post.author_name || post.published_at ? (
                      <div className="mt-5 flex flex-wrap gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {post.author_name ? <span>{post.author_name}</span> : null}
                        {post.published_at ? <span>{new Date(post.published_at).toLocaleDateString("pt-BR")}</span> : null}
                      </div>
                    ) : null}
                    {post.slug ? (
                      <div className="mt-6">
                        <a
                          href={`/blog/${post.slug}${blogQuerySuffix}`}
                          className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition hover:opacity-80"
                          style={{ color: "var(--landing-dark-base)" }}
                        >
                          Ler artigo
                        </a>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
            {actionVisible(settings.blog_button_text, settings.blog_button_url) ? <div className="mt-8 flex justify-center"><Button className="rounded-none px-6 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white hover:opacity-90" style={{ backgroundColor: "var(--landing-dark-base)" }} asChild><a href={settings.blog_button_url || ""}>{settings.blog_button_text}</a></Button></div> : null}
          </div>
        </section>
      ) : null}

      {showTestimonials ? (
        <section className="px-4 py-16 md:px-6 md:py-20" style={{ backgroundColor: "var(--landing-surface-muted)" }}>
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              {settings.testimonials_eyebrow ? <p className="text-sm italic text-slate-500">{settings.testimonials_eyebrow}</p> : null}
              <h2 className="mt-4 font-serif text-4xl font-medium" style={{ color: "var(--landing-dark-base)" }}>{settings.testimonials_title}</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {testimonials.map((item) => (
                <Card key={item.id} className="rounded-none text-white shadow-none" style={{ borderColor: "var(--landing-border-soft)", backgroundColor: "var(--landing-dark-base)" }}>
                  <CardContent className="p-6 pt-6">
                    <div className="flex gap-1 text-[#ffd166]">
                      {Array.from({ length: Math.max(1, Math.min(5, item.rating || 5)) }).map((_, index) => (
                        <Star key={`${item.id}-${index}`} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <h3 className="mt-4 font-serif text-2xl">{item.name}</h3>
                    {item.role ? <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/60">{item.role}</p> : null}
                    <p className="mt-3 text-sm leading-7 text-white/74">{item.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {showMap ? (
        <section id="contato" className="bg-white px-4 py-10 md:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden border" style={{ borderColor: "var(--landing-border-soft)" }}>
            <iframe title="Mapa do escritorio" src={mapUrl} className="h-[22rem] w-full md:h-[28rem]" loading="lazy" />
          </div>
        </section>
      ) : null}

      {showFinalCta ? (
        <section id={!showMap ? "contato" : undefined} className="px-4 py-16 text-white md:px-6 md:py-20" style={{ backgroundImage: `${finalImage ? `linear-gradient(${finalOverlay}, ${finalOverlay}), url(${finalImage}), ` : ""}linear-gradient(180deg, var(--landing-dark-base) 0%, var(--landing-hero-end) 100%)`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="mx-auto max-w-4xl text-center">
            {settings.final_cta_eyebrow ? <p className="text-sm italic text-white/70">{settings.final_cta_eyebrow}</p> : null}
            <h2 className="mt-4 font-serif text-4xl font-medium leading-tight md:text-[2.8rem]">{settings.final_cta_title}</h2>
            {settings.final_cta_description ? <p className="mx-auto mt-4 max-w-2xl text-sm leading-8 text-white/74">{settings.final_cta_description}</p> : null}
            {actionVisible(finalCtaButtonText, finalCtaHref) ? (
              <div className="mt-8 flex justify-center">
                <Button className="rounded-none px-7 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white hover:opacity-90" style={{ backgroundColor: "var(--landing-cta-success)" }} asChild>
                  <a href={finalCtaHref} target={String(finalCtaHref).startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                    {finalCtaButtonText}
                  </a>
                </Button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {settings.footer_enabled !== false ? (
        <footer className="px-4 py-14 text-white md:px-6" style={{ backgroundColor: "var(--landing-dark-base)" }}>
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[minmax(0,1.3fr)_0.9fr_0.9fr]">
            <div>
              <div className="flex items-center gap-3">
                {company.logo_url ? <img src={company.logo_url} alt={companyName || "Logo"} className="h-12 w-12 rounded-sm object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-white/10 bg-white/10 text-xl font-semibold" style={{ color: "var(--landing-accent)" }}><Scale className="h-5 w-5" /></div>}
                <div>
                  {companyName ? <p className="font-serif text-3xl uppercase" style={{ color: "var(--landing-accent)" }}>{companyName}</p> : null}
                  {companyTagline ? <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/60">{companyTagline}</p> : null}
                </div>
              </div>
              {settings.footer_description ? <p className="mt-6 max-w-md text-sm leading-8 text-white/70">{settings.footer_description}</p> : null}
              <div className="mt-6 space-y-2 text-sm text-white/68">
                {companyAddress ? <p>{companyAddress}</p> : null}
                {companyEmail ? <p>{companyEmail}</p> : null}
                {companyPhone ? <p>{maskPhoneBR(companyPhone)}</p> : null}
              </div>
            </div>
            <div>
              <p className="font-serif text-2xl" style={{ color: "var(--landing-accent)" }}>Menu</p>
              <div className="mt-5 space-y-3 text-sm text-white/68">
                {footerLinks.map((item) => (
                  <a key={item.id} href={item.url} className="block hover:text-white">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="font-serif text-2xl" style={{ color: "var(--landing-accent)" }}>Redes Sociais</p>
              <div className="mt-5 flex gap-3">
                {socialLinks.map((item) => {
                  const Icon = socialIcon(item.icon);
                  return (
                    <a key={item.id} href={item.url} className="flex h-10 w-10 items-center justify-center border border-white/12 bg-white/8 text-white transition hover:bg-white/16" aria-label={item.label} target="_blank" rel="noreferrer">
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
          {settings.footer_copyright ? (
            <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-5 text-center text-xs text-white/45">
              {settings.footer_copyright}
            </div>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}
