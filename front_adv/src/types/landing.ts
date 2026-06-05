export type LandingCompany = {
  id?: string;
  name?: string;
  tagline?: string;
  slug?: string;
  logo_url?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  map_embed_url?: string;
};

export type LandingSettings = {
  is_published?: boolean;
  brand_name?: string;
  brand_tagline?: string;
  theme?: Record<string, any>;
  hero_enabled?: boolean;
  hero_subtitle?: string;
  hero_title?: string;
  hero_description?: string;
  hero_primary_cta_label?: string;
  hero_primary_cta_url?: string;
  hero_background_image?: string | null;
  hero_background_image_url?: string;
  hero_overlay_color?: string;
  hero_overlay_opacity?: string | number;
  services_enabled?: boolean;
  services_eyebrow?: string;
  services_title?: string;
  services_description?: string;
  services_button_text?: string;
  about_enabled?: boolean;
  about_eyebrow?: string;
  about_title?: string;
  about_highlight?: string;
  about_description?: string;
  about_secondary_description?: string;
  about_image?: string | null;
  about_image_url?: string;
  differentials_enabled?: boolean;
  differentials_eyebrow?: string;
  differentials_title?: string;
  differentials_description?: string;
  contact_enabled?: boolean;
  contact_eyebrow?: string;
  contact_title?: string;
  contact_description?: string;
  contact_button_text?: string;
  contact_success_message?: string;
  contact_recipient_emails?: string;
  contact_send_email?: boolean;
  process_enabled?: boolean;
  process_eyebrow?: string;
  process_title?: string;
  process_description?: string;
  blog_enabled?: boolean;
  blog_eyebrow?: string;
  blog_title?: string;
  blog_description?: string;
  blog_button_text?: string;
  blog_button_url?: string;
  testimonials_enabled?: boolean;
  testimonials_eyebrow?: string;
  testimonials_title?: string;
  map_enabled?: boolean;
  map_embed_url?: string;
  final_cta_enabled?: boolean;
  final_cta_eyebrow?: string;
  final_cta_title?: string;
  final_cta_description?: string;
  final_cta_button_text?: string;
  final_cta_button_url?: string;
  final_cta_background_image?: string | null;
  final_cta_background_image_url?: string;
  footer_enabled?: boolean;
  footer_description?: string;
  footer_address?: string;
  footer_phone?: string;
  footer_email?: string | null;
  footer_copyright?: string;
  client_portal_label?: string;
  client_portal_url?: string;
  internal_area_label?: string;
  internal_area_url?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
};

export type LandingPracticeArea = {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  order: number;
};

export type LandingDifferential = {
  id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

export type LandingProcessStep = {
  id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

export type LandingPost = {
  id: string;
  title: string;
  summary: string;
  content: string;
  image?: string | null;
  image_url?: string;
  author_name?: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
  category?: string;
  tags?: string[];
  gallery?: string[];
  is_featured?: boolean;
  view_count?: number;
  reading_time_minutes?: number;
  published_at?: string | null;
  sort_order?: number;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type LandingTestimonial = {
  id: string;
  name: string;
  role?: string;
  text: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
};

export type LandingSocialLink = {
  id: string;
  label: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

export type LandingNavigationLink = {
  id: string;
  label: string;
  url: string;
  location: "HEADER" | "FOOTER" | "BOTH";
  sort_order: number;
  open_in_new_tab: boolean;
  is_active: boolean;
};

export type LandingMessageLog = {
  id: string;
  direction: string;
  channel: string;
  recipient: string;
  status: string;
  error_message?: string;
  payload?: Record<string, any>;
  created_by_name?: string;
  created_at: string;
};

export type LandingMessage = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string;
  message?: string;
  source?: string;
  status: "new" | "read" | "responded" | "spam";
  subject?: string;
  email_sent?: boolean;
  email_error?: string;
  recipient_email?: string;
  responded_at?: string | null;
  responded_by?: string | null;
  responded_by_name?: string;
  response_message?: string;
  ip_address?: string | null;
  user_agent?: string;
  is_spam?: boolean;
  spam_reason?: string;
  created_at: string;
  updated_at: string;
  delivery_logs?: LandingMessageLog[];
};

export type LandingPublicPayload = {
  company?: LandingCompany;
  settings?: LandingSettings;
  practice_areas?: LandingPracticeArea[];
  differentials?: LandingDifferential[];
  process_steps?: LandingProcessStep[];
  posts?: LandingPost[];
  testimonials?: LandingTestimonial[];
  social_links?: LandingSocialLink[];
  navigation_links?: LandingNavigationLink[];
  landing?: Record<string, any>;
  areas?: LandingPracticeArea[];
};

export type LandingContactRequest = {
  slug?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  source?: string;
  subject?: string;
  website?: string;
  started_at?: string;
};
