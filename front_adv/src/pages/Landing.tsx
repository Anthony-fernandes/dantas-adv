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
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Scale,
  Shield,
  Settings2,
  Star,
  Twitter,
  Users,
  X,
  Youtube,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { maskPhoneBR } from "@/lib/masks";
import { landingPublicService } from "@/services/api";
import type { LandingPublicPayload, LandingSettings } from "@/types/landing";

const ICON_MAP: Record<string, any> = {
  ArrowRight, BookOpenText, Briefcase, CheckCircle2,
  Facebook, Gavel, Globe, Instagram, Linkedin, Mail,
  MapPin, MessageCircle, Phone, Scale, Shield, Star,
  Twitter, Users, Youtube,
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
    "--accent": pickThemeValue(theme, ["accent", "primary_color"], "#c9ab76"),
    "--accent-strong": pickThemeValue(theme, ["accent_strong", "secondary_color"], "#f0d7a1"),
    "--dark": pickThemeValue(theme, ["dark_base"], "#0b1c30"),
    "--dark-mid": pickThemeValue(theme, ["hero_mid", "hero_color_mid"], "#0e2540"),
    "--surface": pickThemeValue(theme, ["surface_muted"], "#f7f5f0"),
    "--border": pickThemeValue(theme, ["border_soft", "border_color"], "#ddd9d2"),
    "--cta": pickThemeValue(theme, ["cta_success", "whatsapp_color"], "#30d366"),
    "--hero-from": pickThemeValue(theme, ["hero_start", "hero_color_from"], "#0b1c30"),
    "--hero-to": pickThemeValue(theme, ["hero_end", "hero_color_to"], "#102e4a"),
  } as Record<string, string>;
}

function hasText(...values: Array<string | null | undefined>) {
  return values.some((v) => !!String(v || "").trim());
}

function safeArray<T>(value: T[] | undefined | null) {
  return Array.isArray(value) ? value : [];
}

function sectionVisible(enabled: boolean | undefined, hasContent: boolean) {
  return enabled !== false && hasContent;
}

function actionVisible(label?: string | null, href?: string | null) {
  return !!String(label || "").trim() && !!String(href || "").trim();
}

