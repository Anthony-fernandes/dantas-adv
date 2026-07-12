import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Gavel, Users, FileText, CheckSquare, Plus, Clock, CalendarDays,
  LayoutDashboard, Building2, Loader2,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type SearchPayload = {
  processes: Array<{ id: string; cnj?: string; subject?: string; client_name?: string }>;
  clients: Array<{ id: string; name: string; doc?: string }>;
  documents: Array<{ id: string; title?: string; filename?: string; process_id?: string }>;
  tasks: Array<{ id: string; title: string; due_date?: string | null }>;
};

function useDebounced(value: string, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * Command Palette (Ctrl/Cmd+K): busca global real + comandos de criação.
 * Comandos de criação navegam com `?novo=1`, que as listagens interpretam
 * abrindo o pop-up de cadastro — zero telas intermediárias.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const debounced = useDebounced(q);
  const navigate = useNavigate();
  const { hasRole, isSuperuser } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const search = useQuery<SearchPayload>({
    queryKey: ["global-search", debounced],
    queryFn: () => api.get<SearchPayload>("/search/", { q: debounced }),
    enabled: open && debounced.trim().length >= 2,
    staleTime: 30_000,
  });

  function go(fn: () => void) {
    setOpen(false);
    setQ("");
    fn();
  }

  const canLegal = isSuperuser || hasRole("OWNER", "ADMIN", "LAWYER", "ASSISTANT");

  const commands = useMemo(() => {
    const list: { label: string; icon: any; run: () => void; keywords?: string }[] = [
      { label: "Abrir Meu Workspace", icon: LayoutDashboard, run: () => navigate({ to: "/app" }) },
    ];
    if (canLegal) {
      list.push(
        { label: "Criar processo", icon: Plus, keywords: "novo processo", run: () => navigate({ to: "/app/processos", search: { novo: 1 } as any }) },
        { label: "Criar cliente", icon: Plus, keywords: "novo cliente", run: () => navigate({ to: "/app/clientes", search: { novo: 1 } as any }) },
        { label: "Criar prazo", icon: Plus, keywords: "novo prazo", run: () => navigate({ to: "/app/prazos", search: { novo: 1 } as any }) },
        { label: "Agendar audiência", icon: CalendarDays, keywords: "nova audiencia", run: () => navigate({ to: "/app/audiencias", search: { novo: 1 } as any }) },
        { label: "Criar tarefa", icon: CheckSquare, keywords: "nova tarefa", run: () => navigate({ to: "/app/tarefas", search: { novo: 1 } as any }) },
        { label: "Lançar horas", icon: Clock, keywords: "timesheet hora", run: () => navigate({ to: "/app/horas", search: { novo: 1 } as any }) },
        { label: "Enviar documento", icon: FileText, keywords: "upload documento", run: () => navigate({ to: "/app/documentos", search: { novo: 1 } as any }) },
      );
    }
    list.push({ label: "Trocar escritório", icon: Building2, keywords: "tenant empresa", run: () => navigate({ to: "/selecionar-tenant" }) });
    return list;
  }, [canLegal, navigate]);

  const r = search.data;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar processos, clientes, documentos… ou digitar um comando" value={q} onValueChange={setQ} />
      <CommandList>
        <CommandEmpty>
          {search.isFetching ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Buscando…</span> : "Nada encontrado."}
        </CommandEmpty>

        {(r?.processes?.length ?? 0) > 0 && (
          <CommandGroup heading="Processos">
            {r!.processes.map((p) => (
              <CommandItem key={`p-${p.id}`} value={`processo ${p.cnj} ${p.subject} ${p.client_name}`}
                onSelect={() => go(() => navigate({ to: "/app/processos/$id", params: { id: p.id } }))}>
                <Gavel className="mr-2 h-4 w-4" />
                <span className="font-mono text-[12.5px] mr-2">{p.cnj || "Sem CNJ"}</span>
                <span className="text-muted-foreground truncate">{p.subject || p.client_name || ""}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(r?.clients?.length ?? 0) > 0 && (
          <CommandGroup heading="Clientes">
            {r!.clients.map((c) => (
              <CommandItem key={`c-${c.id}`} value={`cliente ${c.name} ${c.doc}`}
                onSelect={() => go(() => navigate({ to: "/app/clientes/$id", params: { id: c.id } }))}>
                <Users className="mr-2 h-4 w-4" /> {c.name}
                {c.doc && <span className="ml-2 font-mono text-[11.5px] text-muted-foreground">{c.doc}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(r?.documents?.length ?? 0) > 0 && (
          <CommandGroup heading="Documentos">
            {r!.documents.map((d) => (
              <CommandItem key={`d-${d.id}`} value={`documento ${d.title} ${d.filename}`}
                onSelect={() => go(() => navigate({ to: "/app/documentos/$id", params: { id: d.id } }))}>
                <FileText className="mr-2 h-4 w-4" /> {d.title || d.filename || "Documento"}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {(r?.tasks?.length ?? 0) > 0 && (
          <CommandGroup heading="Tarefas">
            {r!.tasks.map((t) => (
              <CommandItem key={`t-${t.id}`} value={`tarefa ${t.title}`}
                onSelect={() => go(() => navigate({ to: "/app/tarefas" }))}>
                <CheckSquare className="mr-2 h-4 w-4" /> {t.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading="Comandos">
          {commands.map((c) => {
            const Icon = c.icon;
            return (
              <CommandItem key={c.label} value={`${c.label} ${c.keywords || ""}`} onSelect={() => go(c.run)}>
                <Icon className="mr-2 h-4 w-4 text-primary" /> {c.label}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
