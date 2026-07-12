# NimbusLaw — Roadmap / Checklist Central

> Fonte única de verdade do projeto. Marque `[x]` **apenas** quando 100% concluído e validado.
> Regra: atualizar este arquivo **antes** e **depois** de cada bloco. Nunca avançar sem validar o anterior.
> Legenda: 🔴 P0 (bloqueante) · 🟠 P1 · 🟡 P2 · ✅ já existente no código atual.

Referência de diagnóstico: `AUDIT_NIMBUSLAW.md`.

---

## 0. Auditoria e Plano
- [x] Auditoria completa do frontend, backend, tenancy, segurança, mocks e UX (`AUDIT_NIMBUSLAW.md`)
- [x] Criar `PROJECT_CHECKLIST.md` (este documento)
- [ ] Validação do plano com o Product Owner (aguardando OK para iniciar Bloco 1)

---

## 1. 🔴 Branding — NimbusLaw + marca por tenant
- [ ] Centralizar branding da plataforma numa constante (`src/lib/brand.ts`: `PLATFORM = "NimbusLaw"`)
- [ ] `index.html`: título e meta → NimbusLaw; favicon novo (placeholder textual por enquanto)
- [ ] Sidebar app/portal: exibir **nome do escritório (tenant)**, com "powered by NimbusLaw" discreto
- [ ] Remover "JurisFlow" de todos os `head/meta title` das rotas (helper de título)
- [ ] Migrar chaves de storage `jurisflow.*` → `nimbuslaw.*` (com limpeza das antigas)
- [ ] Backend: `EMAIL_BRAND_NAME`, `DEFAULT_FROM_EMAIL`, loggers `lawflow.*` → NimbusLaw/env
- [ ] Remover branding antigo de `mock.ts` (ou eliminar o arquivo — ver Bloco 2)
- [ ] Varredura final: 0 ocorrências de `JurisFlow`/`LawFlow` no repo (exceto histórico)

## 2. 🔴 Eliminar mocks — tudo consumindo API real
- [ ] `app.prazos.$id` → API real (`deadlines/:id`)
- [ ] `app.tarefas.$id` → API real (`tasks/:id`)
- [ ] `app.audiencias.$id` → API real (`hearings/:id`)
- [ ] `app.contratos.$id` → API real (`contracts/:id`)
- [ ] `app.documentos.$id` → API real (`documents/:id` + download seguro)
- [ ] `app.financeiro.$id` → API real (receber/pagar)
- [ ] `app.honorarios.$id` → API real
- [ ] `app.nfse.$id` → API real
- [ ] `app.horas.$id` → API real (`time-entries/:id`)
- [ ] `app.areas.$id` → API real (`causes/:id`)
- [ ] `app.modelos.$id` → API real (`legal-templates/:id`)
- [ ] `app.cargos.$id` → API real (`job-positions/:id`)
- [ ] `app.funcionarios.$id` → API real (`employees/:id`)
- [ ] `app.usuarios.$id` → API real (`users/:id`)
- [ ] `app.empresas.$id` → API real (tenant/empresa)
- [ ] `portal.index` → API real
- [ ] `portal.financeiro` → API real
- [ ] `portal.contratos` → API real
- [ ] `app.agenda` → API real (prazos+audiências)
- [ ] `app.chat` → API real (`chat`) ou remover se fora de escopo
- [ ] Módulos "vitrine" (`blog/landing/relatorios/integracoes/contabilidade`): dados reais ou ocultar do menu
- [ ] Excluir `src/lib/mock.ts` e garantir build limpo sem ele

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
