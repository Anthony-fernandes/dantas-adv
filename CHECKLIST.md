# CHECKLIST GERAL — Evolução Enterprise

> Regras: nunca marcar item sem revisão interna (bugs, tipagem, responsividade, permissões, performance, UX, consistência). Integrações externas dependem de credenciais do cliente e estão marcadas como **[EXT]**.

## Infraestrutura

* [x] Code splitting / lazy loading de rotas (bundle < 500 KB inicial)
* [x] Chunks de vendor separados (react, charts, editor)
* [x] Remoção de páginas wrapper legadas
* [x] Hardening de segurança (SECRET_KEY obrigatório, HSTS, cookies seguros)
* [x] Testes backend: isolamento multi-tenant
* [x] Testes backend: validação CNJ
* [x] Testes backend: RBAC/permissões
* [ ] CI (lint + typecheck + testes) — GitHub Actions
* [x] Logs estruturados no backend
* [ ] Auditoria ampliada (login/logout/export)

## Regras de negócio jurídicas

* [x] Validação de dígito verificador CNJ (backend)
* [x] Máscara + validação CNJ (frontend)
* [ ] Partes do processo (N partes com papel: autor/réu/terceiro; documento; advogado)
* [ ] Advogados do processo como M2M (substituir JSONField team_members)
* [ ] Custas processuais vinculadas ao processo

## Dashboard

* [x] Revisado (layout Nimbus aplicado)
* [x] KPIs com StatCard padronizado
* [x] Gráficos (recharts) com legendas corrigidas
* [ ] Agregações movidas para endpoint dedicado (performance em base grande)

## Clientes

* [x] Cadastro completo PF/PJ (docs, endereço, contatos, portal)
* [x] Tabela + cards com filtros combinados
* [x] Detalhe com abas (processos, financeiro, documentos, portal, histórico)
* [ ] Timeline consolidada do cliente
* [ ] Conflito de interesses (checagem de parte contrária na base)

## Processos

* [x] Cadastro com área, fase, status, probabilidade
* [ ] CNJ validado (depende de item acima)
* [ ] Partes múltiplas
* [x] Movimentações + linha do tempo
* [x] Prazos com prioridade/alertas
* [x] Audiências com modalidade/status
* [x] Honorários e financeiro vinculados
* [x] Uploads/documentos por processo
* [ ] [EXT] Captura automática de andamentos (PJe/e-SAJ/eproc) — ponto de extensão `TribunalSync`

## Agenda

* [x] Calendário unificado (audiências, prazos, tarefas, eventos)
* [x] Criação/edição de eventos
* [ ] Lembretes por e-mail (job scheduler)

## Financeiro

* [x] Contas a receber/pagar com parcelas
* [x] Honorários (contratos, cobrança)
* [x] Fluxo de caixa e KPIs
* [x] NFS-e (modelo + emissão)
* [x] Plano de contas / lançamentos contábeis
* [x] Relatórios exportáveis (CSV)

## Documentos

* [x] Central com versões, categorias, permissões
* [x] Modelos (templates) com variáveis
* [x] Editor rich text + export PDF
* [x] Assinatura (SignatureRequest)
* [ ] [EXT] OCR/extração automática

## Automações

* [ ] Alertas de prazo por e-mail (backend job)
* [ ] [EXT] WhatsApp
* [ ] [EXT] Workflows configuráveis

## Portal do Cliente

* [x] Login separado com papel CLIENT
* [x] Processos + andamentos
* [x] Documentos
* [x] Financeiro
* [x] Mensagens (chat)

## Administração

* [x] Usuários com perfis e permissões extras
* [x] Multi-empresa (tenants) + convites
* [x] Configurações do escritório
* [x] Auditoria consultável na UI
* [x] Master admin (SaaS)

## Integrações [EXT — dependem de credenciais]

* [ ] PJe / e-SAJ / eproc / Projudi (captura)
* [ ] Assinatura digital qualificada (ICP-Brasil)
* [ ] E-mail transacional (SMTP configurável — backend pronto)
* [ ] WhatsApp Business API

## IA [EXT]

* [ ] Resumo de processos
* [ ] Sugestão de peças
* [ ] Classificação automática de documentos

## UX/UI

* [x] Sidebar navy consistente
* [x] StatCards padronizados (cores sólidas, ícones)
* [x] Tabelas em widgets brancos sem card duplo (padrão Nimbus)
* [x] Ortografia/acentuação corrigidas em toda a UI
* [ ] Acessibilidade (aria-labels em botões-ícone)
* [ ] Responsividade auditada em todas as telas ≤ 768px
