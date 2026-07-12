# NimbusLaw — Product Gap Analysis

> Auditoria **funcional** do produto, feita na perspectiva de um escritório avaliando a compra.
> Referências de maturidade (não de cópia): ProJuris, Legal One, Astrea, ADVBOX, CPJ.
> Data: 2026-07-12 · Autor: Head de Produto / Arquitetura
>
> Legenda de classificação:
> **P0** = sem isso o produto não compete · **P1** = diferencial que fecha venda · **P2** = encanta/retém
> **IC** = impacto comercial · **IT** = impacto técnico · **CX** = complexidade (B/M/A)

---

## 0. Diagnóstico executivo

**Tese central:** o backend do NimbusLaw já é um produto de mercado (timeline, partes, conflito de interesses,
busca global, assinatura eletrônica, editor de documentos, NFS-e, contabilidade, billing por plano, auditoria,
calendar, export LGPD). **O frontend expõe ~40% disso e quase sempre no formato CRUD.**
O maior ganho de valor por hora investida está em **ligar o front ao que o backend já faz**, transformando
telas de cadastro em fluxos de trabalho.

**Os 5 gaps que mais afastam o NimbusLaw de um sistema de R$ 1.000+/mês:**

| # | Gap | Por quê dói | Prio |
|---|---|---|---|
| 1 | O detalhe do processo não é um **cockpit**: não se cria andamento/prazo/tarefa/documento a partir dele | O advogado vive dentro do processo; hoje precisa navegar entre 6 módulos | P0 |
| 2 | **Sem centro de trabalho diário** ("meu dia"): prazos fatais, audiências e tarefas do usuário em um só lugar com ação | Controladoria é o motivo nº 1 de compra de software jurídico | P0 |
| 3 | Busca global (Cmd+K), notificações e sino **existem no backend e não estão na UI** | Produtividade percebida; primeiro "uau" da demo | P0 |
| 4 | Financeiro não conversa com honorários/contratos/timesheet (sem fluxo contrato→fatura→parcela→baixa) | Financeiro integrado é o que justifica migrar do Excel/Astrea | P1 |
| 5 | Portal do cliente sem convite/gestão de acesso pelo escritório (quem cria `portal_user`?) | Portal só gera valor se o escritório conseguir ativar clientes sozinho | P0 |

---

## 1. Gestão Processual (coração do produto)

**Existe:** CRUD completo (CNJ validado com dígito, área, fase, tribunal, valor, probabilidade), detalhe com abas
reais (andamentos, prazos, audiências, documentos, tarefas, financeiro), partes (`process-parties`), timeline no
backend (`/processes/{id}/timeline/`), conflito de interesses (`/conflict-check/`), sync de tribunal (modelo
`TribunalSync` + central de integrações), prioridade/tags no modelo.

**Incompleto / só CRUD:**
- Detalhe do processo é **leitura**: nenhuma ação rápida (adicionar andamento, prazo, tarefa, documento, hora) sem sair da tela.
- Timeline do backend não é consumida no front (abas separadas ≠ linha do tempo unificada).
- Partes do processo sem UI (autor/réu/advogado adverso/OAB — dado essencial de capa).
- Conflito de interesses sem UI no fluxo de cadastro (deveria rodar automático ao informar parte contrária).
- `ProcessPartyViewSet`, `MovementViewSet` existem e não têm tela de gestão.

**Faltando (mercado):** vínculo processo↔responsáveis (advogado do caso), processos relacionados/apensos,
fase com workflow (Kanban de fases), encerramento com motivo/resultado (êxito, acordo), GED por processo com pastas.

| Melhoria | Prio | IC | IT | CX | Depende de |
|---|---|---|---|---|---|
| Cockpit do processo: ações rápidas em pop-up em todas as abas (andamento, prazo, audiência, tarefa, hora, documento) | **P0** | Alto | Baixo | B | pop-ups já criados |
| Timeline unificada consumindo `/processes/{id}/timeline/` | **P0** | Alto | Baixo | B | — |
| Capa do processo com partes (CRUD de `process-parties` no detalhe) | **P0** | Alto | Baixo | B | — |
| Conflito de interesses automático no cadastro (alerta ao digitar parte) | P1 | Alto | Baixo | B | — |
| Responsável pelo caso + filtro "meus processos" | P1 | Alto | Médio | M | employees |
| Kanban por fase / esteira de trabalho | P2 | Médio | Médio | M | fases configuráveis |
| Encerramento com resultado (êxito/perda/acordo) alimentando relatórios | P1 | Alto | Baixo | B | — |

