/**
 * Logo oficial NimbusLaw — escudo com "N" sobre base de coluna.
 * Reprodução vetorial da identidade enviada (12/07/2026).
 * Usa currentColor para herdar o contexto (sidebar clara/escura, login etc.).
 */
export function BrandLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 122" fill="none" className={className} aria-hidden="true">
      {/* Escudo */}
      <path
        d="M50 4 L94 22 V60 C94 90 74 108 50 118 C26 108 6 90 6 60 V22 Z"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="round"
        fill="none"
      />
      {/* N */}
      <path
        d="M32 66 V30 h9 l17 24 V30 h9 v36 h-9 L41 42 v24 Z"
        fill="currentColor"
      />
      {/* Base da coluna */}
      <path d="M30 72 h40 v4 a4 4 0 0 1 -4 4 h-32 a4 4 0 0 1 -4 -4 Z" fill="currentColor" />
      {/* Fustes da coluna */}
      <rect x="34" y="84" width="8" height="24" fill="currentColor" />
      <rect x="46" y="84" width="8" height="27" fill="currentColor" />
      <rect x="58" y="84" width="8" height="24" fill="currentColor" />
    </svg>
  );
}

/** Favicon SVG (mesma marca) como data-URI — usado no index.html. */
export const BRAND_LOGO_COLOR = "#1d4ed8";
