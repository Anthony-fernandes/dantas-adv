# NimbusLaw — Auditoria Completa (Baseline)

> Documento de diagnóstico. Não altera código. Base para o `PROJECT_CHECKLIST.md`.
> Data: 2026-07-12 · Branch: `claude/gifted-pascal-6suvyw`

Objetivo do produto: transformar um sistema feito para **um** escritório em um
**SaaS jurídico multiempresa** (NimbusLaw) vendável para centenas de escritórios.
Pergunta-guia em toda decisão: *"isso serve para um escritório ou para centenas?"*

---

## 1. Visão geral da arquitetura

| Camada | Stack | Situação |
|---|---|---|
| Frontend | Vite 6 + React 18 + TanStack Router (SPA) + Tailwind v4 + React Query | Funcional, integrado ao backend |
| Backend | Django 5.2 + DRF + SimpleJWT | Funcional, multi-tenant por header `X-Tenant-ID` |
| Banco | SQLite (dev) / Postgres (prod via `DATABASE_URL`) | OK |
| SaaS | app `billing` (Plan / Subscription / UsageSnapshot) | Fundação existe, não exposta no produto |
| Auth | JWT access/refresh, RBAC (OWNER/ADMIN/LAWYER/ASSISTANT/FINANCE/CLIENT) | OK |

Apps backend: `accounts, billing, chat, clients, core, documents, finance, notifications, processes` (10).
~85 views DRF. `core` concentra tenancy: `TenantContextMiddleware`, `TenantScopedModelViewSet`, `TenantScopedQuerysetMixin`.

Rotas frontend: 86 arquivos em `src/routes/`.

---

## 2. Branding (bloqueante para virar produto)

**90 ocorrências** de `JurisFlow` no frontend + referências a `LawFlow` no backend.

Pontos concretos:
- `front_adv/index.html` → `<title>JurisFlow — Plataforma Jurídica</title>` + `favicon.ico` genérico.
- `AppSidebar.tsx` / `PortalSidebar.tsx` → nome **"JurisFlow" hardcoded** (deveria exibir a marca do escritório/tenant).
- `src/lib/api.ts` → chaves de storage `jurisflow.access` / `jurisflow.refresh` / `jurisflow.tenant`.
- Todos os `head/meta title` das rotas: `"… — JurisFlow"`.
- Backend: `DEFAULT_FROM_EMAIL = no-reply@lawflow.local`; `EMAIL_BRAND_NAME` default `"JurisFlow"` em `notifications/email_templates.py`; logger `lawflow.request`.
- `src/lib/mock.ts` → dados com `@jurisflow.com.br`, "JurisFlow Advocacia Matriz" etc.

**Regra de produto:** `NimbusLaw` é a **plataforma**; o **tenant** tem a própria
identidade (nome, e futuramente logo/cores). O nome exibido no shell/portal deve
vir do tenant (`useAuth().activeTenant` / `tenants`), com `NimbusLaw` só no rodapé
"powered by" e no Admin Master.

---

## 3. Dados mockados (gap central: "tudo deve consumir API real")

`src/lib/mock.ts` (159 linhas) ainda é importado por **19 rotas**:

- **15 telas de detalhe `app.<módulo>.$id`** usam mock (exceto `clientes.$id` e `processos.$id`, que já são reais):
  `areas, audiencias, cargos, contratos, documentos, empresas, financeiro, funcionarios, honorarios, horas, modelos, nfse, prazos, tarefas, usuarios`.
- **Telas estáticas:** `app.agenda.tsx`, `app.chat.tsx` (conversa hardcoded), `app.blog.tsx`, `app.landing.tsx`, `app.relatorios/integracoes/contabilidade/configuracoes` (via `ModuleScaffold` com números fixos).
- **Portal:** `portal.index.tsx`, `portal.financeiro.tsx`, `portal.contratos.tsx` ainda em mock/estático.

