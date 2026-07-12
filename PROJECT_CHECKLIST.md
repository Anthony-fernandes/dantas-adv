# NimbusLaw — Roadmap / Checklist Central

> Fonte única de verdade do projeto. Marque `[x]` **apenas** quando 100% concluído e validado.
> Regra: atualizar este arquivo **antes** e **depois** de cada bloco. Nunca avançar sem validar o anterior.
> Legenda: 🔴 P0 (bloqueante) · 🟠 P1 · 🟡 P2 · ✅ já existente no código atual.

Referência de diagnóstico: `AUDIT_NIMBUSLAW.md`.

---

## 0. Auditoria e Plano
- [x] Auditoria completa do frontend, backend, tenancy, segurança, mocks e UX (`AUDIT_NIMBUSLAW.md`)
- [x] Criar `PROJECT_CHECKLIST.md` (este documento)
- [x] Validação do plano com o Product Owner (aprovado — execução contínua autorizada)

---

## 1. 🔴 Branding — NimbusLaw + marca por tenant  ✅ CONCLUÍDO
- [x] Centralizar branding da plataforma (`src/lib/brand.ts`: `BRAND`, `STORAGE_PREFIX`, `pageTitle()`)
- [x] `index.html`: título e meta description → NimbusLaw (favicon oficial aguarda identidade NimbusDesk)
- [x] Sidebar app/portal: exibir **nome do escritório (tenant)** via `useActiveTenant()`, com "Powered by NimbusLaw" discreto
- [x] Títulos das rotas padronizados via `pageTitle()` (61 arquivos; padrão "Seção | NimbusLaw" / "… — Portal do Cliente" / "… — Admin Master")
- [x] Migrar chaves de storage `jurisflow.*` → `nimbuslaw.*` (migração compatível, sem desconectar sessões — ver `docs/BRANDING.md`)
- [x] Backend: `EMAIL_BRAND_NAME` default NimbusLaw, `DEFAULT_FROM_EMAIL` → `no-reply@nimbuslaw.local`, loggers `lawflow.request` → `nimbuslaw.request`
- [x] E-mails: comunicação do escritório destaca o tenant + "Tecnologia fornecida por NimbusLaw" (`email_templates._base(office_name=…)`)
- [x] Remover branding antigo de `mock.ts` (arquivo será eliminado no Bloco 2)
- [x] Varredura final documentada em `docs/BRANDING.md` (únicas refs restantes: migração legada em `api.ts` + docs de auditoria)
- [x] Bonus: migração `finance.0007` gerada já blindada (rename de índice idempotente p/ SQLite)

## 2. 🔴 Eliminar mocks — tudo consumindo API real  ✅ CONCLUÍDO
- [x] `app.prazos.$id` → API real (`deadlines/:id`)
- [x] `app.tarefas.$id` → API real (`tasks/:id`)
- [x] `app.audiencias.$id` → API real (`hearings/:id`)
- [x] `app.contratos.$id` → API real (`contracts/:id`)
- [x] `app.documentos.$id` → API real (`documents/:id`; download seguro será endurecido no Bloco de uploads)
- [x] `app.financeiro.$id` → API real (tenta receber e pagar)
- [x] `app.honorarios.$id` → API real (`invoices/:id`)
- [x] `app.nfse.$id` → API real (`nfse/:id`)
- [x] `app.horas.$id` → API real (`time-entries/:id`)
- [x] `app.areas.$id` → API real (`causes/:id`)
- [x] `app.modelos.$id` → API real (`legal-templates/:id`)
- [x] `app.cargos.$id` → API real (`job-positions/:id`)
- [x] `app.funcionarios.$id` → API real (`employees/:id`)
- [x] `app.usuarios.$id` → API real (`users/:id`)
- [x] `app.empresas.$id` → dados reais (tenants da sessão)
- [x] `portal.index` → API real (processos + documentos + contas a receber)
- [x] `portal.financeiro` → API real (`accounts-receivable`)
- [x] `portal.contratos` → API real (`contracts`)
- [x] `app.agenda` → API real (semana com prazos + audiências, navegação de semanas)
- [x] `app.chat` → removido do menu (backend de chat será avaliado em bloco futuro; rota preservada)
- [x] Módulos "vitrine" ocultados do menu (blog, landing, relatórios, integrações, contabilidade, configurações) até terem backend real
- [x] `src/lib/mock.ts` excluído — typecheck e build limpos

