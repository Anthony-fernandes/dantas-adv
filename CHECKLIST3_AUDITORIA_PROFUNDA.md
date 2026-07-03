# CHECKLIST 3 — AUDITORIA PROFUNDA POR MÓDULO

> Terceira auditoria, orientada a produto. Cada item traz: status, evidência no código, problema, impacto, solução, prioridade, arquivos e critério de aceite.
> Status: ✅ completo · 🟡 básico/incompleto · 🔴 ausente · 🔧 em implementação nesta rodada

---

## 1. Dashboard jurídico

| Item | Status | Evidência |
|---|---|---|
| KPIs jurídicos (processos, prazos, audiências) | ✅ | `Dashboard.tsx` linhas 917-1000, cards com comparativo de período |
| KPIs financeiros condicionais a papel | ✅ | `canSeeFinance` + RBAC |
| Gráficos (agenda, status, faturamento×inadimplência) | ✅ | recharts, séries agregadas |
| Alertas críticos (vencidos, audiências imediatas) | ✅ | seção "alertas" com EmptyState |
| Agregação server-side | 🔴 | `getStrategicDashboardData` busca TODAS as páginas de 8 recursos |

**Item pendente: agregação server-side**
- Problema: em escritório com 5k+ processos o dashboard baixa tudo para o navegador.
- Impacto: performance degrada com crescimento; concorrentes agregam no servidor.
- Solução: expandir `LegalDashboardView` com séries e somatórios; frontend consome pronto.
- Prioridade: P2 (correto no volume atual). Arquivos: `core/dashboard_api.py`, `services/dashboard.ts`.
- Critério de aceite: dashboard carrega com ≤3 requisições e payload <100KB.

## 2. Processos

| Item | Status | Evidência |
|---|---|---|
| Timeline completa (mov+prazos+audiências) | ✅ | `build_process_timeline` + aba Timeline |
| Partes com papéis/OAB/conflito | ✅ | `ProcessParty` + `ProcessPartiesTab` (auditoria 1) |
| Responsável + histórico de alterações | ✅ | `responsible_lawyer` + AuditEvent em updates |
| Documentos, prazos, audiências, tarefas, horas | ✅ | abas no `ProcessDetail.tsx:1522-1560` |
| Tags e prioridade | ✅ | auditoria 2 (form+tabela+filtro) |
| Risco, valor da causa, tribunal, vara, fase, status | ✅ | modelo + form |
| CNJ validado + Datajud lookup | ✅ | `cnj.py` + `useCnjLookup` |
| Auditoria por processo | ✅ | aba "Histórico" consome AuditEvent |
| **Financeiro do processo no detalhe** | 🔧 | NENHUMA aba financeiro em `ProcessDetail` (grep TabsTrigger) — backend já filtra receivables/payables por processo |
| Comentários internos | 🟡 | Movement type "outro" serve de nota interna; sem thread dedicada (aceitável) |
| Processos relacionados/agrupados | 🔴 | sem campo no modelo — P3, exige modelagem |

**Item em implementação: aba Financeiro do processo**
- Problema: honorários, contas a receber/pagar do processo existem mas são invisíveis no detalhe do processo.
- Impacto: advogado precisa sair do caso e filtrar manualmente no módulo financeiro; ProJuris/Astrea mostram no processo.
- Solução: aba "Financeiro" no ProcessDetail com resumo (a receber, recebido, a pagar/custas) e listas.
- Prioridade: P0. Arquivos: `ProcessDetail.tsx`, novo `ProcessFinanceTab.tsx`.
- Critério de aceite: aba mostra receivables+payables do processo com totais, respeitando RBAC (FINANCE ou LEGAL vê leitura).

## 3. Clientes

| Item | Status | Evidência |
|---|---|---|
| Cadastro PF/PJ completo (docs, endereço, CEP lookup) | ✅ | `ClientsWorkspace` + masks |
| Visão 360 (abas processos/financeiro/docs/portal/histórico) | ✅ | `ClientDetailWorkspace` |
| Timeline consolidada + interações (ligação/e-mail/reunião) | ✅ | `buildTimeline` (5 fontes) |
| Responsável, tags, segmentação por status | ✅ | modelo + filtros |
| Conflito de interesses | ✅ | auditoria 1 |
| Score/classificação comercial | 🔴 | P3 — depende de definição comercial do produto |

