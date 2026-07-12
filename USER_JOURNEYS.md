# NimbusLaw — User Journeys (jornadas de trabalho por perfil)

> Base de decisão para o "Meu Workspace" e a Central de Trabalho.
> Princípio: o usuário não abre módulos — ele **trabalha**. O sistema organiza o dia dele.
> Papéis técnicos correspondentes: OWNER, ADMIN, LAWYER, ASSISTANT (controladoria/secretaria), FINANCE, CLIENT.

---

## 1. Sócio (OWNER)
- **Objetivos:** rentabilidade, crescimento, controle de risco, decisão rápida.
- **Responsabilidades:** resultado do escritório, clientes estratégicos, aprovação de exceções.
- **Atividades:** revisar indicadores (semanal), acompanhar grandes casos (diária), aprovar propostas/descontos (eventual).
- **Frequência de uso:** 2–3×/semana, sessões curtas — precisa de resposta em 30 segundos.
- **Informações:** faturamento, inadimplência, carteira ativa, produtividade (horas × faturado), riscos (prazos estourados), funil de novos clientes.
- **Indicadores:** receita mês/ano, a receber vencido, processos ativos, horas faturáveis não cobradas, prazos vencidos do escritório.
- **Dores:** dado espalhado em relatórios; não sabe "como está o escritório hoje" sem pedir a alguém.
- **Automação futura (IA):** resumo executivo semanal, alerta de desvio (inadimplência subiu, prazos em risco).

## 2. Advogado(a) (LAWYER)
- **Objetivos:** cumprir prazos, ganhar casos, atender bem clientes, registrar horas.
- **Atividades diárias:** ver audiências/prazos do dia, protocolar peças, registrar andamentos, responder clientes, lançar horas.
- **Frequência:** o dia inteiro — é a persona nº 1 do Workspace.
- **Informações:** MEUS prazos (fatais primeiro), MINHAS audiências, processos com movimentação nova, mensagens de cliente sem resposta, documentos aguardando revisão/assinatura, horas não lançadas.
- **Indicadores:** prazos em risco, horas lançadas hoje/semana, tarefas atrasadas.
- **Dores:** medo de perder prazo; retrabalho de navegar 6 telas para registrar 1 fato; esquecer de lançar horas.
- **IA futura:** resumo do processo antes da audiência, rascunho de petição por modelo, sugestão de resposta ao cliente.

## 3. Controladoria Jurídica (ASSISTANT com foco processual)
- **Objetivos:** nenhuma publicação sem tratamento; nenhum prazo sem responsável.
- **Atividades:** triagem de publicações/andamentos, cadastro de prazos com responsável, conferência de protocolos, distribuição de tarefas, controle de qualidade.
- **Frequência:** o dia inteiro, alto volume, trabalho em fila.
- **Informações:** fila de andamentos novos, prazos sem responsável, prazos vencendo em 48h, protocolos pendentes, audiências a confirmar.
- **Indicadores:** itens na fila, prazos fatais da semana, % prazos baixados no dia.
- **Dores:** volume; risco de item passar despercebido; falta de visão "o que falta tratar HOJE".
- **IA futura:** classificação automática de publicação → sugestão de prazo (tipo + dias).

## 4. Financeiro (FINANCE)
- **Objetivos:** caixa saudável; cobrar sem atrito; zero honorário esquecido.
- **Atividades:** baixar pagamentos, emitir cobranças/NFS-e, conciliar, cobrar inadimplentes, acompanhar contratos vencendo e parcelas.
- **Frequência:** diária.
- **Informações:** recebimentos do dia, cobranças vencidas (com cliente/contato), parcelas da semana, contratos a renovar, horas faturáveis não cobradas.
- **Indicadores:** a receber aberto/vencido, a pagar da semana, fluxo de caixa do mês, inadimplência %.
- **Dores:** honorário de êxito não cobrado; contrato vencido sem renovação; cobrança manual sem histórico.
- **IA futura:** previsão de caixa; priorização de cobrança por probabilidade de pagamento.

## 5. Secretaria (ASSISTANT com foco administrativo)
- **Objetivos:** agenda redonda; cliente bem atendido; documentação organizada.
- **Atividades:** agendar/confirmar audiências e reuniões, receber e arquivar documentos, ativar portal do cliente, triagem de mensagens.
- **Informações:** agenda do dia (todos os advogados), confirmações pendentes, documentos recebidos sem classificação, mensagens do portal sem resposta.
- **Dores:** confirmações por telefone sem registro; documento "perdido" no e-mail.
- **IA futura:** classificação de documento no upload; resposta padrão a solicitações comuns.

## 6. Estagiário (ASSISTANT restrito)
- **Objetivos:** executar tarefas delegadas com supervisão.
- **Atividades:** pesquisas, minutas simples, diligências, atualização de andamentos.
- **Informações:** MINHAS tarefas (só o que foi delegado), prazos das tarefas, materiais do processo.
- **Dores:** não saber prioridade; acesso a mais do que deveria (risco) — RBAC deve limitar.
- **IA futura:** sumarização de autos para pesquisa.

## 7. Cliente (CLIENT — portal)
- **Objetivos:** saber "como está meu caso" sem ligar para o escritório; pagar fácil.
- **Atividades:** ver movimentações, baixar/enviar documentos, mensagens, 2ª via de cobrança.
- **Frequência:** eventual (picos após audiência/cobrança).
- **Informações:** meus processos + última movimentação em linguagem simples, próximas audiências, o que devo, contratos, mensagens.
- **Dores:** ansiedade por falta de notícia; juridiquês.
- **IA futura:** resumo da movimentação em linguagem leiga; resposta assistida do escritório.

---

## Consequências de design (decisões)

1. **`/app` deixa de ser dashboard e vira "Meu Workspace"** — composição de blocos por papel:
   - LAWYER/ASSISTANT: Central de Trabalho (Hoje) em primeiro.
   - FINANCE: bloco financeiro (vencidas, recebimentos do dia, semana) em primeiro; sem fila jurídica (RBAC nega processos).
   - OWNER/ADMIN: indicadores executivos no topo + Central de Trabalho abaixo.
2. **Central de Trabalho = fila acionável, não relatório**: cada item tem ação inline (concluir prazo, confirmar audiência, concluir tarefa, registrar pagamento) sem trocar de tela; baixas relevantes geram andamento na timeline do processo.
3. **Command Palette (Ctrl/Cmd+K)** com busca real (processos/clientes/documentos/tarefas) + comandos de criação que abrem o pop-up correspondente (`?novo=1`).
4. **Pontos de IA preparados** (sem implementação): resumo de processo (cockpit), resumo de dia (workspace), sugestão de resposta (mensagens), classificação de documento (upload). Marcados no código com `// IA-ready:`.
