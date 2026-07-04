// Mock data used across the redesigned Phase 1 screens.
// Realistic Brazilian legal domain sample data.

export const clientes = [
  { id: "c-001", nome: "Construtora Aurora S.A.", tipo: "PJ", documento: "12.345.678/0001-90", cidade: "São Paulo/SP", processos: 24, status: "Ativo", responsavel: "Dra. Marina Souza" },
  { id: "c-002", nome: "Instituto Meridiano", tipo: "PJ", documento: "98.765.432/0001-12", cidade: "Rio de Janeiro/RJ", processos: 11, status: "Ativo", responsavel: "Dr. Ricardo Lima" },
  { id: "c-003", nome: "Ana Beatriz Oliveira", tipo: "PF", documento: "123.456.789-00", cidade: "Belo Horizonte/MG", processos: 3, status: "Ativo", responsavel: "Dra. Marina Souza" },
  { id: "c-004", nome: "Grupo Vértice Logística", tipo: "PJ", documento: "45.678.912/0001-34", cidade: "Curitiba/PR", processos: 18, status: "Prospect", responsavel: "Dr. André Palma" },
  { id: "c-005", nome: "Marcelo Freitas Filho", tipo: "PF", documento: "987.654.321-00", cidade: "Porto Alegre/RS", processos: 2, status: "Ativo", responsavel: "Dra. Luísa Prado" },
  { id: "c-006", nome: "Petro Sul Refinaria Ltda.", tipo: "PJ", documento: "22.334.455/0001-66", cidade: "Salvador/BA", processos: 41, status: "Ativo", responsavel: "Dr. Ricardo Lima" },
  { id: "c-007", nome: "Fundação Casa Nova", tipo: "PJ", documento: "33.445.566/0001-77", cidade: "Brasília/DF", processos: 6, status: "Inativo", responsavel: "Dra. Marina Souza" },
];

export const processos = [
  { id: "p-1001", numero: "1023456-78.2024.8.26.0100", cliente: "Construtora Aurora S.A.", area: "Cível", vara: "3ª Vara Cível — SP", fase: "Instrução", valor: 1250000, status: "Em andamento", responsavel: "Dra. Marina Souza", ultimoAndamento: "há 2 dias" },
  { id: "p-1002", numero: "0009887-11.2023.5.02.0044", cliente: "Petro Sul Refinaria Ltda.", area: "Trabalhista", vara: "44ª VT — SP", fase: "Sentença", valor: 380000, status: "Aguardando", responsavel: "Dr. Ricardo Lima", ultimoAndamento: "há 5 h" },
  { id: "p-1003", numero: "5566778-33.2024.4.03.6100", cliente: "Instituto Meridiano", area: "Tributário", vara: "10ª Vara Federal — SP", fase: "Recurso", valor: 890000, status: "Em andamento", responsavel: "Dr. André Palma", ultimoAndamento: "há 1 dia" },
  { id: "p-1004", numero: "0000234-56.2025.8.19.0001", cliente: "Ana Beatriz Oliveira", area: "Família", vara: "2ª V. Família — RJ", fase: "Petição inicial", valor: 45000, status: "Novo", responsavel: "Dra. Luísa Prado", ultimoAndamento: "hoje" },
  { id: "p-1005", numero: "7788990-22.2023.8.13.0024", cliente: "Grupo Vértice Logística", area: "Empresarial", vara: "5ª Vara Empresarial — BH", fase: "Recurso", valor: 2100000, status: "Suspenso", responsavel: "Dr. Ricardo Lima", ultimoAndamento: "há 12 dias" },
  { id: "p-1006", numero: "1122334-55.2024.8.26.0053", cliente: "Marcelo Freitas Filho", area: "Cível", vara: "12ª Vara Cível — SP", fase: "Contestação", valor: 120000, status: "Em andamento", responsavel: "Dra. Marina Souza", ultimoAndamento: "há 3 dias" },
  { id: "p-1007", numero: "3344556-77.2024.8.05.0001", cliente: "Petro Sul Refinaria Ltda.", area: "Ambiental", vara: "V. Faz. Pública — BA", fase: "Instrução", valor: 5400000, status: "Em andamento", responsavel: "Dr. André Palma", ultimoAndamento: "há 6 h" },
];

