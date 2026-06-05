import type { CSSProperties } from "react";

import type { LandingSettings } from "@/types/landing";

export function firstText(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function pickThemeValue(theme: Record<string, any> | undefined, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = theme?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

export function buildBrandThemeStyle(settings: LandingSettings | undefined) {
  const theme = settings?.theme || {};

  return {
    "--landing-accent": pickThemeValue(theme, ["accent", "primary_color"], "#c9ab76"),
    "--landing-accent-strong": pickThemeValue(theme, ["accent_strong", "secondary_color"], "#f0d7a1"),
    "--landing-dark-base": pickThemeValue(theme, ["dark_base"], "#081d36"),
    "--landing-hero-start": pickThemeValue(theme, ["hero_start", "hero_color_from"], "#081d36"),
    "--landing-hero-mid": pickThemeValue(theme, ["hero_mid", "hero_color_mid"], "#0a2649"),
    "--landing-hero-end": pickThemeValue(theme, ["hero_end", "hero_color_to"], "#0d355f"),
  } as CSSProperties;
}

export function colorToRgba(color: string | undefined, opacity: number, fallback = "#081d36") {
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
