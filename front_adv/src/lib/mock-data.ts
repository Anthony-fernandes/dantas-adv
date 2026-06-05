import {
  User, Process, Client, FinanceEntry, Invoice, Movement,
  Deadline, Hearing, AuditLog, Team, KnowledgeItem,
  Integration, SyncRun, PortalMessage, Contract, DocumentFile
} from '@/types/models';

const tenant = { id: 't1', name: 'Advocacia Silva & Associados' };

export const mockCurrentUser: User = {
  id: 'u1', name: 'Dr. Carlos Silva', email: 'carlos@silva.adv.br',
  avatar: '', role: 'SOCIO', status: 'active',
  permissions: [
    'process.view','process.create','process.update','process.delete',
    'finance.view','finance.create','finance.issue','finance.invoice',
    'client.view','client.create','client.update','client.delete',
    'admin.manage_users','admin.audit','admin.settings',
    'knowledge.view','knowledge.create',
  ],
  tenant, created_at: '2024-01-01', updated_at: '2024-12-01',
};

export const mockUsers: User[] = [
  mockCurrentUser,
  { id: 'u2', name: 'Dra. Ana Oliveira', email: 'ana@silva.adv.br', role: 'ADVOGADO', status: 'active', permissions: ['process.view','process.create','process.update','client.view','client.create','client.update','finance.view','knowledge.view','knowledge.create'], tenant, created_at: '2024-02-01', updated_at: '2024-12-01' },
  { id: 'u3', name: 'Lucas Santos', email: 'lucas@silva.adv.br', role: 'ESTAGIARIO', status: 'active', permissions: ['process.view','client.view','knowledge.view'], tenant, created_at: '2024-06-01', updated_at: '2024-12-01' },
  { id: 'u4', name: 'Maria Financeiro', email: 'maria@silva.adv.br', role: 'FINANCEIRO', status: 'active', permissions: ['process.view','finance.view','finance.create','finance.issue','finance.invoice','client.view'], tenant, created_at: '2024-03-01', updated_at: '2024-12-01' },
];

export const mockClients: Client[] = [
  { id: 'c1', type: 'PJ', name: 'Tech Solutions Ltda', doc: '12.345.678/0001-90', contacts: [{ type: 'email', value: 'contato@techsolutions.com' }, { type: 'phone', value: '(11) 99999-0001' }], tags: ['tech', 'cível'], status: 'ATIVO', responsavel: 'Dr. Carlos Silva', processos_ativos: 3, inadimplencia: 0, created_at: '2024-01-15', updated_at: '2024-12-01', tenant_id: 't1' },
  { id: 'c2', type: 'PF', name: 'João Pereira', doc: '123.456.789-00', contacts: [{ type: 'email', value: 'joao@email.com' }, { type: 'whatsapp', value: '(11) 98888-0002' }], tags: ['trabalhista'], status: 'ATIVO', responsavel: 'Dra. Ana Oliveira', processos_ativos: 1, inadimplencia: 2500, created_at: '2024-03-10', updated_at: '2024-11-20', tenant_id: 't1' },
  { id: 'c3', type: 'PJ', name: 'Comércio ABC S.A.', doc: '98.765.432/0001-10', contacts: [{ type: 'email', value: 'juridico@abc.com' }], tags: ['tributário', 'empresarial'], status: 'ATIVO', responsavel: 'Dr. Carlos Silva', processos_ativos: 2, inadimplencia: 0, created_at: '2024-05-01', updated_at: '2024-12-01', tenant_id: 't1' },
  { id: 'c4', type: 'PF', name: 'Maria da Costa', doc: '987.654.321-00', contacts: [{ type: 'phone', value: '(21) 97777-0003' }], tags: ['família'], status: 'PROSPECTO', responsavel: 'Dra. Ana Oliveira', processos_ativos: 0, inadimplencia: 0, created_at: '2024-11-01', updated_at: '2024-12-01', tenant_id: 't1' },
];