## 4. Agenda

| Item | Status | Evidência |
|---|---|---|
| Visões mês/semana/lista | ✅ | `AgendaPage.tsx:458` view state |
| Eventos + audiências + prazos + tarefas unificados | ✅ | agregação em `agenda/utils.ts` |
| Criação/edição/exclusão de eventos | ✅ | `AgendaEventFormDialog` |
| **Visão diária** | 🔧 | só month/week/list — dia é a visão de trabalho do advogado em fórum |
| **Filtro por responsável (agenda por advogado)** | 🔧 | responsável só aparece como texto no card |
| **Recorrência** | 🔧 | `CalendarEvent` sem campos de recorrência (grep rrule/recurrence = 0) |
| Conflito de horários (audiências) | ✅ | auditoria 2 |
| Reagendamento | ✅ | fluxo redesignar audiência com histórico |
| Lembretes | ✅ | `send_deadline_alerts` + reminders de audiência |

**Itens em implementação: visão diária, agenda por advogado, recorrência**
- Prioridade: P1. Arquivos: `AgendaPage.tsx`, `core/models.py` (CalendarEvent), `calendar_api.py`, `AgendaEventFormDialog.tsx`.
- Critérios: (a) botão "Dia" mostra colunas de horário do dia corrente; (b) select de responsável filtra todos os tipos de item; (c) evento com recorrência diária/semanal/mensal/anual + data-fim gera ocorrências na janela visível.

## 5. Audiências

| Item | Status | Evidência |
|---|---|---|
| Workflow agendada→confirmada→realizada/cancelada/adiada | ✅ | auditoria 2 destravou confirmada |
| Conflito de pauta ±90min | ✅ | `check-conflict` endpoint |
| Modalidade, local, link online, participantes | ✅ | modelo Hearing |
| Vínculo com processo + timeline | ✅ | FK + build_process_timeline |
| Preparação (notas, checklist por audiência) | ✅ | extras em workspace-state (notesHistory, reminders) |

## 6. Prazos

✅ completo: prioridade, status, responsável, alertas D-7/3/1/0 multi-canal, KPIs, vínculo com processo, fatal/não-fatal via prioridade urgente. Sem pendência relevante para lançamento.

## 7. Tarefas / Timesheet

✅ CRUD com prioridade, status, vínculo a processo, kanban+tabela; TimeEntry com cronômetro, valor/hora e vínculo a processo. P3: aprovação de horas (fluxo de revisão) — não bloqueia venda.

## 8. Documentos e Modelos

| Item | Status | Evidência |
|---|---|---|
| Versionamento (group_id/version/is_latest) | ✅ | `documents/models.py:171-180` |
| Categorias, permissões por papel, restritos | ✅ | DocumentAccess TENANT/ROLES |
| Busca textual server-side | ✅ | search_fields com content |
| Modelos com variáveis + geração por processo | ✅ | TemplatesWorkspace + editor-documents |
| Editor rich text + export PDF | ✅ | ProcessRichDocumentEditor |
| Assinatura | ✅ | SignatureRequest + dialog |
| Comparação visual entre versões | 🔴 | P3 — diff de rich text é projeto próprio |
| OCR | 🔴 | [EXT] exige serviço externo; ponto de extensão: категория+pipeline em documents |

## 9. Portal do Cliente

| Item | Status | Evidência |
|---|---|---|
| Processos + detalhe + timeline | ✅ | PortalProcessListView/DetailView/TimelineView |
| Movimentações | ✅ | PortalMovementsView |
| Documentos (baixar) | ✅ | PortalDocumentsView com filtro de acesso |
| **Documentos (enviar)** | ✅ | auditoria 2: upload + notificação + auditoria |
| Financeiro | ✅ | PortalFinancialView |
| Mensagens (chat) | ✅ | PortalMessages + ChatMessage |
| Notificações ao cliente | 🟡 | in-app não cobre o portal — P2: reutilizar Notification para papel CLIENT |
| Contratos no portal | 🔴 | P2 — expor contratos ativos (leitura) |