export const prazos = [
  { id: "d-01", titulo: "Contestação — Ação de cobrança", processo: "1023456-78.2024.8.26.0100", cliente: "Construtora Aurora", vencimento: "2026-07-08", dias: 5, tipo: "Fatal", responsavel: "Dra. Marina Souza", status: "Em aberto" },
  { id: "d-02", titulo: "Recurso Ordinário", processo: "0009887-11.2023.5.02.0044", cliente: "Petro Sul", vencimento: "2026-07-04", dias: 1, tipo: "Fatal", responsavel: "Dr. Ricardo Lima", status: "Urgente" },
  { id: "d-03", titulo: "Manifestação sobre laudo pericial", processo: "5566778-33.2024.4.03.6100", cliente: "Instituto Meridiano", vencimento: "2026-07-15", dias: 12, tipo: "Ordinário", responsavel: "Dr. André Palma", status: "Em aberto" },
  { id: "d-04", titulo: "Réplica à contestação", processo: "1122334-55.2024.8.26.0053", cliente: "Marcelo Freitas", vencimento: "2026-07-11", dias: 8, tipo: "Ordinário", responsavel: "Dra. Marina Souza", status: "Em aberto" },
  { id: "d-05", titulo: "Alegações finais", processo: "3344556-77.2024.8.05.0001", cliente: "Petro Sul", vencimento: "2026-07-22", dias: 19, tipo: "Fatal", responsavel: "Dr. André Palma", status: "Em aberto" },
  { id: "d-06", titulo: "Contrarrazões de apelação", processo: "7788990-22.2023.8.13.0024", cliente: "Grupo Vértice", vencimento: "2026-07-02", dias: -1, tipo: "Fatal", responsavel: "Dr. Ricardo Lima", status: "Atrasado" },
];

export const audiencias = [
  { id: "h-01", data: "2026-07-07", hora: "09:00", tipo: "Instrução", processo: "1023456-78.2024.8.26.0100", forum: "Fórum João Mendes — SP", cidade: "São Paulo/SP", responsavel: "Dra. Marina Souza", modalidade: "Presencial" },
  { id: "h-02", data: "2026-07-09", hora: "14:30", tipo: "Conciliação", processo: "0000234-56.2025.8.19.0001", forum: "CEJUSC Central — RJ", cidade: "Rio de Janeiro/RJ", responsavel: "Dra. Luísa Prado", modalidade: "Virtual" },
  { id: "h-03", data: "2026-07-10", hora: "10:00", tipo: "Una", processo: "0009887-11.2023.5.02.0044", forum: "44ª VT — SP", cidade: "São Paulo/SP", responsavel: "Dr. Ricardo Lima", modalidade: "Presencial" },
  { id: "h-04", data: "2026-07-14", hora: "15:00", tipo: "Instrução", processo: "3344556-77.2024.8.05.0001", forum: "V. Faz. Pública — BA", cidade: "Salvador/BA", responsavel: "Dr. André Palma", modalidade: "Virtual" },
];

export const tarefas = [
  { id: "t-01", titulo: "Revisar minuta de acordo — Aurora", processo: "1023456-78.2024.8.26.0100", prioridade: "Alta", vencimento: "2026-07-04", responsavel: "Dra. Marina Souza", status: "Em andamento" },
  { id: "t-02", titulo: "Coletar documentos do cliente", processo: "0000234-56.2025.8.19.0001", prioridade: "Média", vencimento: "2026-07-06", responsavel: "Dra. Luísa Prado", status: "A fazer" },
  { id: "t-03", titulo: "Elaborar parecer tributário", processo: "5566778-33.2024.4.03.6100", prioridade: "Alta", vencimento: "2026-07-08", responsavel: "Dr. André Palma", status: "A fazer" },
  { id: "t-04", titulo: "Ligar para perito judicial", processo: "3344556-77.2024.8.05.0001", prioridade: "Baixa", vencimento: "2026-07-05", responsavel: "Estagiário Pedro", status: "Em andamento" },
  { id: "t-05", titulo: "Protocolar petição intermediária", processo: "0009887-11.2023.5.02.0044", prioridade: "Alta", vencimento: "2026-07-03", responsavel: "Dr. Ricardo Lima", status: "Concluída" },
  { id: "t-06", titulo: "Reunião com cliente Grupo Vértice", processo: "7788990-22.2023.8.13.0024", prioridade: "Média", vencimento: "2026-07-09", responsavel: "Dr. Ricardo Lima", status: "A fazer" },
];

export const financeiro = [
  { id: "f-01", tipo: "Receber", descricao: "Honorário contratual — Aurora", cliente: "Construtora Aurora", vencimento: "2026-07-10", valor: 45000, status: "Em aberto" },
  { id: "f-02", tipo: "Receber", descricao: "Êxito — Ação trabalhista", cliente: "Petro Sul", vencimento: "2026-07-15", valor: 120000, status: "Em aberto" },
  { id: "f-03", tipo: "Pagar", descricao: "Aluguel escritório — Julho", cliente: "Imobiliária Central", vencimento: "2026-07-05", valor: 18500, status: "Em aberto" },
  { id: "f-04", tipo: "Receber", descricao: "Consultoria mensal", cliente: "Instituto Meridiano", vencimento: "2026-06-30", valor: 22000, status: "Pago" },
  { id: "f-05", tipo: "Pagar", descricao: "Custas processuais", cliente: "Cartório 3º Ofício", vencimento: "2026-07-08", valor: 3200, status: "Em aberto" },
  { id: "f-06", tipo: "Receber", descricao: "Sucumbência", cliente: "Grupo Vértice", vencimento: "2026-06-28", valor: 68000, status: "Atrasado" },
];

