export type ProcessSelectOption = {
  value: string;
  label: string;
};

export type ProcessFormValues = {
  cnj: string;
  clientId: string;
  parteContraria: string;
  poloAtivo: string;
  poloPassivo: string;
  className: string;
  subject: string;
  area: string;
  court: string;
  courtDivision: string;
  comarca: string;
  judge: string;
  phase: string;
  status: string;
  probability: string;
  responsibleId: string;
  causeValue: string;
  observations: string;
  internalNotes: string;
  internalNumber: string;
  origin: string;
  distributionDate: string;
  closingDate: string;
  tags: string;
  priority: string;
  risk: string;
};

export type ProcessFormErrors = Partial<Record<keyof ProcessFormValues, string>>;

export const PROCESS_FIELD_LABELS: Record<keyof ProcessFormValues, string> = {
  cnj: 'Número CNJ',
  clientId: 'Cliente',
  parteContraria: 'Parte contraria',
  poloAtivo: 'Polo ativo',
  poloPassivo: 'Polo passivo',
  className: 'Classe',
  subject: 'Assunto',
  area: 'Area',
  court: 'Tribunal',
  courtDivision: 'Vara',
  comarca: 'Comarca',
  judge: 'Juiz responsavel',
  phase: 'Fase',
  status: 'Status',
  probability: 'Probabilidade de exito',
  responsibleId: 'Advogado responsavel',
  causeValue: 'Valor da causa',
  observations: 'Observacoes',
  internalNotes: 'Notas internas',
  internalNumber: 'Número interno',
  origin: 'Origem do processo',
  distributionDate: 'Data de distribuicao',
  closingDate: 'Data de encerramento',
  tags: 'Tags internas',
  priority: 'Prioridade',
  risk: 'Risco do processo',
};

export const PROCESS_STATUS_OPTIONS: ProcessSelectOption[] = [
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'finalizado', label: 'Encerrado' },
  { value: 'suspenso', label: 'Suspenso' },
];

export const PROCESS_PHASE_OPTIONS: ProcessSelectOption[] = [
  { value: 'conhecimento', label: 'Conhecimento' },
  { value: 'execucao', label: 'Execucao' },
  { value: 'recursal', label: 'Recurso' },
];

export const PROCESS_PROBABILITY_OPTIONS: ProcessSelectOption[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
];

export const PROCESS_PRIORITY_OPTIONS: ProcessSelectOption[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export const PROCESS_RISK_OPTIONS: ProcessSelectOption[] = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
  { value: 'critico', label: 'Critico' },
];

function asText(value: unknown) {
  return String(value ?? '').trim();
}

function parseNumberFromCurrency(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  const amount = Number(digits) / 100;
  return Number.isFinite(amount) ? amount : null;
}

