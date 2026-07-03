# Auditoria Completa — Sistema Jurídico Dantas ADV

> Data: 2026-07-03 · Escopo: frontend (React/Vite/TS), backend (Django/DRF), banco, segurança, performance, arquitetura, UX.

## 1. Visão geral

| Camada | Stack | Volume |
|---|---|---|
| Frontend | React 18 + Vite + TS + Tailwind + shadcn/ui + TanStack Query | 161 arquivos .tsx, ~42.800 linhas |
| Backend | Django + DRF + SimpleJWT + django-filters | 9 apps, ~1.900 linhas de models, ~2.900 de API |
| Banco | SQLite (dev) / Postgres (prod via env) | Multi-tenant por FK `tenant` |

## 2. Pontos fortes encontrados

- **Multi-tenancy consistente**: `TenantScopedModelViewSet` filtra todo queryset pelo tenant do header `X-Tenant-ID`; modelos têm índices compostos por tenant.
- **Auditoria estrutural**: `TenantAuditedModelViewSet` + `AuditEvent` registram create/update/delete nos módulos jurídicos.
- **RBAC**: papéis (OWNER/ADMIN/LAWYER/FINANCE/ASSISTANT/CLIENT) aplicados em rotas frontend (`RequireRole`) e permissões backend.
- **Soft delete** em Process/Client/CalendarEvent com `deleted_at/deleted_by`.
- **Throttling** configurado (login 5/min, anon 60/min, user 120/min).
- **Timeline de processo** já agregada no backend (`build_process_timeline`).
- **Portal do cliente** com rotas separadas e permissão própria.
- **Exception handler** central e paginação padrão DRF.

## 3. Problemas críticos (P0)

| # | Problema | Evidência | Impacto |
|---|---|---|---|
| P0-1 | **Bundle único de 2,4 MB** sem code splitting; nenhuma rota lazy | `dist/assets/index-*.js` 2.48 MB; `App.tsx` sem `React.lazy` | Primeiro carregamento lento; concorrentes carregam módulos sob demanda |
| P0-2 | **Zero testes no backend** | `find apps -name "test*.py"` → 0 linhas | Regressões invisíveis em isolamento de tenant e RBAC (risco de vazamento entre escritórios) |
| P0-3 | **SECRET_KEY com fallback inseguro** (`'unsafe-secret'`) aceito silenciosamente em produção | `config/settings.py:15` | Sessões/JWT forjáveis se env não definida |
| P0-4 | **Sem validação de dígito verificador CNJ** (Resolução CNJ 65/2008) | `processes/api.py` aceita qualquer string | Números inválidos entram na base; concorrentes validam e formatam |

## 4. Problemas altos (P1)

- **Sem cabeçalhos de segurança de produção**: `SECURE_HSTS_SECONDS`, `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `SECURE_PROXY_SSL_HEADER` ausentes.
- **Monólitos no frontend**: `FinancialWorkspace.tsx` 2.413 linhas, `ProcessDetail.tsx` 2.117, páginas com componentes locais gigantes → dificulta manutenção e re-render amplo.
- **Páginas wrapper legadas** (`ClientList.tsx`, `ProcessList.tsx`, `Financial.tsx`, `ClientDetail.tsx` são só `export { default }`).
- **Partes do processo limitadas** a `plaintiff/defendant` (texto). Mercado (ProJuris/Legal One) modela N partes com papel, documento e advogado.
- **`team_members` como JSONField** em vez de M2M — impede joins e relatórios por advogado.
- **Sem virtualização** de listas longas (tabelas renderizam todas as linhas paginadas do lado do cliente em alguns módulos).

## 5. Problemas médios (P2)

- Auditoria não cobre login/logout/exportações (apenas CRUD dos viewsets auditados).
- `WorkspaceState` genérico usado como key-value UI store — ok, mas sem TTL/limpeza.
- Dashboard busca séries inteiras e agrega no cliente (ok em volume atual; degradará com base grande).
- Acessibilidade: falta `aria-label` em botões-ícone; contraste ok no tema claro, não auditado no escuro.
- Sem CI (lint/test/build) no repositório.

## 6. Comparativo com mercado (ProJuris / Legal One / Astrea / ADVBOX)

| Capacidade | Mercado | Este sistema | Gap |
|---|---|---|---|
| Cadastro processo + CNJ validado | ✔ | Parcial (sem DV) | **P0-4** |
| Partes múltiplas c/ papéis | ✔ | ✖ (2 campos texto) | P1 |
| Movimentações/andamentos | ✔ | ✔ (Movement + timeline) | — |
| Prazos c/ prioridade e alertas | ✔ | ✔ (Deadline + DeadlineAlert) | — |
| Audiências c/ modalidade | ✔ | ✔ | — |
| Timesheet | ✔ | ✔ (TimeEntry) | — |
| Financeiro AR/AP, parcelas, NFS-e | ✔ | ✔ (modelos completos) | — |
| Plano de contas / lançamentos | Parcial | ✔ | vantagem |
| Documentos c/ versões e assinatura | ✔ | ✔ (SignatureRequest) | — |
| Modelos de peças (templates) | ✔ | ✔ | — |
| Portal do cliente | ✔ | ✔ | — |
| Captura de publicações (PJe/e-SAJ/eproc) | ✔ | ✖ (`TribunalSync` é stub) | Integração externa — exige credenciais/provedores |
| WhatsApp/E-mail automação | ✔ | ✖ | Integração externa |
| IA (resumo, OCR, classificação) | Parcial | ✖ | Integração externa |
| Auditoria/logs | ✔ | ✔ (parcial) | P2 |
| App multi-escritório (SaaS) | Parcial | ✔ (tenants, billing, invites) | vantagem |

> Integrações externas (tribunais, WhatsApp, IA) dependem de credenciais e contratos de provedores; ficam registradas na checklist como fases futuras com os pontos de extensão já existentes (`TribunalSync`, `notifications`, `documents`).

## 7. Plano de ação

A ordem de execução segue `CHECKLIST.md` (raiz do repo), começando por infraestrutura (performance/segurança/testes), depois regras de negócio jurídicas, depois UX por módulo.