## 10. Financeiro

| Item | Status | Evidência |
|---|---|---|
| AR/AP, parcelas, juros/multa configuráveis | ✅ | modelos + ReceivableInstallment |
| Honorários por contrato/processo | ✅ | Contract + receivables categoria honorários |
| Custas por processo | ✅ | payables categoria custas + FK |
| Fluxo de caixa + KPIs + comparativos | ✅ | FinancialWorkspace 9 KPIs |
| Inadimplência | ✅ | cálculo + filtro urgency=overdue |
| NFS-e | ✅ | modelo + emissão |
| Plano de contas / lançamentos | ✅ | Contabilidade |
| Relatórios CSV | ✅ | export por aba |
| Boleto/PIX/conciliação | 🔴 | [EXT] gateway — estrutura pronta (Payment.provider), falta credencial |

## 11. Contratos

✅ CRUD com tipo de cobrança, valor, parcelas, vínculo cliente/processo (`ContractsPage.tsx`). P2: geração de recebíveis a partir do contrato em um clique.

## 12. Notificações

✅ In-app com sino/contador no Topbar, marcação de lida; e-mail via alertas de prazo; push subscription model existe. P2: preferências por usuário na tela de perfil.

## 13. Permissões / Auditoria / Configurações

✅ RBAC 6 papéis frontend+backend; permissões extras por usuário; AuditEvent em CRUD+login/logout/export/conflito; AuditLogPage consultável; Settings com escritório/alertas/branding. Sem bloqueio de lançamento.

## 14. Relatórios

✅ 6 abas (financeiro, jurídico, audiências, honorários, horas, equipe) com filtros e export. P2: relatório de produtividade por advogado com drill-down.

## 15. Integrações de tribunal

| Item | Status | Evidência |
|---|---|---|
| Modelo TribunalSync (provider, status, erro, raw) | ✅ | `models.py` |
| Serviços PJe/e-SAJ (parse HTML) | 🟡 | `integrations/pje.py|esaj.py` — parsers best-effort |
| Consulta Datajud no form (CNJ lookup) | ✅ | `useCnjLookup` + botão no ProcessForm |
| Painel por processo | ✅ | `TribunalSyncPanel.tsx` (aba Tribunal) |
| **Tela admin central de sincronizações (status/logs/re-tentar)** | 🔧 | inexistente — só visão por processo |
| Sync agendado | 🟡 | comando `check_deadlines` existe; sync de tribunal é manual |

**Item em implementação: central de integrações**
- Solução: página admin listando TribunalSyncs do tenant com status, última sincronização, erro e ação de re-sincronizar; documentação do que falta para ativar captura automática.
- Prioridade: P1. Critério: admin vê todas as sincronizações, filtra por status e dispara retry.

## 16. Segurança / Performance / Responsividade / UX

✅ cobertos nas auditorias 1-2 (headers, SECRET_KEY, throttling, code-splitting, aria-labels, overflow móvel, 39 testes). Pendências P2: virtualização de listas >500 linhas; testes E2E.

---

# FILA DE IMPLEMENTAÇÃO DESTA RODADA

* [x] P0 — Aba Financeiro no detalhe do processo
* [x] P1 — Agenda: visão diária (verificado: já existia — AGENDA_VIEW_OPTIONS inclui 'day' com renderização própria)
* [x] P1 — Agenda: filtro por responsável (verificado: já existia — AgendaFilters.tsx:116 + filterAgendaEvents)
* [x] P1 — Recorrência de eventos (diária/semanal/mensal/anual + fim)
* [x] P1 — Central admin de integrações de tribunal (status/logs/retry + doc de ativação + comando sync_tribunals)
* [ ] P2 — Contratos: gerar recebíveis do contrato
* [ ] P2 — Portal: notificações para papel CLIENT
