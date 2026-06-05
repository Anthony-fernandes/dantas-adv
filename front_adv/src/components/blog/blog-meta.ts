import type { LandingPost } from "@/types/landing";

export type BlogPublicationStatus = "RASCUNHO" | "PUBLICADO" | "AGENDADO";

export type BlogPostMetadata = {
  category: string;
  tags: string[];
  seo_keywords: string[];
  is_featured: boolean;
  gallery: string[];
  view_count: number;
};

export type ResolvedLandingPost = LandingPost & {
  body_html: string;
  plain_text: string;
  category_label: string;
  tags_list: string[];
  seo_keywords_list: string[];
  gallery_urls: string[];
  is_featured_resolved: boolean;
  view_count_resolved: number;
  reading_time_minutes_resolved: number;
  publication_status: BlogPublicationStatus;
};

const META_MARKER = "LAWFLOW_BLOG_META";

const DEFAULT_META: BlogPostMetadata = {
  category: "",
  tags: [],
  seo_keywords: [],
  is_featured: false,
  gallery: [],
  view_count: 0,
};

function sanitizeList(values: unknown): string[] {
  const source = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(/[,\n]/)
      : [];

  const seen = new Set<string>();
  const output: string[] = [];

  source.forEach((value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(normalized);
  });

  return output;
}

export function sanitizeBlogMetadata(value?: Partial<BlogPostMetadata> | null): BlogPostMetadata {
  return {
    category: String(value?.category || "").trim(),
    tags: sanitizeList(value?.tags),
    seo_keywords: sanitizeList(value?.seo_keywords),
    is_featured: Boolean(value?.is_featured),
    gallery: sanitizeList(value?.gallery),
    view_count: Math.max(0, Number(value?.view_count || 0) || 0),
  };
}

export function buildSlug(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function textToHtml(value: string): string {
  const normalized = String(value || "").trim();
  if (!normalized) return "<p></p>";
  if (looksLikeHtml(normalized)) return normalized;

  return normalized
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function htmlToText(value: string): string {
  const html = String(value || "");
  if (!html) return "";

  if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
    const parsed = new window.DOMParser().parseFromString(html, "text/html");
    return parsed.body.textContent?.replace(/\s+/g, " ").trim() || "";
  }

  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateReadingTimeMinutes(value: string): number {
  const plainText = htmlToText(value);
  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  return Math.max(1, Math.ceil(words / 220));
}

export function parseBlogPostContent(rawContent?: string | null): {
  meta: BlogPostMetadata;
  body_html: string;
  plain_text: string;
} {
  const content = String(rawContent || "");
  const matched = content.match(/^<!--\s*LAWFLOW_BLOG_META\s*([\s\S]*?)-->\s*/);
  let meta = DEFAULT_META;
  let body = content;

  if (matched) {
    body = content.slice(matched[0].length);
    try {
      meta = sanitizeBlogMetadata(JSON.parse(matched[1] || "{}"));
    } catch {
      meta = DEFAULT_META;
    }
  }

  const bodyHtml = textToHtml(body);
  return {
    meta,
    body_html: bodyHtml,
    plain_text: htmlToText(bodyHtml),
  };
}

export function composeBlogPostContent(bodyHtml: string, metadata?: Partial<BlogPostMetadata>): string {
  const meta = sanitizeBlogMetadata(metadata);
  const normalizedBody = textToHtml(bodyHtml);
  return `<!-- ${META_MARKER}\n${JSON.stringify(meta)}\n-->\n${normalizedBody}`;
}

export function deriveBlogPublicationStatus(post: Pick<LandingPost, "is_published" | "published_at">): BlogPublicationStatus {
  if (post.is_published) return "PUBLICADO";
  if (post.published_at) {
    const scheduledDate = new Date(post.published_at);
    if (!Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() > Date.now()) {
      return "AGENDADO";
    }
  }
  return "RASCUNHO";
}

export function enrichLandingPost(post: LandingPost): ResolvedLandingPost {
  const parsed = parseBlogPostContent(post.content);
  const publicationStatus = deriveBlogPublicationStatus(post);
  const readingTime = estimateReadingTimeMinutes(parsed.body_html);
  const metadata = sanitizeBlogMetadata({
    category: post.category || parsed.meta.category,
    tags: post.tags || parsed.meta.tags,
    seo_keywords: post.seo_keywords || parsed.meta.seo_keywords,
    is_featured: post.is_featured ?? parsed.meta.is_featured,
    gallery: post.gallery || parsed.meta.gallery,
    view_count: post.view_count ?? parsed.meta.view_count,
  });

  return {
    ...post,
    category: metadata.category,
    tags: metadata.tags,
    seo_keywords: metadata.seo_keywords,
    is_featured: metadata.is_featured,
    gallery: metadata.gallery,
    view_count: metadata.view_count,
    reading_time_minutes: post.reading_time_minutes ?? readingTime,
    body_html: parsed.body_html,
    plain_text: parsed.plain_text,
    category_label: metadata.category,
    tags_list: metadata.tags,
    seo_keywords_list: metadata.seo_keywords,
    gallery_urls: metadata.gallery,
    is_featured_resolved: metadata.is_featured,
    view_count_resolved: metadata.view_count,
    reading_time_minutes_resolved: post.reading_time_minutes ?? readingTime,
    publication_status: publicationStatus,
  };
}

export function formatDateLabel(value?: string | null, withTime = false): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" });
}