---

## 2. Controladoria (prazos, audiências, tarefas, agenda) — motivo nº 1 de compra

**Existe:** CRUDs reais; agenda semanal (prazos+audiências); detecção de conflito de audiência no backend;
status confirmada; `calendar/events` (API própria) sem uso no front; alertas de prazo por e-mail (deadline_alert).

**Só CRUD / quebrado:**
- Prazos sem fluxo de **cumprimento** (baixar prazo com comprovação → vira histórico no processo).
- Nenhuma visão "**Meu dia / Minha semana**" por usuário logado.
- Tarefas sem responsável visível/atribuição, sem subtarefas, sem vínculo forte com prazo.
- Audiência sem preparação (checklist, documentos vinculados, resultado da audiência).

| Melhoria | Prio | IC | IT | CX | Depende |
|---|---|---|---|---|---|
| **Central "Meu Dia"** (dashboard operacional: prazos fatais, audiências de hoje, tarefas atrasadas, com ações de concluir/baixar) | **P0** | Muito alto | Médio | M | — |
| Baixa de prazo com nota/comprovante → gera Movement na timeline | **P0** | Alto | Baixo | B | cockpit |
| Atribuição de responsável em prazo/tarefa + filtro por advogado | P1 | Alto | Baixo | B | — |
| Resultado de audiência (realizada → ata/notas → timeline) | P1 | Médio | Baixo | B | — |
| Agenda mensal + integração calendar/events + ICS export | P2 | Médio | Médio | M | — |

---

## 3. Clientes (CRM jurídico)

**Existe:** CRUD PF/PJ rico, detalhe com abas reais, timeline consolidada do cliente (backend), contagem de processos.

**Gaps:** sem funil de captação (lead → proposta → cliente) apesar de a landing já captar leads
(`PublicLandingLeadCreateView` sem UI de gestão!); sem histórico de interações; sem alerta de conflito na
criação; sem indicador de saúde financeira do cliente (inadimplência).

| Melhoria | Prio | IC | IT | CX |
|---|---|---|---|---|
| Caixa de entrada de **leads da landing** (hoje o lead entra e ninguém vê) | **P0** | Alto | Baixo | B |
| Visão 360º do cliente: processos + financeiro + documentos + contratos + mensagens numa tela | P1 | Alto | Médio | M |
| Badge de inadimplência no cliente e no processo | P1 | Alto | Baixo | B |
| Funil comercial simples (lead→proposta→contrato) | P2 | Médio | Médio | M |

---

## 4. Financeiro + Honorários + Contratos (fluxo único, hoje 3 silos)

**Existe:** contas a receber/pagar, parcelas (`receivable-installments`), faturas (`invoices`), pagamentos
(`payments`), NFS-e, plano de contas + lançamentos contábeis, contrato → "gerar recebíveis" (action no backend!).

**Quebrado como fluxo:** o front trata cada um como lista isolada. O caminho de valor
**contrato → honorário → parcelas → cobrança → baixa → NFS-e** existe no backend e não tem UI.
Timesheet não vira fatura (horas faturáveis morrem no relatório).

| Melhoria | Prio | IC | IT | CX | Depende |
|---|---|---|---|---|---|
| Fluxo contrato→recebíveis na UI (botão "Gerar parcelas" usando a action existente) | **P0** | Alto | Baixo | B | — |
| Baixa de pagamento na listagem (registrar pagamento em pop-up, com data/forma) | **P0** | Alto | Baixo | B | — |
| Faturar horas: selecionar time-entries faturáveis → gerar invoice | P1 | Alto | Médio | M | — |
| Fluxo de caixa (previsto × realizado, por mês) usando FinanceReportView | P1 | Alto | Baixo | B | — |
| Emissão NFS-e ligada à baixa da fatura | P2 | Médio | Alto | A | integração fiscal |
| Régua de cobrança (lembrete automático de vencimento p/ cliente no portal + e-mail) | P1 | Muito alto | Médio | M | notificações |

---

## 5. Documentos (GED) + Modelos + Assinatura

**Existe:** upload multipart com versão (`new-version`), access_level por role, download seguro (Bloco 3),
editor rich-text por processo (`editor-documents` + export-pdf!), modelos com variáveis e geração
(`legal-templates/{id}/generate`), assinatura eletrônica (`signature-requests` + webhooks ClickSign/D4Sign).

**Gap grave de produto:** editor de documentos, geração por modelo e assinatura **não têm nenhuma UI**.
É funcionalidade premium pronta no backend, invisível para o cliente.

