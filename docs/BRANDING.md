# NimbusLaw — Branding e Identidade

## Modelo de marca (plataforma × tenant)

| Contexto | Marca em destaque | Marca da plataforma |
|---|---|---|
| Área do escritório (`/app`) | Nome do tenant (sidebar, título) | "Powered by NimbusLaw" discreto |
| Portal do cliente (`/portal`) | Nome do escritório | "Powered by NimbusLaw" no rodapé da sidebar |
| Admin Master (`/master`) | **NimbusLaw** | — (é a própria plataforma) |
| Login / Landing / LGPD | NimbusLaw (entrada da plataforma) | — |
| E-mails do escritório (convite, prazos, audiências, boas-vindas) | Nome do escritório no cabeçalho | "Tecnologia fornecida por NimbusLaw" |
| E-mails administrativos da plataforma | NimbusLaw | — |

## Fonte única (frontend)

`front_adv/src/lib/brand.ts`:
- `BRAND` — name, short, description, poweredBy, footer, emailName, domain, dpoEmail.
- `STORAGE_PREFIX` — prefixo `nimbuslaw.` das chaves de storage.
- `pageTitle(section, context?)` — títulos padronizados (`Seção | NimbusLaw` ou `Seção | Escritório X`).

Identidade do tenant: `useActiveTenant()` (`src/lib/auth.tsx`) → nome do escritório ativo.
Campos de branding do tenant já existentes no backend (`core.Tenant`): `name`, `cnpj`,
`address`, `phone`, `email`, `logo_url` e `settings` (JSON). Cores, nome fantasia e texto
institucional devem ser guardados em `settings.branding` (sem migration; fallback NimbusLaw).

## Fonte única (backend)

- `EMAIL_BRAND_NAME` (env; default `NimbusLaw`) e `EMAIL_BRAND_COLOR` — usados por `apps/notifications/email_templates.py`.
- `DEFAULT_FROM_EMAIL` (env; default `no-reply@nimbuslaw.local`).
- Logger de requisições: `nimbuslaw.request`.
- Templates de e-mail: `_base(..., office_name=...)` — com `office_name`, o cabeçalho exibe o
  escritório + "Tecnologia fornecida por NimbusLaw"; sem, exibe NimbusLaw (comunicação da plataforma).

## Migração de chaves de storage

Implementada em `front_adv/src/lib/api.ts` (executa 1× no load, sem desconectar o usuário):

| Chave antiga | Chave nova | Storage |
|---|---|---|
| `jurisflow.access` | `nimbuslaw.access` | sessionStorage |
| `jurisflow.refresh` | `nimbuslaw.refresh` | sessionStorage |
| `jurisflow.tenant` | `nimbuslaw.tenant` | localStorage |

Fluxo: lê a chave nova → se ausente, copia da antiga → remove a antiga. A constante
`LEGACY_PREFIX = "jurisflow."` permanece no código **intencionalmente** até que a base de
usuários tenha migrado (remover em versão futura).

## Logo

Aguardando identidade visual da família Nimbus (NimbusDesk). Até lá: marca **textual** apenas.
Proibido: balança, martelo, coluna grega, deusa da justiça, ícones jurídicos clichês.
Componentes já preparados: o bloco de marca das sidebars aceita substituição do ícone.

## Varredura final (2026-07-12)

`grep -rniE "jurisflow|lawflow"` no código ativo — referências restantes e motivos:

| Local | Motivo |
|---|---|
| `front_adv/src/lib/api.ts` (2×) | `LEGACY_PREFIX` da migração compatível de storage (intencional) |
| `AUDIT_NIMBUSLAW.md`, `PROJECT_CHECKLIST.md` | Documentação histórica da auditoria (contexto preservado) |
| `.claude/worktrees/*` | Artefatos de sessões antigas, fora do controle de versão e do build |
| Migrations antigas | Não renomeadas (histórico de migrations não deve ser editado) — nomes técnicos de índices/tabelas não carregam marca visível |