export const contratos = [
  { id: "co-01", numero: "CT-2026-014", cliente: "Construtora Aurora S.A.", objeto: "Consultoria jurídica mensal", inicio: "2026-01-01", fim: "2026-12-31", valor: 45000, status: "Ativo" },
  { id: "co-02", numero: "CT-2026-021", cliente: "Petro Sul Refinaria", objeto: "Contencioso trabalhista", inicio: "2026-02-15", fim: "2027-02-14", valor: 380000, status: "Ativo" },
  { id: "co-03", numero: "CT-2025-088", cliente: "Instituto Meridiano", objeto: "Assessoria tributária", inicio: "2025-09-01", fim: "2026-08-31", valor: 264000, status: "Ativo" },
  { id: "co-04", numero: "CT-2026-002", cliente: "Grupo Vértice Logística", objeto: "Recuperação judicial", inicio: "2026-01-10", fim: "2026-07-10", valor: 850000, status: "Encerrando" },
];

export const stats = {
  processosAtivos: 342,
  clientesAtivos: 87,
  prazosSemana: 14,
  audienciasSemana: 6,
  receitaMes: 428750,
  aReceber: 685200,
  aPagar: 92400,
  taxaExito: 78,
};

export function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
}
export function fmtBRLPreciso(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
export function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
// ---- Phase-2 extended mock data ----

export const documentos = [
  { id: "doc-01", nome: "Petição inicial — Aurora.pdf", tipo: "Petição", processo: "1023456-78.2024.8.26.0100", cliente: "Construtora Aurora S.A.", tamanho: "1.4 MB", autor: "Dra. Marina Souza", data: "2026-06-01" },
  { id: "doc-02", nome: "Procuração — Instituto Meridiano.pdf", tipo: "Procuração", processo: "5566778-33.2024.4.03.6100", cliente: "Instituto Meridiano", tamanho: "820 KB", autor: "Dr. André Palma", data: "2026-05-22" },
  { id: "doc-03", nome: "Laudo pericial.pdf", tipo: "Laudo", processo: "1023456-78.2024.8.26.0100", cliente: "Construtora Aurora S.A.", tamanho: "3.2 MB", autor: "Eng. Roberto Andrade", data: "2026-06-28" },
  { id: "doc-04", nome: "Réplica — Marcelo.pdf", tipo: "Petição", processo: "1122334-55.2024.8.26.0053", cliente: "Marcelo Freitas Filho", tamanho: "540 KB", autor: "Dra. Marina Souza", data: "2026-06-20" },
];

export const modelos = [
  { id: "mod-01", nome: "Procuração ad judicia", area: "Cível", uso: 128, atualizado: "2026-05-10", autor: "Dra. Marina Souza" },
  { id: "mod-02", nome: "Contestação padrão trabalhista", area: "Trabalhista", uso: 76, atualizado: "2026-04-02", autor: "Dr. Ricardo Lima" },
  { id: "mod-03", nome: "Petição inicial — Cobrança", area: "Cível", uso: 54, atualizado: "2026-06-15", autor: "Dra. Luísa Prado" },
  { id: "mod-04", nome: "Recurso ordinário", area: "Trabalhista", uso: 41, atualizado: "2026-03-28", autor: "Dr. Ricardo Lima" },
];

export const honorarios = [
  { id: "hon-01", cliente: "Construtora Aurora S.A.", tipo: "Contratual", valor: 45000, vencimento: "2026-07-10", status: "Em aberto" },
  { id: "hon-02", cliente: "Petro Sul Refinaria", tipo: "Êxito", valor: 120000, vencimento: "2026-07-15", status: "Em aberto" },
  { id: "hon-03", cliente: "Instituto Meridiano", tipo: "Consultoria", valor: 22000, vencimento: "2026-06-30", status: "Pago" },
  { id: "hon-04", cliente: "Grupo Vértice Logística", tipo: "Sucumbência", valor: 68000, vencimento: "2026-06-28", status: "Atrasado" },
];

export const horas = [
  { id: "hr-01", data: "2026-07-01", advogado: "Dra. Marina Souza", cliente: "Construtora Aurora", atividade: "Reunião de alinhamento", horas: 2.5, valor: 750 },
  { id: "hr-02", data: "2026-07-02", advogado: "Dr. Ricardo Lima", cliente: "Petro Sul", atividade: "Audiência trabalhista", horas: 4.0, valor: 1200 },
  { id: "hr-03", data: "2026-07-02", advogado: "Dr. André Palma", cliente: "Instituto Meridiano", atividade: "Elaboração de parecer", horas: 3.0, valor: 900 },
  { id: "hr-04", data: "2026-07-03", advogado: "Dra. Luísa Prado", cliente: "Ana Beatriz Oliveira", atividade: "Atendimento inicial", horas: 1.5, valor: 450 },
];

export const nfse = [
  { id: "nf-01", numero: "2026/000431", cliente: "Construtora Aurora S.A.", emissao: "2026-07-01", valor: 45000, status: "Emitida" },
  { id: "nf-02", numero: "2026/000432", cliente: "Instituto Meridiano", emissao: "2026-06-30", valor: 22000, status: "Emitida" },
  { id: "nf-03", numero: "2026/000433", cliente: "Petro Sul Refinaria", emissao: "2026-07-02", valor: 120000, status: "Pendente" },
];

export const funcionarios = [
  { id: "fn-01", nome: "Marina Souza", cargo: "Sócia — Advogada", email: "marina@jurisflow.com.br", oab: "OAB/SP 123.456", ingresso: "2018-03-15" },
  { id: "fn-02", nome: "Ricardo Lima", cargo: "Advogado sênior", email: "ricardo@jurisflow.com.br", oab: "OAB/SP 234.567", ingresso: "2020-08-01" },
  { id: "fn-03", nome: "André Palma", cargo: "Advogado pleno", email: "andre@jurisflow.com.br", oab: "OAB/SP 298.112", ingresso: "2022-01-10" },
  { id: "fn-04", nome: "Luísa Prado", cargo: "Advogada júnior", email: "luisa@jurisflow.com.br", oab: "OAB/RJ 145.098", ingresso: "2024-04-20" },
  { id: "fn-05", nome: "Pedro Alves", cargo: "Estagiário", email: "pedro@jurisflow.com.br", oab: "—", ingresso: "2025-09-01" },
];

export const cargos = [
  { id: "cg-01", nome: "Sócio", nivel: "Diretoria", pessoas: 2, salarioBase: 25000 },
  { id: "cg-02", nome: "Advogado sênior", nivel: "Sênior", pessoas: 4, salarioBase: 14000 },
  { id: "cg-03", nome: "Advogado pleno", nivel: "Pleno", pessoas: 6, salarioBase: 9500 },
  { id: "cg-04", nome: "Advogado júnior", nivel: "Júnior", pessoas: 5, salarioBase: 6000 },
  { id: "cg-05", nome: "Estagiário", nivel: "Estágio", pessoas: 3, salarioBase: 2200 },
];

export const usuarios = [
  { id: "us-01", nome: "Marina Souza", email: "marina@jurisflow.com.br", papel: "Admin", mfa: true, ultimoAcesso: "há 2 min", status: "Ativo" },
  { id: "us-02", nome: "Ricardo Lima", email: "ricardo@jurisflow.com.br", papel: "Advogado", mfa: true, ultimoAcesso: "há 1 h", status: "Ativo" },
  { id: "us-03", nome: "André Palma", email: "andre@jurisflow.com.br", papel: "Advogado", mfa: false, ultimoAcesso: "há 4 h", status: "Ativo" },
  { id: "us-04", nome: "Luísa Prado", email: "luisa@jurisflow.com.br", papel: "Advogado", mfa: true, ultimoAcesso: "ontem", status: "Ativo" },
  { id: "us-05", nome: "Pedro Alves", email: "pedro@jurisflow.com.br", papel: "Estagiário", mfa: false, ultimoAcesso: "há 3 dias", status: "Ativo" },
];

export const empresas = [
  { id: "em-01", nome: "JurisFlow Advocacia Matriz", cnpj: "10.234.567/0001-11", cidade: "São Paulo/SP", usuarios: 18, plano: "Enterprise" },
  { id: "em-02", nome: "JurisFlow Filial Rio", cnpj: "10.234.567/0002-92", cidade: "Rio de Janeiro/RJ", usuarios: 7, plano: "Business" },
  { id: "em-03", nome: "JurisFlow BH", cnpj: "10.234.567/0003-73", cidade: "Belo Horizonte/MG", usuarios: 4, plano: "Business" },
];

export const areas = [
  { id: "ar-01", nome: "Cível", processos: 128, responsavel: "Dra. Marina Souza" },
  { id: "ar-02", nome: "Trabalhista", processos: 87, responsavel: "Dr. Ricardo Lima" },
  { id: "ar-03", nome: "Tributário", processos: 54, responsavel: "Dr. André Palma" },
  { id: "ar-04", nome: "Família", processos: 33, responsavel: "Dra. Luísa Prado" },
  { id: "ar-05", nome: "Empresarial", processos: 41, responsavel: "Dra. Marina Souza" },
  { id: "ar-06", nome: "Ambiental", processos: 12, responsavel: "Dr. André Palma" },
];