## 3. 🔴 Multiempresa (isolamento total)
- [ ] Auditar todos os models: FK `tenant` obrigatória em todo registro de negócio
- [ ] Auditar todos os querysets/managers: filtro por tenant (revisar `get_queryset`)
- [ ] Uploads/downloads (`documents`): validar tenant no objeto, não só na rota
- [ ] Endpoints globais (Admin Master / `/public/*` / convites): confirmar não-vazamento
- [ ] Tarefas assíncronas e notificações carregam tenant
- [ ] Testes automatizados de isolamento (tenant A nunca lê/escreve dados de B)

## 4. 🟠 Admin Master (plataforma SaaS)
- [ ] Separar visualmente do app do escritório (shell próprio, sem cara de tenant)
- [ ] Gestão de escritórios (tenants): CRUD, status, suspensão
- [ ] Planos e assinaturas (ligar ao app `billing`: Plan/Subscription)
- [ ] Cobrança e uso (UsageSnapshot / limites)
- [ ] Logs, métricas e auditoria da plataforma
- [ ] Suporte e licenciamento

## 5. 🟠 Configurabilidade por tenant
- [ ] Status configuráveis (processo/tarefa/financeiro)
- [ ] Etiquetas/tags e categorias
- [ ] Tipos, prioridades, etapas e motivos
- [ ] Modelos de documento por tenant
- [ ] Campos personalizados
- [ ] Workflows/fluxos configuráveis
- [ ] Substituir enums hardcoded do front por dados do backend

## 6. 🟠 Segurança Enterprise
- [ ] Throttling/rate limit DRF por escopo
- [ ] Política de senha + MFA opcional por tenant
- [ ] Validação de upload (tipo/tamanho/verredura) e download assinado
- [ ] LGPD: export/retenção/eliminação por titular
- [ ] Revisão de escopo/expiração dos JWT e refresh rotation
- [ ] Revisão CORS/CSRF/headers para produção

## 7. 🟡 UX — central do processo e módulos secundários
- [ ] Detalhe de processo como "central": partes, movimentações, honorários, comunicações, histórico unificado
- [ ] Reduzir CRUD puro / cards desnecessários nas telas secundárias
- [ ] Padronizar componentes (tabela, detalhe, filtros, pop-ups) num design system coeso
- [ ] Revisão de responsividade (mobile/tablet) e dark mode em todas as telas

## 8. 🟡 Portal do cliente
- [ ] Garantir escopo: cliente vê só o que é dele (processos, docs, contratos, movimentações, financeiro, mensagens, arquivos)
- [ ] Todas as telas do portal em API real (ver Bloco 2)
- [ ] Branding do escritório no portal (Bloco 1)

## 9. 🟡 Testes
- [ ] Autenticação e permissões (RBAC)
- [ ] Isolamento multi-tenant (Bloco 3)
- [ ] Portal, Processos, Clientes, Financeiro, Documentos, Contratos
- [ ] E2E dos fluxos principais (login → processo → prazo → documento → financeiro)

## 10. 🟡 Performance e padronização
- [ ] Remover código morto, imports inúteis e componentes duplicados
- [ ] Revisar queries N+1 e paginação/filtros em todos os endpoints
- [ ] Padronizar hooks/services/DTOs/schemas/nomenclaturas/pastas

## 11. 🟡 Documentação
- [ ] Documentação técnica (setup, arquitetura, deploy)
- [ ] Documentação funcional (módulos e fluxos)
- [ ] Documentação de arquitetura (multi-tenant, segurança, billing)
- [ ] Manter atualizada a cada bloco implementado

---

### Convenção de execução por bloco
1. Atualizar este checklist (marcar itens em andamento).
2. Implementar.
3. Validar (typecheck + build + testes + verificação funcional).
4. Marcar `[x]` só o que foi 100% concluído.
5. Relatar: o que mudou, arquivos alterados, pendências, próximo bloco.