| Melhoria | Prio | IC | IT | CX |
|---|---|---|---|---|
| Gerar documento a partir de modelo (escolher modelo + processo → preview → salvar no GED) | **P0** | Muito alto | Médio | M |
| Versões de documento na UI (histórico do group_id + nova versão) | P1 | Médio | Baixo | B |
| Fluxo de assinatura: enviar p/ assinatura, acompanhar status, webhook atualiza timeline | P1 | Muito alto | Médio | M |
| Editor rich-text no detalhe do processo (petições internas + export PDF) | P2 | Alto | Médio | M |

---

## 6. Portal do Cliente

**Existe (pós Bloco 4):** dashboard, processos, movimentos, documentos com download seguro, financeiro,
contratos, mensagens bidirecionais — tudo com escopo por cliente.

**Gap crítico:** **o escritório não tem como ativar o portal para um cliente** (criar `portal_user`/convite).
Sem isso, o portal é vitrine morta.

| Melhoria | Prio | IC | IT | CX |
|---|---|---|---|---|
| Ativar portal no detalhe do cliente (convite por e-mail → cria portal_user) | **P0** | Muito alto | Médio | M |
| Mensagens do portal visíveis para o escritório (caixa de entrada por cliente no app) | **P0** | Alto | Baixo | B |
| Notificação ao cliente quando andamento/documento é publicado | P1 | Alto | Médio | M |
| 2ª via/棒 boleto + link de pagamento na cobrança do portal | P2 | Alto | Alto | A |

---

## 7. Produtividade transversal

**Existe no backend sem UI:** busca global (`/search/`), notificações (`notifications`), push
(`push-subscriptions`), workspace-state, auditoria (só listagem simples no front).

| Melhoria | Prio | IC | IT | CX |
|---|---|---|---|---|
| **Cmd+K busca global** (processos, clientes, documentos) | **P0** | Alto | Baixo | B |
| Sino de notificações no topbar (API pronta) | **P0** | Alto | Baixo | B |
| Auditoria com filtros (por entidade/usuário/período) e diff legível | P2 | Médio | Baixo | B |

---

## 8. Administração da Plataforma (Admin Master) & SaaS

**Existe:** SuperAdmin companies/users (API completa), billing plans/status (API), telas master parcialmente estáticas.

| Melhoria | Prio | IC | IT | CX |
|---|---|---|---|---|
| Master real: empresas (lista/detalhe/suspender), usuários, uso por tenant | P1 | Alto (operação SaaS) | Médio | M |
| Billing: plano por tenant + limites aplicados (max users/processes já existem no backend) | P1 | Alto | Médio | M |
| Onboarding self-service de escritório (`/api/tenants/` já existe) | P2 | Alto | Médio | M |

---

## 9. Configurabilidade (produto, não software sob medida)

Áreas jurídicas já são configuráveis (`causes`). Faltam configuráveis por tenant: status de processo, fases,
etiquetas, categorias de documento/financeiro, tipos de audiência, prioridades. Recomendação: um modelo
genérico `TenantOption(kind, value, label, order, active)` + tela única "Configurações do escritório"
(substitui a rota estática atual). **P1**, IT médio, CX M.

## 10. IA (fluxo futuro — não iniciar antes dos P0)

Candidatos de maior valor quando chegarem: resumo de andamentos/timeline, rascunho de petição por modelo,
classificação automática de documentos no upload, extração de dados de PDF (capa de processo). **P2.**

---

## Sequência recomendada (maximiza valor por sprint)

1. **F1 — Cockpit do Processo** (timeline unificada + ações rápidas + partes + conflito) → transforma o coração do produto.
2. **F2 — Meu Dia / Controladoria** (central operacional + baixa de prazo + sino + Cmd+K) → valor diário percebido.
3. **F3 — Portal ativável** (convite de cliente + inbox de mensagens no app) → destrava o argumento de venda nº 1.
4. **F4 — Financeiro integrado** (contrato→parcelas, baixa de pagamento, fluxo de caixa, leads da landing).
5. **F5 — Documentos premium** (gerar por modelo, versões, assinatura).
6. **F6 — Admin Master/Billing** (operação SaaS real).
7. **F7 — Configurabilidade por tenant** · **F8 — IA**.

> Decisão registrada: priorizamos "ligar o front ao backend existente" antes de qualquer módulo novo,
> porque é o caminho de maior valor/menor risco (backend já testado, 68 testes verdes).