function humanizeOptionValue(value: string) {
  const normalized = asText(value).replaceAll('_', ' ');
  if (!normalized) return 'Opção atual';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeProcessStatus(value: unknown) {
  const normalized = asText(value).toLowerCase();
  if (normalized === 'encerrado') return 'finalizado';
  return normalized || 'em_andamento';
}

function normalizeProcessPhase(value: unknown) {
  const normalized = asText(value).toLowerCase();
  if (normalized === 'recurso') return 'recursal';
  if (normalized === 'cumprimento_de_sentenca') return 'cumprimento';
  return normalized || 'conhecimento';
}

export function ensureOptionAvailability(
  options: ProcessSelectOption[],
  currentValue?: string | null,
) {
  const normalizedValue = asText(currentValue);
  if (!normalizedValue || options.some((option) => option.value === normalizedValue)) {
    return options;
  }

  return [
    ...options,
    {
      value: normalizedValue,
      label: humanizeOptionValue(normalizedValue),
    },
  ];
}

export function formatCurrencyValue(value?: string | number | null) {
  const amount = typeof value === 'number'
    ? value
    : parseNumberFromCurrency(String(value ?? ''));
  if (amount == null) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatCnjValue(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 20);
  const parts = [
    digits.slice(0, 7),
    digits.slice(7, 9),
    digits.slice(9, 13),
    digits.slice(13, 14),
    digits.slice(14, 16),
    digits.slice(16, 20),
  ].filter(Boolean);

  let masked = parts[0] || '';
  if (parts[1]) masked += `-${parts[1]}`;
  if (parts[2]) masked += `.${parts[2]}`;
  if (parts[3]) masked += `.${parts[3]}`;
  if (parts[4]) masked += `.${parts[4]}`;
  if (parts[5]) masked += `.${parts[5]}`;
  return masked;
}

export function createEmptyProcessForm(defaultArea = 'civel', seedCnj = ''): ProcessFormValues {
  return {
    cnj: formatCnjValue(seedCnj),
    clientId: '',
    parteContraria: '',
    poloAtivo: '',
    poloPassivo: '',
    className: '',
    subject: '',
    area: defaultArea,
    court: '',
    courtDivision: '',
    comarca: '',
    judge: '',
    phase: 'conhecimento',
    status: 'em_andamento',
    probability: 'media',
    responsibleId: '',
    causeValue: '',
    observations: '',
    internalNotes: '',
    internalNumber: '',
    origin: '',
    distributionDate: '',
    closingDate: '',
    tags: '',
    priority: 'media',
    risk: 'medio',
  };
}

export function buildProcessFormValues(process?: Record<string, any> | null, defaultArea = 'civel'): ProcessFormValues {
  if (!process) return createEmptyProcessForm(defaultArea);

  return {
    cnj: formatCnjValue(asText(process.cnj)),
    clientId: asText(process.clientId || process.client_id || process.client),
    parteContraria: asText(process.parteContraria || process.defendant),
    poloAtivo: asText(process.poloAtivo || process.plaintiff),
    poloPassivo: asText(process.poloPassivo),
    className: asText(process.className || process.class_name || process.classe),
    subject: asText(process.subject || process.assunto),
    area: asText(process.area) || defaultArea,
    court: asText(process.court || process.tribunal),
    courtDivision: asText(process.courtDivision || process.court_division || process.vara),
    comarca: asText(process.comarca),
    judge: asText(process.judge || process.juizResponsavel),
    phase: normalizeProcessPhase(process.phase || process.fase),
    status: normalizeProcessStatus(process.status),
    probability: asText(process.probability || process.probabilidadeExito) || 'media',
    responsibleId: asText(process.responsibleId || process.advogadoResponsavelId || process.responsaveis?.[0]?.id),
    causeValue: formatCurrencyValue(process.causeValue || process.cause_value || process.valorCausa),
    observations: asText(process.observations || process.observacoes),
    internalNotes: asText(process.internalNotes || process.notasInternas || process.notes),
    internalNumber: asText(process.internalNumber || process.numeroInterno),
    origin: asText(process.origin || process.origemProcesso),
    distributionDate: asText(process.distributionDate || process.dataDistribuicao).slice(0, 10),
    closingDate: asText(process.closingDate || process.dataEncerramento).slice(0, 10),
    tags: Array.isArray(process.tags || process.tagsInternas)
      ? (process.tags || process.tagsInternas).join(', ')
      : asText(process.tags || process.tagsInternas),
    priority: asText(process.priority || process.prioridade) || 'media',
    risk: asText(process.risk || process.risco) || 'medio',
  };
}

/**
 * Dígito verificador CNJ (Resolução CNJ 65/2008, ISO 7064 mod 97-10).
 * O DV é calculado sobre sequencial + ano + segmento + tribunal + origem + "00".
 */
export function isValidCnjCheckDigit(digits: string): boolean {
  if (digits.length !== 20) return false;
  const seq = digits.slice(0, 7);
  const dv = Number(digits.slice(7, 9));
  const year = digits.slice(9, 13);
  const segment = digits.slice(13, 14);
  const court = digits.slice(14, 16);
  const origin = digits.slice(16, 20);
  if (segment === '0' || Number(year) < 1900) return false;
  // BigInt evita perda de precisão no número de 18 dígitos
  const base = BigInt(seq + year + segment + court + origin + '00');
  const expected = 98n - (base % 97n);
  return BigInt(dv) === expected;
}

export function validateProcessForm(values: ProcessFormValues): ProcessFormErrors {
  const errors: ProcessFormErrors = {};
  const cnjDigits = values.cnj.replace(/\D/g, '');

  if (!cnjDigits) {
    errors.cnj = 'Informe o número CNJ do processo.';
  } else if (cnjDigits.length !== 20) {
    errors.cnj = 'Use o formato CNJ 0000000-00.0000.0.00.0000.';
  } else if (!isValidCnjCheckDigit(cnjDigits)) {
    errors.cnj = 'Dígito verificador do CNJ inválido. Confira o número no tribunal de origem.';
  }

  if (!asText(values.area)) errors.area = 'Selecione a área jurídica.';
  if (!asText(values.status)) errors.status = 'Selecione o status do processo.';
  if (!asText(values.phase)) errors.phase = 'Selecione a fase processual.';

  if (values.causeValue && parseNumberFromCurrency(values.causeValue) == null) {
    errors.causeValue = 'Informe um valor de causa valido.';
  }

  return errors;
}

export function hasProcessFormChanges(current: ProcessFormValues, initial: ProcessFormValues) {
  return JSON.stringify(current) !== JSON.stringify(initial);
}

export function buildProcessSubmitPayload(
  values: ProcessFormValues,
  lookups: {
    clients: ProcessSelectOption[];
    employees: ProcessSelectOption[];
  },
) {
  void lookups;
  const amount = parseNumberFromCurrency(values.causeValue);
  const tags = values.tags
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const payload: Record<string, unknown> = {
    cnj: formatCnjValue(values.cnj),
    client: values.clientId || null,
    defendant: values.parteContraria || null,
    plaintiff: values.poloAtivo || null,
    class_name: values.className || null,
    subject: values.subject || null,
    area: values.area,
    court: values.court || null,
    court_division: values.courtDivision || null,
    phase: normalizeProcessPhase(values.phase),
    status: normalizeProcessStatus(values.status),
    probability: values.probability,
    responsible_lawyer: values.responsibleId || null,
    notes: values.observations || values.internalNotes || null,
    tags,
  };

  if (amount != null) {
    payload.cause_value = amount;
  }

  return payload;
}