export const mockProcesses: Process[] = [
  { id: 'p1', cnj: '0001234-56.2024.8.26.0100', tribunal: 'TJSP', vara: '1ª Vara Cível', classe: 'Ação de Cobrança', polo_ativo: 'Tech Solutions Ltda', polo_passivo: 'Empresa XYZ', area: 'CIVEL', fase: 'CONHECIMENTO', valor_causa: 150000, prob_exito: 'ALTA', status: 'ATIVO', responsaveis: [mockUsers[0], mockUsers[1]], cliente_id: 'c1', cliente_nome: 'Tech Solutions Ltda', created_at: '2024-02-15', updated_at: '2024-12-01', tenant_id: 't1' },
  { id: 'p2', cnj: '0005678-90.2024.5.02.0001', tribunal: 'TRT-2', vara: '3ª Vara do Trabalho', classe: 'Reclamação Trabalhista', polo_ativo: 'João Pereira', polo_passivo: 'Empresa ABC', area: 'TRABALHISTA', fase: 'RECURSAL', valor_causa: 85000, prob_exito: 'MEDIA', status: 'ATIVO', responsaveis: [mockUsers[1]], cliente_id: 'c2', cliente_nome: 'João Pereira', created_at: '2024-04-20', updated_at: '2024-11-15', tenant_id: 't1' },
  { id: 'p3', cnj: '0009012-34.2024.8.19.0001', tribunal: 'TJRJ', vara: '2ª Vara Empresarial', classe: 'Ação Anulatória', polo_ativo: 'Comércio ABC S.A.', polo_passivo: 'Fisco Estadual', area: 'TRIBUTARIO', fase: 'EXECUCAO', valor_causa: 320000, prob_exito: 'BAIXA', status: 'ATIVO', responsaveis: [mockUsers[0]], cliente_id: 'c3', cliente_nome: 'Comércio ABC S.A.', created_at: '2024-01-10', updated_at: '2024-12-01', tenant_id: 't1' },
  { id: 'p4', cnj: '0003456-78.2023.8.26.0100', tribunal: 'TJSP', vara: '5ª Vara Cível', classe: 'Indenização', polo_ativo: 'Tech Solutions Ltda', polo_passivo: 'Fornecedor Y', area: 'CIVEL', fase: 'CUMPRIMENTO', valor_causa: 45000, prob_exito: 'ALTA', status: 'ENCERRADO', responsaveis: [mockUsers[1]], cliente_id: 'c1', cliente_nome: 'Tech Solutions Ltda', created_at: '2023-08-01', updated_at: '2024-10-30', tenant_id: 't1' },
  { id: 'p5', cnj: '0007890-12.2024.8.26.0100', tribunal: 'TJSP', vara: '10ª Vara Criminal', classe: 'Ação Penal', polo_ativo: 'Ministério Público', polo_passivo: 'Réu Anônimo', area: 'CRIMINAL', fase: 'CONHECIMENTO', valor_causa: 0, prob_exito: 'MEDIA', status: 'ATIVO', responsaveis: [mockUsers[0], mockUsers[2]], cliente_id: 'c3', cliente_nome: 'Comércio ABC S.A.', created_at: '2024-09-01', updated_at: '2024-12-01', tenant_id: 't1' },
];

export const mockMovements: Movement[] = [
  { id: 'm1', process_id: 'p1', date: '2024-12-01', type: 'DESPACHO', description: 'Despacho determinando intimação do réu para contestação em 15 dias.', attachments: [], created_at: '2024-12-01' },
  { id: 'm2', process_id: 'p1', date: '2024-11-28', type: 'PETICAO', description: 'Petição inicial protocolada com todos os documentos comprobatórios.', attachments: [], created_at: '2024-11-28' },
  { id: 'm3', process_id: 'p1', date: '2024-11-20', type: 'PUBLICACAO', description: 'Publicação no DJE sobre distribuição do processo.', attachments: [], created_at: '2024-11-20' },
  { id: 'm4', process_id: 'p2', date: '2024-11-15', type: 'DECISAO', description: 'Decisão deferindo tutela de urgência para manutenção do plano de saúde.', attachments: [], created_at: '2024-11-15' },
  { id: 'm5', process_id: 'p2', date: '2024-11-10', type: 'AUDIENCIA', description: 'Audiência de conciliação realizada, sem acordo entre as partes.', attachments: [], created_at: '2024-11-10' },
];

