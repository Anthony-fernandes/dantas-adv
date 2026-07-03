import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Gavel,
  Users,
  FileText,
  CheckSquare,
  CalendarClock,
  Clock,
  LayoutDashboard,
  DollarSign,
  BarChart3,
  Settings,
  FileSignature,
  Loader2,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { api } from '@/integrations/api/client';
import { useTenant } from '@/contexts/TenantContext';

type Result = {
  id: string;
  label: string;
  sub?: string;
  path: string;
  group: string;
  icon: React.ElementType;
};

type SearchResponse = {
  processes: Array<{ id: string; cnj?: string | null; subject?: string | null; client_name?: string | null; status?: string }>;
  clients: Array<{ id: string; name: string; doc?: string | null; type?: string; status?: string }>;
  documents: Array<{ id: string; title?: string | null; category?: string; process_id?: string | null }>;
  tasks: Array<{ id: string; title: string; status?: string; due_date?: string | null }>;
};

const NAV_COMMANDS: Result[] = [
  { id: 'nav-dashboard', label: 'Painel', sub: 'Visão geral', path: '/app/dashboard', group: 'Navegação', icon: LayoutDashboard },
  { id: 'nav-processos', label: 'Processos', sub: 'Lista de processos', path: '/app/processos', group: 'Navegação', icon: Gavel },
  { id: 'nav-clientes', label: 'Clientes', sub: 'Carteira de clientes', path: '/app/clientes', group: 'Navegação', icon: Users },
  { id: 'nav-tarefas', label: 'Tarefas', sub: 'Controle de tarefas', path: '/app/tarefas', group: 'Navegação', icon: CheckSquare },
  { id: 'nav-horas', label: 'Controle de Horas', sub: 'Lançamentos de horas', path: '/app/horas', group: 'Navegação', icon: Clock },
  { id: 'nav-prazos', label: 'Prazos', sub: 'Gestão de prazos', path: '/app/prazos', group: 'Navegação', icon: CalendarClock },
  { id: 'nav-audiencias', label: 'Audiências', sub: 'Agenda de audiências', path: '/app/audiencias', group: 'Navegação', icon: Gavel },
  { id: 'nav-documentos', label: 'Documentos', sub: 'Central documental', path: '/app/documentos', group: 'Navegação', icon: FileText },
  { id: 'nav-financeiro', label: 'Financeiro', sub: 'Contas e pagamentos', path: '/app/financeiro', group: 'Navegação', icon: DollarSign },
  { id: 'nav-honorarios', label: 'Honorários', sub: 'Honorários advocatícios', path: '/app/honorarios', group: 'Navegação', icon: DollarSign },
  { id: 'nav-relatorios', label: 'Relatórios', sub: 'Análises e indicadores', path: '/app/relatorios', group: 'Navegação', icon: BarChart3 },
  { id: 'nav-contratos', label: 'Contratos', sub: 'Contratos de honorários', path: '/app/contratos', group: 'Navegação', icon: FileSignature },
  { id: 'nav-modelos', label: 'Modelos', sub: 'Templates de documentos', path: '/app/modelos', group: 'Navegação', icon: FileText },
  { id: 'nav-usuarios', label: 'Usuários', sub: 'Gestão de usuários', path: '/app/usuarios', group: 'Configurações', icon: Settings },
  { id: 'nav-auditoria', label: 'Auditoria', sub: 'Log de auditoria', path: '/app/auditoria', group: 'Configurações', icon: Settings },
];

const PROCESS_STATUS_LABEL: Record<string, string> = {
  em_andamento: 'Em andamento',
  suspenso: 'Suspenso',
  finalizado: 'Finalizado',
  arquivado: 'Arquivado',
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);
  return debounced;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { activeTenantId } = useTenant();

  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  const searchQuery = useQuery({
    queryKey: ['global-search', activeTenantId, debouncedQuery],
    queryFn: () => api.get<SearchResponse>(`/search/?q=${encodeURIComponent(debouncedQuery)}`),
    enabled: open && !!activeTenantId && debouncedQuery.length >= 2,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
          if (e.key === '/') return;
        }
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const dataResults = useMemo<Result[]>(() => {
    const data = searchQuery.data;
    if (!data || debouncedQuery.length < 2) return [];
    return [
      ...(data.processes || []).map((p) => ({
        id: `process-${p.id}`,
        label: p.cnj || p.subject || 'Processo',
        sub: [p.client_name, PROCESS_STATUS_LABEL[p.status || ''] || p.status].filter(Boolean).join(' · '),
        path: `/app/processos/${p.id}`,
        group: 'Processos',
        icon: Gavel,
      })),
      ...(data.clients || []).map((c) => ({
        id: `client-${c.id}`,
        label: c.name,
        sub: [c.type, c.doc].filter(Boolean).join(' · '),
        path: `/app/clientes/${c.id}`,
        group: 'Clientes',
        icon: Users,
      })),
      ...(data.tasks || []).map((t) => ({
        id: `task-${t.id}`,
        label: t.title,
        sub: t.due_date ? `Vence ${new Date(`${t.due_date}T12:00:00`).toLocaleDateString('pt-BR')}` : '',
        path: '/app/tarefas',
        group: 'Tarefas',
        icon: CheckSquare,
      })),
      ...(data.documents || []).map((d) => ({
        id: `doc-${d.id}`,
        label: d.title || 'Documento',
        sub: d.category || '',
        path: d.process_id ? `/app/processos/${d.process_id}?tab=documents` : '/app/documentos',
        group: 'Documentos',
        icon: FileText,
      })),
    ];
  }, [searchQuery.data, debouncedQuery]);

  const navResults = useMemo<Result[]>(() => {
    if (!query.trim()) return NAV_COMMANDS;
    const lowered = query.trim().toLowerCase();
    return NAV_COMMANDS.filter(
      (item) => item.label.toLowerCase().includes(lowered) || (item.sub || '').toLowerCase().includes(lowered),
    );
  }, [query]);

  function run(path: string) {
    navigate(path);
    setOpen(false);
  }

  function renderGroup(results: Result[]) {
    const grouped: Record<string, Result[]> = {};
    for (const r of results) {
      if (!grouped[r.group]) grouped[r.group] = [];
      grouped[r.group].push(r);
    }
    return Object.entries(grouped).map(([group, items], gi) => (
      <div key={group}>
        {gi > 0 && <CommandSeparator />}
        <CommandGroup heading={group}>
          {items.map((item) => (
            <CommandItem key={item.id} value={item.id} onSelect={() => run(item.path)}>
              <item.icon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{item.label}</span>
                {item.sub && <span className="truncate text-xs text-muted-foreground">{item.sub}</span>}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </div>
    ));
  }

  const isSearching = searchQuery.isFetching && debouncedQuery.length >= 2;
  const showEmpty = !isSearching && dataResults.length === 0 && navResults.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden w-[380px] items-center gap-2.5 rounded-lg border border-border bg-muted/60 px-3.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
      >
        <svg className="h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span>Buscar processos, clientes, documentos...</span>
        <kbd className="pointer-events-none ml-auto hidden select-none rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium opacity-60 sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Buscar por CNJ, cliente, documento, tarefa ou página..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[420px]">
          {isSearching && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando na base do escritório…
            </div>
          )}
          {showEmpty && <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>}

          {dataResults.length > 0 && renderGroup(dataResults)}

          {navResults.length > 0 && (
            <>
              {dataResults.length > 0 && <CommandSeparator />}
              {renderGroup(navResults)}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
