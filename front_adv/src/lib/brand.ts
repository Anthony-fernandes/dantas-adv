/**
 * Identidade da PLATAFORMA — fonte única de branding.
 *
 * Regra de produto:
 *  - `NimbusLaw` é a plataforma (SaaS).
 *  - O escritório (tenant) tem a própria identidade e é o que o usuário
 *    do escritório e o cliente do portal devem ver com destaque.
 *  - A marca da plataforma aparece de forma discreta ("Powered by NimbusLaw")
 *    e com destaque apenas no Admin Master e em comunicações da plataforma.
 *
 * Não espalhe o texto "NimbusLaw" pelo código — importe daqui.
 */

export const BRAND = {
  /** Nome completo da plataforma. */
  name: "NimbusLaw",
  /** Nome curto (chaves técnicas, prefixos). */
  short: "nimbuslaw",
  /** Descrição padrão (meta description, landing). */
  description: "Plataforma jurídica SaaS para gestão completa de escritórios de advocacia.",
  /** Assinatura discreta exibida junto à identidade do tenant. */
  poweredBy: "Powered by NimbusLaw",
  /** Rodapé institucional da plataforma (login, landing, master). */
  footer: `© ${new Date().getFullYear()} NimbusLaw · Todos os direitos reservados`,
  /** Remetente/rotulagem de comunicações administrativas da plataforma. */
  emailName: "NimbusLaw",
  /** Domínio institucional (placeholder até definição de domínio real). */
  domain: "nimbuslaw.com.br",
  /** E-mail do encarregado de dados (LGPD). */
  dpoEmail: "dpo@nimbuslaw.com.br",
} as const;

/** Prefixo das chaves de armazenamento local/sessão. */
export const STORAGE_PREFIX = `${BRAND.short}.`;

/**
 * Título padrão de página.
 *  - Área do escritório e telas da plataforma: "Seção | NimbusLaw"
 *  - Quando o nome do tenant estiver disponível (ex.: portal), passe-o em
 *    `context` para priorizar a identidade do escritório: "Seção | Escritório X".
 */
export function pageTitle(section?: string, context?: string | null): string {
  const owner = (context && context.trim()) || BRAND.name;
  return section ? `${section} | ${owner}` : owner;
}