export const mockDeadlines: Deadline[] = [
  { id: 'd1', process_id: 'p1', date: '2024-12-15', description: 'Prazo para contestação', priority: 'ALTA', status: 'PENDENTE', alert_channels: ['email', 'push'], created_at: '2024-12-01' },
  { id: 'd2', process_id: 'p2', date: '2024-12-10', description: 'Prazo para recurso ordinário', priority: 'URGENTE', status: 'PENDENTE', alert_channels: ['email', 'whatsapp'], created_at: '2024-11-15' },
  { id: 'd3', process_id: 'p3', date: '2024-12-20', description: 'Prazo para pagamento de custas', priority: 'MEDIA', status: 'PENDENTE', alert_channels: ['email'], created_at: '2024-12-01' },
  { id: 'd4', process_id: 'p1', date: '2024-11-25', description: 'Juntada de documentos', priority: 'BAIXA', status: 'CONCLUIDO', alert_channels: ['email'], created_at: '2024-11-10' },
  { id: 'd5', process_id: 'p5', date: '2024-12-05', description: 'Alegações finais', priority: 'ALTA', status: 'ATRASADO', alert_channels: ['email', 'push', 'whatsapp'], created_at: '2024-11-20' },
];

export const mockHearings: Hearing[] = [
  { id: 'h1', process_id: 'p1', date: '2024-12-18T14:00:00', location: 'Fórum Central - Sala 302', modality: 'PRESENCIAL', responsible: 'Dr. Carlos Silva', status: 'AGENDADA', created_at: '2024-12-01' },
  { id: 'h2', process_id: 'p2', date: '2024-12-12T10:00:00', location: 'TRT - Sala Virtual', modality: 'ONLINE', responsible: 'Dra. Ana Oliveira', status: 'AGENDADA', created_at: '2024-11-15' },
  { id: 'h3', process_id: 'p5', date: '2025-01-15T09:30:00', location: 'Fórum Criminal - Sala 105', modality: 'PRESENCIAL', responsible: 'Dr. Carlos Silva', status: 'AGENDADA', created_at: '2024-12-01' },
];

export const mockFinanceEntries: FinanceEntry[] = [
  { id: 'f1', type: 'RECEITA', description: 'Honorários - Tech Solutions (parcela 1/3)', amount: 15000, due_date: '2024-12-05', paid_date: '2024-12-04', status: 'PAGO', cost_center: 'Cível', category: 'Honorários', process_id: 'p1', client_id: 'c1', created_at: '2024-11-01', tenant_id: 't1' },
  { id: 'f2', type: 'RECEITA', description: 'Honorários - João Pereira', amount: 8500, due_date: '2024-12-10', status: 'PENDENTE', cost_center: 'Trabalhista', category: 'Honorários', process_id: 'p2', client_id: 'c2', created_at: '2024-11-15', tenant_id: 't1' },
  { id: 'f3', type: 'DESPESA', description: 'Custas processuais - TJSP', amount: 2350, due_date: '2024-12-08', status: 'PENDENTE', cost_center: 'Cível', category: 'Custas', process_id: 'p1', created_at: '2024-12-01', tenant_id: 't1' },
  { id: 'f4', type: 'RECEITA', description: 'Mensalidade assessoria - Comércio ABC', amount: 12000, due_date: '2024-11-30', status: 'ATRASADO', cost_center: 'Tributário', category: 'Mensalidade', client_id: 'c3', created_at: '2024-11-01', tenant_id: 't1' },
  { id: 'f5', type: 'DESPESA', description: 'Aluguel escritório', amount: 8000, due_date: '2024-12-01', paid_date: '2024-12-01', status: 'PAGO', cost_center: 'Administrativo', category: 'Infraestrutura', created_at: '2024-11-25', tenant_id: 't1' },
  { id: 'f6', type: 'RECEITA', description: 'Êxito - Processo indenização', amount: 22500, due_date: '2024-11-15', paid_date: '2024-11-18', status: 'PAGO', cost_center: 'Cível', category: 'Êxito', process_id: 'p4', client_id: 'c1', created_at: '2024-10-30', tenant_id: 't1' },
];

