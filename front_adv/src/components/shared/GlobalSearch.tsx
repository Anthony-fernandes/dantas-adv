import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FolderOpen,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useProcesses, useClients, useTasks, useDocuments } from '@/hooks/useApiData';

type Result = {
  id: string;
  label: string;
  sub?: string;
  path: string;
  group: string;
  icon: React.ElementType;
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
  { id: 'nav-audiencias-list', label: 'Audiências', sub: 'Agenda de audiências', path: '/app/audiencias', group: 'Navegação', icon: FolderOpen },
  { id: 'nav-usuarios', label: 'Usuários', sub: 'Gestão de usuários', path: '/app/usuarios', group: 'Configurações', icon: Settings },
  { id: 'nav-auditoria', label: 'Auditoria', sub: 'Log de auditoria', path: '/app/auditoria', group: 'Configurações', icon: Settings },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: processesRaw } = useProcesses();
  const { data: clientsRaw } = useClients();
  const { data: tasksRaw } = useTasks();
  const { data: documentsRaw } = useDocuments();

  const processes: any[] = Array.isArray(processesRaw) ? processesRaw : [];
  const clients: any[] = Array.isArray(clientsRaw) ? clientsRaw : [];
  const tasks: any[] = Array.isArray(tasksRaw) ? tasksRaw : [];
  const documents: any[] = Array.isArray(documentsRaw) ? documentsRaw : (documentsRaw as any)?.results ?? [];

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

  const processResults = useMemo<Result[]>(() =>
    processes.slice(0, 50).map((p) => ({
      id: `process-${p.id}`,
      label: p.cnj || p.number || 'Processo',
      sub: [p.client_name, p.status].filter(Boolean).join(' · '),
      path: `/app/processos/${p.id}`,
      group: 'Processos',
      icon: Gavel,
    })),
  [processes]);

  const clientResults = useMemo<Result[]>(() =>
    clients.slice(0, 50).map((c) => ({
      id: `client-${c.id}`,
      label: c.name || c.razao_social || c.full_name || 'Cliente',
      sub: c.cpf || c.cnpj || c.email || '',
      path: `/app/clientes/${c.id}`,
      group: 'Clientes',
      icon: Users,
    })),
  [clients]);

  const taskResults = useMemo<Result[]>(() =>
    tasks.slice(0, 50).filter((t) => t.status !== 'concluida').map((t) => ({
      id: `task-${t.id}`,
      label: t.title,
      sub: t.due_date ? `Vence ${new Date(t.due_date).toLocaleDateString('pt-BR')}` : '',
      path: '/app/tarefas',
      group: 'Tarefas',
      icon: CheckSquare,
    })),
  [tasks]);

  const documentResults = useMemo<Result[]>(() =>
    documents.slice(0, 30).map((d) => ({
      id: `doc-${d.id}`,
      label: d.title || d.filename || d.name || 'Documento',
      sub: [d.category, d.process_cnj || d.process_number].filter(Boolean).join(' · '),
      path: d.process ? `/app/processos/${d.process}?tab=documents` : '/app/documentos',
      group: 'Documentos',
      icon: FileText,
    })),
  [documents]);

  function run(path: string) {
    navigate(path);
    setOpen(false);
  }

  function renderGroup(results: Result[], showGroup: boolean = false) {
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
            <CommandItem key={item.id} value={`${item.label} ${item.sub ?? ''}`} onSelect={() => run(item.path)}>
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

  const allDataResults = [...processResults, ...clientResults, ...taskResults, ...documentResults];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden w-[380px] items-center gap-2.5 rounded-lg border border-border bg-muted/60 px-3.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
      >
        <svg className="h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span>Buscar...</span>
        <kbd className="pointer-events-none ml-auto hidden select-none rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium opacity-60 sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar processos, clientes, tarefas, páginas..." />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          {allDataResults.length > 0 && renderGroup(allDataResults)}

          <CommandSeparator />
          {renderGroup(NAV_COMMANDS)}
        </CommandList>
      </CommandDialog>
    </>
  );
}
