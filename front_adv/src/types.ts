export type Tenant = { id: string; name: string; slug: string; roles?: string[] };
export type Me = {
  id: string;
  email: string;
  full_name: string;
  tenant: Tenant | null;
  roles: string[];
  is_superuser: boolean;
};
export type ApiList<T> = { count?: number; next?: string | null; previous?: string | null; results?: T[] } | T[];
export type Client = {
  id: string;
  type: string;
  name: string;
  trade_name?: string;
  doc?: string;
  email?: string;
  whatsapp?: string;
  phone?: string;
  status?: string;
  notes?: string;
  created_at?: string;
};
export type Process = {
  id: string;
  cnj: string;
  title: string;
  subject?: string;
  area?: string;
  phase?: string;
  status?: string;
  probability?: string;
  client?: string;
  responsible_lawyer?: string;
  created_at?: string;
  updated_at?: string;
};