export const mockInvoices: Invoice[] = [
  { id: 'inv1', type: 'NF', client_id: 'c1', client_name: 'Tech Solutions Ltda', amount: 15000, due_date: '2024-12-05', status: 'PAGO', items: [{ description: 'Honorários advocatícios - parcela 1/3', amount: 15000 }], created_at: '2024-11-01', tenant_id: 't1' },
  { id: 'inv2', type: 'BOLETO', client_id: 'c2', client_name: 'João Pereira', amount: 8500, due_date: '2024-12-10', status: 'EMITIDO', items: [{ description: 'Honorários - Reclamação trabalhista', amount: 8500 }], created_at: '2024-11-15', tenant_id: 't1' },
  { id: 'inv3', type: 'NF', client_id: 'c3', client_name: 'Comércio ABC S.A.', amount: 12000, due_date: '2024-11-30', status: 'VENCIDO', items: [{ description: 'Mensalidade assessoria jurídica', amount: 12000 }], created_at: '2024-11-01', tenant_id: 't1' },
];

export const mockAuditLogs: AuditLog[] = [
  { id: 'al1', user_id: 'u1', user_name: 'Dr. Carlos Silva', action: 'CREATE', module: 'Processos', details: 'Criou processo 0001234-56.2024.8.26.0100', created_at: '2024-12-01T10:30:00' },
  { id: 'al2', user_id: 'u2', user_name: 'Dra. Ana Oliveira', action: 'UPDATE', module: 'Processos', details: 'Atualizou movimentação do processo p2', created_at: '2024-12-01T09:15:00' },
  { id: 'al3', user_id: 'u4', user_name: 'Maria Financeiro', action: 'CREATE', module: 'Financeiro', details: 'Emitiu NF inv1 para Tech Solutions', created_at: '2024-11-30T16:45:00' },
  { id: 'al4', user_id: 'u1', user_name: 'Dr. Carlos Silva', action: 'UPDATE', module: 'Admin', details: 'Atualizou permissões do usuário Lucas Santos', created_at: '2024-11-29T14:00:00' },
];

export const mockTeams: Team[] = [
  { id: 'tm1', name: 'Equipe Cível', area: 'CIVEL', members: [mockUsers[0], mockUsers[1]], goals: [{ label: 'Processos encerrados/mês', target: 5, current: 3 }, { label: 'Novos clientes', target: 3, current: 2 }] },
  { id: 'tm2', name: 'Equipe Trabalhista', area: 'TRABALHISTA', members: [mockUsers[1], mockUsers[2]], goals: [{ label: 'Audiências realizadas', target: 8, current: 6 }] },
];

export const mockKnowledge: KnowledgeItem[] = [
  { id: 'k1', type: 'TESE', title: 'Responsabilidade civil por danos morais em relações de consumo', content: 'Tese fundamentada no CDC...', tags: ['cível', 'consumidor', 'danos morais'], attachments: [], created_at: '2024-06-01', updated_at: '2024-11-01' },
  { id: 'k2', type: 'JURISPRUDENCIA', title: 'STJ - REsp sobre prescrição intercorrente', content: 'Ementa...', tags: ['cível', 'prescrição', 'STJ'], attachments: [], created_at: '2024-09-15', updated_at: '2024-09-15' },
  { id: 'k3', type: 'MODELO', title: 'Petição Inicial - Ação de Cobrança', content: 'Modelo padrão...', tags: ['cível', 'cobrança', 'modelo'], attachments: [], created_at: '2024-03-01', updated_at: '2024-10-01' },
];

