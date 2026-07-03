# CHECKLIST 2 — Auditoria Profunda (pré-lançamento)

> Gerado pela segunda auditoria. Apenas gaps confirmados no código — cada item cita a evidência. Itens [EXT] dependem de credenciais/contratos externos.

## Produtividade central

* [x] **Busca global real (Cmd+K)** — hoje `GlobalSearch.tsx` só navega entre páginas (lista estática `NAV_COMMANDS`); não encontra processos, clientes nem documentos. Concorrentes têm busca universal. → endpoint `/api/search/` + integração no palette.
* [ ] **Tags de processo na UI** — campo `tags` existe no modelo mas não aparece em formulário, tabela nem filtro.
* [ ] **Prioridade de processo** — modelo não tem campo priority (só Deadline/Task têm). Escritórios triam carteira por prioridade.

## Agenda e audiências

* [x] **Detecção de conflito de horário de audiências** — nada impede duas audiências do mesmo responsável no mesmo horário. → aviso na criação.
* [x] **Status CONFIRMADA para audiência** — fluxo padrão do mercado (agendada → confirmada → realizada); hoje só agendada/realizada/redesignada/cancelada.
* [ ] Visão diária na agenda (hoje: mês/semana/lista)
* [ ] Recorrência de eventos [defer: modelagem RRULE]

## Portal do Cliente

* [ ] **Cliente enviar documentos pelo portal** — `PortalDocumentsView` é somente leitura; escritórios recebem documentos por WhatsApp por falta disso. → endpoint de upload + UI.
* [x] Acompanhar processos/movimentações/documentos/financeiro/mensagens (verificado — completo)

## Verificados como já completos nesta auditoria

* [x] Notificações in-app com contador no Topbar (`useNotifications`)
* [x] Busca textual de documentos no servidor (`search_fields` inclui content)
* [x] Timeline do processo consolidada (movements + deadlines + hearings)
* [x] Histórico de alterações (AuditEvent em todos os viewsets jurídicos)
* [x] Parcelamentos, inadimplência (juros/multa), fluxo de caixa
* [x] Versionamento de documentos (group_id/version/is_latest)
* [x] Assinatura (SignatureRequest)
* [x] Permissões por papel + permissões extras por usuário

## Diferido (externo ou refactor maior — justificado)

* [ ] [EXT] Boletos/PIX (gateway), conciliação bancária, Diário Oficial, tribunais, WhatsApp, Google/Outlook Calendar, IA
* [ ] Dashboard com agregação server-side (refactor grande; correto no volume atual)
* [ ] Advogados M2M substituindo team_members JSON (migração coordenada)
* [ ] Comparação visual entre versões de documento
* [ ] Campos personalizados por tenant
