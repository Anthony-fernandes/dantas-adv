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

> **Bloco 4 (12/07):** portal migrado dos endpoints gerais para `/api/portal/*` com escopo por **cliente** (client.portal_user): dashboard, processos (+detalhe/movimentos/documentos), financeiro, contratos, documentos e mensagens (GET/POST reais). Download de documento do portal via endpoint autenticado `GET /api/portal/documents/{id}/download/` (não expõe /media).
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

## 3. 🔴 Multiempresa (isolamento total)  ✅ CONCLUÍDO
- [x] Auditar todos os models/viewsets: recursos de negócio herdam `TenantScoped/TenantAudited` (auditado em 12/07)
- [x] Querysets auditados: bases tenant-scoped + views manuais (dashboard/export/search/reports) usam `request.tenant`
- [x] Uploads validam tenant do client/process; **download agora via endpoint autenticado** `GET /api/documents/{id}/download/` (tenant + access_level + auditoria); serializer não expõe mais URL direta de /media
- [x] Accounts (TenantViewSet/UserViewSet) com escopo manual correto; media estática servida apenas em DEBUG
- [x] Notificações tenant-scoped (NotificationViewSet); e-mails carregam office_name do tenant
- [x] Testes de isolamento: processes (já existiam) + documents (lista/retrieve/download/auth: 6 testes) + finance (2 testes) — suite 68/68 OK

## Roadmap por FLUXOS DE VALOR (reorganizado em 12/07 — ver PRODUCT_GAP_ANALYSIS.md)

> Um fluxo só é `[x]` quando funciona de ponta a ponta na mão do usuário.
> Ordem = maior valor comercial por esforço. Blocos 1–4 técnicos acima permanecem como histórico.

### F1 🔴 Fluxo completo de Gestão Processual ("cockpit do processo")
- [x] Timeline unificada no detalhe (consumir `/processes/{id}/timeline/`)
- [x] Ações rápidas em pop-up dentro do processo: novo andamento, prazo, audiência, tarefa, hora, upload (pré-vinculados)
- [x] Capa com partes do processo (aba Partes: adicionar/remover, papel, doc, advogado adverso + OAB)
- [x] Conflito de interesses automático: alerta na capa quando a parte contrária colide com clientes/partes do escritório
- [ ] Encerramento com resultado (êxito/perda/acordo) refletindo em relatórios
- [ ] Tudo que acontece no processo gera Movement/auditoria e aparece na timeline

### F2 🔴 Fluxo completo de Controladoria ("Meu Dia")
- [ ] Central operacional "Meu Dia": prazos fatais, audiências de hoje/semana, tarefas atrasadas — com ação direta
- [ ] Baixa de prazo com nota/comprovação → gera andamento na timeline do processo
- [ ] Sino de notificações no topbar (API `notifications` pronta)
- [ ] Busca global Cmd+K (API `/search/` pronta)
- [ ] Atribuição de responsável em prazos/tarefas + filtro "meus itens"

### F3 🔴 Fluxo completo do Portal do Cliente (ativável pelo escritório)
- [ ] Ativar portal no detalhe do cliente (convite por e-mail → cria/vincula `portal_user`)
- [ ] Caixa de mensagens do portal DENTRO do app (o escritório responde de lá)
- [ ] Notificar cliente quando andamento/documento for publicado
- [x] Portal consome apenas `/api/portal/*` com escopo por cliente (Bloco 4)
- [x] Download seguro no portal (Bloco 4)

### F4 🟠 Fluxo completo Financeiro + Honorários + Contratos
- [ ] Contrato → "Gerar parcelas/recebíveis" na UI (action backend pronta)
- [ ] Registrar pagamento (baixa) em pop-up na listagem financeira
- [ ] Faturar horas: time-entries faturáveis → invoice
- [ ] Fluxo de caixa mensal (previsto × realizado — `FinanceReportView`)
- [ ] Caixa de entrada de LEADS da landing (API pronta, sem UI hoje)
- [ ] Badge de inadimplência no cliente/processo
- [ ] Régua de cobrança (lembretes automáticos por e-mail/portal)

### F5 🟠 Fluxo completo de Documentos premium
- [ ] Gerar documento por modelo (modelo + processo → preview → GED)
- [ ] Histórico de versões + nova versão na UI
- [ ] Fluxo de assinatura eletrônica (enviar, acompanhar, webhook → timeline)
- [ ] Editor rich-text do processo (editor-documents + export PDF)

### F6 🟠 Fluxo completo da Administração da Plataforma (SaaS)
- [ ] Master real: empresas (lista/detalhe/suspensão), usuários globais, uso por tenant
- [ ] Planos/assinaturas na UI (app billing) + limites aplicados
- [ ] Onboarding self-service de escritório
- [ ] Shell visual próprio NimbusLaw (sem cara de escritório)

### F7 🟡 Configurabilidade por tenant
- [ ] Modelo `TenantOption` genérico (status, etiquetas, categorias, tipos, prioridades, motivos)
- [ ] Tela única "Configurações do escritório" (substitui rota estática)
- [ ] Substituir enums hardcoded do front por opções do backend

### F8 🟡 Segurança Enterprise (contínuo)
- [ ] Throttling/rate limit DRF por escopo
- [ ] Política de senha + MFA opcional
- [ ] Validação de upload (tipo/tamanho) — download seguro ✔ (Bloco 3/4)
- [ ] LGPD: export ✔ (`/tenant/export/`) · retenção/eliminação por titular pendente
- [ ] Revisão JWT (rotation), CORS/CSRF/headers de produção

### F9 🟡 Qualidade, performance e documentação (contínuo)
- [ ] Testes por fluxo (portal cliente A×B, cockpit, financeiro)
- [ ] E2E dos fluxos principais
- [ ] N+1/paginação; padronização de hooks/services/nomenclatura
- [ ] Documentação técnica + funcional + arquitetura por fluxo

### F10 🟡 IA (somente após F1–F5)
- [ ] Resumo de timeline/andamentos
- [ ] Rascunho de petição por modelo
- [ ] Classificação automática de documento no upload

---

### Convenção de execução por fluxo
1. Atualizar este checklist antes de começar.
2. Implementar ponta a ponta (UI + API + integrações entre módulos + auditoria/timeline).
3. Validar: typecheck + build + testes + walkthrough funcional.
4. Marcar `[x]` só quando o fluxo estiver completo na mão do usuário.
5. Relatar: valor entregue, decisões tomadas (e porquês), pendências, próximo fluxo.