function buildMapEmbedUrl(source?: string | null, fallback?: string | null) {
  const primary = String(source || "").trim();
  if (primary) {
    if (/^https?:\/\//i.test(primary)) return primary;
    return `https://www.google.com/maps?q=${encodeURIComponent(primary)}&output=embed`;
  }
  const address = String(fallback || "").trim();
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

function colorToRgba(color: string | undefined, opacity: number, fallback = "#0b1c30") {
  const input = String(color || fallback).trim() || fallback;
  const normalized = input.replace("#", "");
  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return input;
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

function SocialIcon({ name }: { name?: string }) {
  const Icon = ICON_MAP[name || "Globe"] || Globe;
  return <Icon className="h-4 w-4" />;
}

function UiIcon({ name, fallback = Scale }: { name?: string; fallback?: any }) {
  const Icon = ICON_MAP[name || ""] || fallback;
  return <Icon className="h-5 w-5" />;
}

export default function Landing() {
  const location = useLocation();
  const publicSlug = useMemo(() => {
    const value = new URLSearchParams(location.search).get("slug");
    return value?.trim() || undefined;
  }, [location.search]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const overlayOpacity = Number(settings.hero_overlay_opacity ?? 0.72);
  const heroOverlay = colorToRgba(settings.hero_overlay_color, overlayOpacity);
  const finalOverlay = colorToRgba(settings.hero_overlay_color, 0.88);
  const blogQuerySuffix = publicSlug ? `?slug=${encodeURIComponent(publicSlug)}` : "";

  const primaryCtaHref = useMemo(() => resolveActionHref(settings.hero_primary_cta_url, "#contato"), [settings.hero_primary_cta_url]);
  const whatsappHref = useMemo(() => resolveActionHref(settings.final_cta_button_url || companyPhone, primaryCtaHref || ""), [companyPhone, primaryCtaHref, settings.final_cta_button_url]);
  const finalCtaHref = useMemo(() => resolveActionHref(settings.final_cta_button_url, whatsappHref), [settings.final_cta_button_url, whatsappHref]);

  const headerLinks = navigationLinks.filter((item) => item.location === "HEADER" || item.location === "BOTH");
  const footerLinks = navigationLinks.filter((item) => item.location === "FOOTER" || item.location === "BOTH");
  const accessLinks = [
    actionVisible(clientPortalLabel, clientPortalHref) ? { label: clientPortalLabel, url: clientPortalHref } : null,
    actionVisible(internalAreaLabel, internalAreaHref) ? { label: internalAreaLabel, url: internalAreaHref } : null,
  ].filter(Boolean) as Array<{ label: string; url: string }>;

  const themeStyle = useMemo(() => buildThemeStyle(settings), [settings]);

  const showHero = sectionVisible(settings.hero_enabled, hasText(settings.hero_title, settings.hero_description, primaryCtaLabel, heroImage));
  const showServices = sectionVisible(settings.services_enabled, practiceAreas.length > 0);
  const showAbout = sectionVisible(settings.about_enabled, hasText(settings.about_title, settings.about_description, aboutImage));
  const showDifferentials = sectionVisible(settings.differentials_enabled, differentials.length > 0);
  const showProcess = sectionVisible(settings.process_enabled, processSteps.length > 0);
  const showBlog = sectionVisible(settings.blog_enabled, posts.length > 0);
  const showTestimonials = sectionVisible(settings.testimonials_enabled, testimonials.length > 0);
  const showMap = sectionVisible(settings.map_enabled, !!mapUrl);
  const showFinalCta = sectionVisible(settings.final_cta_enabled, hasText(settings.final_cta_title, finalCtaButtonText));

  useEffect(() => {
    const title = settings.seo_title || companyName;
    const description = settings.seo_description || settings.hero_description || "";
    if (title) document.title = title;
    if (description) updateMeta("description", description);
  }, [companyName, settings.hero_description, settings.seo_description, settings.seo_title]);

  if (publicQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--dark)", ...themeStyle as any }}>
        <div className="flex items-center gap-3 text-white/60">
          <Settings2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-theme min-h-screen bg-white text-slate-900" style={themeStyle as any}>

      {/* ─── NAV ─── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: colorToRgba(settings.theme?.dark_base, 0.96, "#0b1c30"), backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-6">
          {/* Brand */}
          <a href="#inicio" className="flex shrink-0 items-center gap-3 group">
            {company.logo_url ? (
              <img src={company.logo_url} alt={companyName || "Logo"} className="h-9 w-9 rounded-md object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <Scale className="h-4 w-4" style={{ color: "var(--accent)" }} />
              </div>
            )}
            {companyName && (
              <div>
                <p className="font-display text-sm font-semibold leading-tight text-white">{companyName}</p>
                {companyTagline && <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none mt-0.5">{companyTagline}</p>}
              </div>
            )}
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            {headerLinks.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target={item.open_in_new_tab ? "_blank" : undefined}
                rel={item.open_in_new_tab ? "noreferrer" : undefined}
                className="text-[0.75rem] font-medium text-white/60 transition-colors hover:text-white uppercase tracking-wider"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Desktop access links */}
          <div className="hidden items-center gap-2 md:flex">
            {accessLinks.map((item, i) => (
              <a
                key={item.label}
                href={item.url}
                className={cn(
                  "rounded-md px-4 py-2 text-[0.72rem] font-medium uppercase tracking-wider transition-colors",
                  i === 0
                    ? "border border-white/20 text-white hover:bg-white/10"
                    : "text-white/70 hover:text-white",
                )}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-white/70 hover:bg-white/10 md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 px-4 pb-4 pt-3 md:hidden" style={{ backgroundColor: colorToRgba(settings.theme?.dark_base, 0.98, "#0b1c30") }}>
            <div className="space-y-1">
              {headerLinks.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              {accessLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-md border border-white/15 px-3 py-2.5 text-sm text-center text-white hover:bg-white/10"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ─── */}
      {showHero ? (
        <section
          id="inicio"
          className="relative overflow-hidden text-white"
          style={{
            backgroundImage: `${heroImage ? `linear-gradient(${heroOverlay}, ${heroOverlay}), url(${heroImage}), ` : ""}linear-gradient(160deg, var(--hero-from) 0%, var(--dark-mid) 50%, var(--hero-to) 100%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,255,255,0.04),transparent)]" />
          <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-36">
            {settings.hero_subtitle && (
              <p className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[0.7rem] font-medium uppercase tracking-widest text-white/70">
                {settings.hero_subtitle}
              </p>
            )}
            {settings.hero_title && (
              <h1 className="font-display text-[clamp(2.4rem,5vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-white">
                {settings.hero_title}
              </h1>
            )}
            {settings.hero_description && (
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
                {settings.hero_description}
              </p>
            )}
            {actionVisible(primaryCtaLabel, primaryCtaHref) && (
              <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a
                  href={primaryCtaHref}
                  className="inline-flex items-center gap-2 rounded-md px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>

          {/* Bottom fade */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </section>
      ) : null}

      {/* ─── SERVICES ─── */}
      {showServices ? (
        <section id="servicos" className="bg-white px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              {settings.services_eyebrow && (
                <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                  {settings.services_eyebrow}
                </p>
              )}
              {settings.services_title && (
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-[2.6rem]" style={{ color: "var(--dark)" }}>
                  {settings.services_title}
                </h2>
              )}
              {settings.services_description && (
                <p className="mt-4 text-base leading-relaxed text-slate-500">{settings.services_description}</p>
              )}
            </div>

            <div className="grid gap-px border bg-slate-100 md:grid-cols-2 xl:grid-cols-3" style={{ borderColor: "var(--border)" }}>
              {practiceAreas.map((area) => (
                <div
                  key={area.id}
                  className="group flex flex-col bg-white p-8 transition-colors hover:bg-slate-50"
                >
                  <div
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: "var(--dark)" }}
                  >
                    <UiIcon name={area.icon} fallback={Scale} />
                  </div>
                  <h3 className="font-display text-xl font-semibold" style={{ color: "var(--dark)" }}>
                    {area.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">{area.description}</p>
                  {actionVisible(servicesButtonText, area.link || whatsappHref) && (
                    <a
                      href={area.link || whatsappHref}
                      target={String(area.link || whatsappHref).startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
                      style={{ color: "var(--dark)" }}
                    >
                      {servicesButtonText}
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── ABOUT ─── */}
      {showAbout ? (
        <section id="sobre" className="px-4 py-20 md:px-6 md:py-28" style={{ backgroundColor: "var(--surface)" }}>
          <div className={`mx-auto max-w-6xl ${aboutImage ? "grid gap-12 lg:grid-cols-2 lg:items-center" : ""}`}>
            {aboutImage && (
              <div className="overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
                <img
                  src={aboutImage}
                  alt={settings.about_title || companyName}
                  className="h-full w-full object-cover"
                  style={{ maxHeight: "520px" }}
                />
              </div>
            )}
            <div>
              {settings.about_eyebrow && (
                <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                  {settings.about_eyebrow}
                </p>
              )}
              {settings.about_title && (
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-[2.6rem]" style={{ color: "var(--dark)" }}>
                  {settings.about_title}
                </h2>
              )}
              {settings.about_highlight && (
                <p className="mt-4 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--accent)" }}>
                  {settings.about_highlight}
                </p>
              )}
              {settings.about_description && (
                <p className="mt-5 text-base leading-relaxed text-slate-600">{settings.about_description}</p>
              )}
              {settings.about_secondary_description && (
                <p className="mt-4 text-base leading-relaxed text-slate-600">{settings.about_secondary_description}</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── DIFFERENTIALS ─── */}
      {showDifferentials ? (
        <section className="px-4 py-20 text-white md:px-6 md:py-28" style={{ backgroundColor: "var(--dark)" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              {settings.differentials_eyebrow && (
                <p className="mb-4 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-white/40">
                  {settings.differentials_eyebrow}
                </p>
              )}
              {settings.differentials_title && (
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white md:text-[2.6rem]">
                  {settings.differentials_title}
                </h2>
              )}
              {settings.differentials_description && (
                <p className="mt-4 text-base leading-relaxed text-white/60">{settings.differentials_description}</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {differentials.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-white/8 p-7"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "var(--accent)" }}>
                    <UiIcon name={item.icon} fallback={Shield} />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── PROCESS STEPS ─── */}
      {showProcess ? (
        <section className="bg-white px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 max-w-2xl">
              {settings.process_eyebrow && (
                <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                  {settings.process_eyebrow}
                </p>
              )}
              {settings.process_title && (
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-[2.6rem]" style={{ color: "var(--dark)" }}>
                  {settings.process_title}
                </h2>
              )}
              {settings.process_description && (
                <p className="mt-4 text-base leading-relaxed text-slate-500">{settings.process_description}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {processSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex gap-5 rounded-lg border p-6"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold text-white"
                    style={{ backgroundColor: "var(--dark)" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold" style={{ color: "var(--dark)" }}>
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── TESTIMONIALS ─── */}
      {showTestimonials ? (
        <section className="px-4 py-20 md:px-6 md:py-28" style={{ backgroundColor: "var(--surface)" }}>
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              {settings.testimonials_eyebrow && (
                <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                  {settings.testimonials_eyebrow}
                </p>
              )}
              {settings.testimonials_title && (
                <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-[2.6rem]" style={{ color: "var(--dark)" }}>
                  {settings.testimonials_title}
                </h2>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-lg border p-7"
                  style={{ borderColor: "var(--border)", backgroundColor: "white" }}
                >
                  <div className="mb-4 flex gap-1" style={{ color: "var(--accent)" }}>
                    {Array.from({ length: Math.max(1, Math.min(5, item.rating || 5)) }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-slate-600 italic">"{item.text}"</p>
                  <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--dark)" }}>{item.name}</p>
                    {item.role && (
                      <p className="mt-0.5 text-xs text-slate-400 uppercase tracking-wider">{item.role}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── BLOG ─── */}
      {showBlog ? (
        <section id="artigos" className="bg-white px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                {settings.blog_eyebrow && (
                  <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--accent)" }}>
                    {settings.blog_eyebrow}
                  </p>
                )}
                {settings.blog_title && (
                  <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-[2.6rem]" style={{ color: "var(--dark)" }}>
                    {settings.blog_title}
                  </h2>
                )}
              </div>
              {actionVisible(settings.blog_button_text, settings.blog_button_url) && (
                <a
                  href={settings.blog_button_url || ""}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "var(--dark)" }}
                >
                  {settings.blog_button_text}
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="flex flex-col rounded-lg border transition-shadow hover:shadow-md"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex flex-1 flex-col p-7">
                    <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "var(--surface)", color: "var(--dark)" }}>
                      <BookOpenText className="h-4 w-4" />
                    </div>
                    <h3 className="font-display text-xl font-semibold leading-snug" style={{ color: "var(--dark)" }}>
                      {post.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">{post.summary}</p>
                    <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border)" }}>
                      <div className="text-xs text-slate-400">
                        {[post.author_name, post.published_at ? new Date(post.published_at).toLocaleDateString("pt-BR") : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      {post.slug && (
                        <a
                          href={`/blog/${post.slug}${blogQuerySuffix}`}
                          className="text-[0.7rem] font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
                          style={{ color: "var(--dark)" }}
                        >
                          Ler →
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── MAP ─── */}
      {showMap ? (
        <section id="contato" className="bg-white px-4 pb-0 pt-6 md:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-t-lg border border-b-0" style={{ borderColor: "var(--border)" }}>
            <iframe title="Localização do escritório" src={mapUrl} className="h-72 w-full md:h-96" loading="lazy" />
          </div>
        </section>
      ) : null}

      {/* ─── FINAL CTA ─── */}
      {showFinalCta ? (
        <section
          id={!showMap ? "contato" : undefined}
          className="relative overflow-hidden px-4 py-20 text-white md:px-6 md:py-28"
          style={{
            backgroundImage: `${finalImage ? `linear-gradient(${finalOverlay}, ${finalOverlay}), url(${finalImage}), ` : ""}linear-gradient(160deg, var(--dark) 0%, var(--hero-to) 100%)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_120%,rgba(255,255,255,0.04),transparent)]" />
          <div className="relative mx-auto max-w-3xl text-center">
            {settings.final_cta_eyebrow && (
              <p className="mb-4 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-white/50">
                {settings.final_cta_eyebrow}
              </p>
            )}
            {settings.final_cta_title && (
              <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white md:text-[2.8rem]">
                {settings.final_cta_title}
              </h2>
            )}
            {settings.final_cta_description && (
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65">
                {settings.final_cta_description}
              </p>
            )}
            {actionVisible(finalCtaButtonText, finalCtaHref) && (
              <div className="mt-10">
                <a
                  href={finalCtaHref}
                  target={String(finalCtaHref).startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md px-8 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--cta)" }}
                >
                  {finalCtaButtonText}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {/* ─── FOOTER ─── */}
      {settings.footer_enabled !== false && (
        <footer className="px-4 py-16 text-white md:px-6" style={{ backgroundColor: "var(--dark)" }}>
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 md:grid-cols-[minmax(0,1.5fr)_1fr_1fr]">
              {/* Brand column */}
              <div>
                <div className="flex items-center gap-3">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt={companyName} className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                      <Scale className="h-5 w-5" style={{ color: "var(--accent)" }} />
                    </div>
                  )}
                  <div>
                    {companyName && <p className="font-display text-lg font-semibold text-white">{companyName}</p>}
                    {companyTagline && <p className="text-[10px] text-white/40 uppercase tracking-widest">{companyTagline}</p>}
                  </div>
                </div>

                {settings.footer_description && (
                  <p className="mt-5 text-sm leading-relaxed text-white/55">{settings.footer_description}</p>
                )}

                <div className="mt-6 space-y-2 text-sm text-white/50">
                  {companyAddress && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{companyAddress}</p>}
                  {companyEmail && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" />{companyEmail}</p>}
                  {companyPhone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" />{maskPhoneBR(companyPhone)}</p>}
                </div>
              </div>

              {/* Nav column */}
              {footerLinks.length > 0 && (
                <div>
                  <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-widest text-white/40">Menu</p>
                  <div className="space-y-2.5">
                    {footerLinks.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        className="block text-sm text-white/55 transition-colors hover:text-white"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Social column */}
              {socialLinks.length > 0 && (
                <div>
                  <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-widest text-white/40">Redes sociais</p>
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/55 transition-colors hover:border-white/25 hover:text-white"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                      >
                        <SocialIcon name={item.icon} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {settings.footer_copyright && (
              <div className="mt-12 border-t border-white/8 pt-6 text-center text-xs text-white/30">
                {settings.footer_copyright}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
