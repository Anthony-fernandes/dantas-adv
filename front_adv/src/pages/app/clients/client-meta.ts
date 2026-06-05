const META_MARKER = '[META_FRONT]';

export type ClientInteractionEntry = {
  id: string;
  date: string;
  type: 'ligacao' | 'email' | 'whatsapp' | 'reuniao' | 'nota';
  note: string;
  user?: string;
};

export type ClientMetaNotes = {
  fantasy_name?: string;
  rg_ie?: string;
  birth_or_open_date?: string;
  marital_status?: string;
  phone?: string;
  whatsapp?: string;
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  complement?: string;
  responsible_internal_id?: string;
  responsible_internal_name?: string;
  origin?: string;
  internal_notes?: string;
  portal_enabled?: boolean;
  portal_invited_at?: string;
  portal_last_reset_at?: string;
  interaction_history?: ClientInteractionEntry[];
};

export type ClientMetaParseResult = {
  publicNotes: string;
  meta: ClientMetaNotes;
};

type AddressLike = {
  cep?: string | null;
  zip?: string | null;
  zip_code?: string | null;
  state?: string | null;
  cidade?: string | null;
  city?: string | null;
  bairro?: string | null;
  neighborhood?: string | null;
  logradouro?: string | null;
  street?: string | null;
  numero?: string | null;
  number?: string | null;
  line1?: string | null;
  complemento?: string | null;
  complement?: string | null;
  line2?: string | null;
};

export const CLIENT_LINK_FIELDS = ['user', 'portal_user', 'user_id', 'portal_user_id', 'client_user', 'client_user_id'] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compactMeta(meta: ClientMetaNotes) {
  return Object.fromEntries(
    Object.entries(meta).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    }),
  ) as ClientMetaNotes;
}

export function normalizeClientText(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function parseClientNotes(notes?: string | null): ClientMetaParseResult {
  const raw = String(notes || '');
  const markerIndex = raw.indexOf(META_MARKER);
  if (markerIndex < 0) {
    return { publicNotes: raw.trim(), meta: {} };
  }

  const publicNotes = raw.slice(0, markerIndex).trim();
  const jsonText = raw.slice(markerIndex + META_MARKER.length).trim();

  try {
    const parsed = JSON.parse(jsonText);
    return {
      publicNotes,
      meta: isObject(parsed) ? (parsed as ClientMetaNotes) : {},
    };
  } catch {
    return { publicNotes: raw.trim(), meta: {} };
  }
}

export function serializeClientNotes(publicNotes: string, meta: ClientMetaNotes) {
  const cleanNotes = String(publicNotes || '').trim();
  const compacted = compactMeta(meta);
  if (!Object.keys(compacted).length) return cleanNotes || null;
  return `${cleanNotes}${cleanNotes ? '\n\n' : ''}${META_MARKER}\n${JSON.stringify(compacted)}`;
}

export function resolveClientAddress(address?: AddressLike | null, meta?: ClientMetaNotes | null) {
  const source = address || {};
  return {
    cep: String(source.cep || source.zip || source.zip_code || meta?.cep || '').trim(),
    state: String(source.state || meta?.state || '').trim(),
    city: String(source.cidade || source.city || meta?.city || '').trim(),
    neighborhood: String(source.bairro || source.neighborhood || meta?.neighborhood || '').trim(),
    street: String(source.logradouro || source.street || source.line1 || meta?.street || '').trim(),
    number: String(source.numero || source.number || meta?.number || '').trim(),
    complement: String(source.complemento || source.complement || source.line2 || meta?.complement || '').trim(),
  };
}

export function resolveLinkedClientUserId(record: any) {
  for (const field of CLIENT_LINK_FIELDS) {
    const value = record?.[field];
    if (value == null) continue;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object' && value?.id != null) return String(value.id);
  }
  return '';
}

export function resolveClientPortalEnabled(record: any, meta?: ClientMetaNotes | null) {
  return Boolean(resolveLinkedClientUserId(record) || meta?.portal_enabled);
}