export const mockIntegrations: Integration[] = [
  { id: 'int1', name: 'PJe - Processo Judicial Eletrônico', type: 'TRIBUNAL', status: 'CONECTADO', last_sync: '2024-12-01T08:00:00', config: {} },
  { id: 'int2', name: 'e-SAJ - TJSP', type: 'TRIBUNAL', status: 'CONECTADO', last_sync: '2024-12-01T07:30:00', config: {} },
  { id: 'int3', name: 'Diário Oficial da União', type: 'DIARIO', status: 'CONECTADO', last_sync: '2024-12-01T06:00:00', config: {} },
  { id: 'int4', name: 'Assinatura Digital (ICP-Brasil)', type: 'ASSINATURA', status: 'DESCONECTADO', config: {} },
  { id: 'int5', name: 'Sistema Contábil', type: 'CONTABIL', status: 'ERRO', last_sync: '2024-11-28T12:00:00', config: {} },
];

export const mockSyncRuns: SyncRun[] = [
  { id: 'sr1', integration_id: 'int1', started_at: '2024-12-01T08:00:00', finished_at: '2024-12-01T08:05:00', status: 'SUCCESS', records_synced: 12 },
  { id: 'sr2', integration_id: 'int2', started_at: '2024-12-01T07:30:00', finished_at: '2024-12-01T07:35:00', status: 'SUCCESS', records_synced: 8 },
  { id: 'sr3', integration_id: 'int5', started_at: '2024-11-28T12:00:00', finished_at: '2024-11-28T12:02:00', status: 'ERROR', records_synced: 0, error_message: 'Timeout na conexão com o servidor contábil' },
];

export const mockPortalMessages: PortalMessage[] = [
  { id: 'pm1', sender: 'OFFICE', sender_name: 'Dra. Ana Oliveira', content: 'Boa tarde! Informo que a audiência foi agendada para 18/12.', attachments: [], read: true, created_at: '2024-12-01T14:30:00' },
  { id: 'pm2', sender: 'CLIENT', sender_name: 'Tech Solutions Ltda', content: 'Obrigado! Estarei presente. Preciso levar algum documento?', attachments: [], read: true, created_at: '2024-12-01T15:00:00' },
  { id: 'pm3', sender: 'OFFICE', sender_name: 'Dra. Ana Oliveira', content: 'Sim, por favor traga o contrato original e os últimos 3 extratos bancários.', attachments: [], read: false, created_at: '2024-12-01T15:15:00' },
];

export const mockContracts: Contract[] = [
  { id: 'ct1', client_id: 'c1', type: 'FIXO', valor_fixo: 15000, start: '2024-01-01', end: '2024-12-31', clauses: ['Acompanhamento processual', 'Consultoria mensal'], attachments: [], status: 'VIGENTE', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'ct2', client_id: 'c2', type: 'EXITO', percent: 20, start: '2024-04-01', clauses: ['20% sobre valor de êxito'], attachments: [], status: 'VIGENTE', created_at: '2024-04-01', updated_at: '2024-04-01' },
  { id: 'ct3', client_id: 'c3', type: 'MENSALIDADE', valor_fixo: 12000, start: '2024-05-01', clauses: ['Assessoria tributária mensal', 'Consultoria empresarial'], attachments: [], status: 'VIGENTE', created_at: '2024-05-01', updated_at: '2024-05-01' },
];

// Dashboard KPIs
export const mockDashboardKPIs = {
  processos_ativos: 4,
  processos_risco: 1,
  prazos_proximos: 3,
  audiencias_semana: 2,
  inadimplencia: 12000,
  faturamento_mes: 57500,
};

export const mockProcessesByArea = [
  { area: 'Cível', count: 2 },
  { area: 'Trabalhista', count: 1 },
  { area: 'Tributário', count: 1 },
  { area: 'Criminal', count: 1 },
];

export const mockRevenueByAdvogado = [
  { name: 'Dr. Carlos Silva', value: 37500 },
  { name: 'Dra. Ana Oliveira', value: 20000 },
];

export const mockMonthlyEvolution = [
  { month: 'Jul', entradas: 3, encerramentos: 1 },
  { month: 'Ago', entradas: 2, encerramentos: 0 },
  { month: 'Set', entradas: 4, encerramentos: 2 },
  { month: 'Out', entradas: 1, encerramentos: 1 },
  { month: 'Nov', entradas: 2, encerramentos: 1 },
  { month: 'Dez', entradas: 1, encerramentos: 0 },
];