As **listagens** e **cadastros** dos módulos principais já são reais (trabalho anterior). O buraco está nas **telas de detalhe** e em alguns módulos secundários.

---

## 4. Multiempresa (multi-tenant) — precisa de auditoria linha a linha

Fundação **existe e é razoável**: `TenantContextMiddleware` exige `X-Tenant-ID`
(UUID), e viewsets herdam `TenantScopedModelViewSet`. Porém a mandato exige
garantir **isolamento total**. A auditar/validar com testes:
- Todo model de negócio tem FK `tenant` **obrigatória**.
- Todo queryset filtra por tenant (revisar as ~19 `get_queryset` + managers).
- Uploads/downloads de `documents` validam tenant no objeto, não só na rota.
- Endpoints globais (Admin Master, `/public/*`, convites) — confirmar que NÃO vazam entre tenants.
- Tarefas assíncronas / notificações carregam tenant.

Status: **fundação OK, cobertura a comprovar com testes de isolamento**.

---

## 5. Segurança (baseline decente, revisar para Enterprise)

Já presente em `config/settings.py`: `SECURE_HSTS_*`, `SESSION_COOKIE_SECURE`,
`CSRF_COOKIE_SECURE`, `SECURE_CONTENT_TYPE_NOSNIFF`, `X_FRAME_OPTIONS=DENY`, CORS
por allowlist, `DEBUG` por env. A endereçar: rate limiting/throttling DRF,
política de senha/MFA, verredura de upload (tipo/tamanho/antivírus), retenção e
export LGPD por titular, revisão de escopo dos JWT.

---

## 6. Admin Master (plataforma) — separar do escritório

Existem `master.login/companies/users/metrics/security`. Precisa: não parecer um
escritório; administrar **tenants, planos, assinaturas, cobranças, uso, logs,
métricas, suporte, licenciamento** — ligado ao app `billing`.

---

## 7. Configurabilidade (pensamento de produto)

Hoje configurável: **áreas jurídicas** (`causes`). Faltam tornar configuráveis por
tenant: **status, etiquetas/tags, categorias, tipos, prioridades, etapas, motivos,
modelos, campos personalizados, workflows**. Hoje muitos são enums hardcoded no
front (ex.: prioridades, status de processo/tarefa).

---

## 8. UX / Integração entre módulos

Módulos principais já se conectam (processo ↔ cliente ↔ prazos/audiências/tarefas/
documentos, aba financeira no processo). Faltam telas de detalhe reais para virar
uma "central do processo" completa (partes, movimentações, honorários, comunicações,
histórico unificado) e reduzir CRUD puro em telas secundárias.

---

## 9. Testes / Qualidade

- CI (lint + typecheck + testes + build) já existe.
- Testes backend de tenancy/CNJ/auth existem; faltam testes de **isolamento entre
  tenants**, portal, financeiro/documentos e E2E dos fluxos principais.
- `tsc --noEmit` e `vite build` limpos no estado atual.

---

## 10. Prioridização (resumo)

| Prioridade | Bloco | Porquê |
|---|---|---|
| P0 | Rebranding NimbusLaw + marca por tenant | Bloqueia comercialização; remove identidade antiga |
| P0 | Eliminar mocks (detalhes `$id` + portal) → API real | Requisito explícito "nada mockado" |
| P0 | Auditoria multi-tenant com testes de isolamento | Segurança de dados entre escritórios |
| P1 | Admin Master (planos/assinaturas/uso) ligado a `billing` | Operação do SaaS |
| P1 | Configurabilidade por tenant (status/tags/tipos/campos) | Servir centenas, não um |
| P1 | Segurança Enterprise (throttling, uploads, LGPD, MFA) | Maturidade |
| P2 | UX central do processo + módulos secundários reais | Competir com ProJuris/Astrea |
| P2 | Testes E2E + documentação técnica/funcional/arquitetura | Sustentação |

O detalhamento acionável está em `PROJECT_CHECKLIST.md`.
