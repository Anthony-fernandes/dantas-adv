import { Bell, Search, Command, Moon, Sun, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Proprietário", ADMIN: "Administrador", LAWYER: "Advogado(a)",
  ASSISTANT: "Assistente", FINANCE: "Financeiro", CLIENT: "Cliente",
};

export function AppTopbar({ title, breadcrumb }: { title?: string; breadcrumb?: string }) {
  const navigate = useNavigate();
  const { profile, roles, isSuperuser, logout } = useAuth();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    setDark(next);
  };

  const initials = (profile?.full_name || "U").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
  const roleLabel = isSuperuser ? "Superusuário" : ROLE_LABEL[roles[0] || ""] || "Equipe interna";

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 backdrop-blur-md px-6">
      <div className="min-w-0 flex-1">
        {breadcrumb && <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{breadcrumb}</p>}
        {title && <h1 className="truncate text-[15px] font-semibold text-foreground">{title}</h1>}
      </div>

      {/* Abre o Command Palette (Ctrl/Cmd+K) */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))}
        className="relative hidden lg:flex w-[380px] h-9 items-center rounded-md border border-border bg-muted/50 pl-9 pr-16 text-left text-[13px] text-muted-foreground hover:bg-background hover:border-ring transition"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        Buscar ou criar… processos, clientes, documentos
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <button onClick={toggle} aria-label="Alternar tema" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition">
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <NotificationsBell />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-1 flex items-center gap-2 rounded-md p-0.5 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">{initials}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="pb-1">
            <p className="text-[13px] font-medium text-foreground">{profile?.full_name || "Usuário"}</p>
            <p className="text-[11px] font-normal text-muted-foreground">{profile?.email || ""}</p>
            <p className="text-[10px] font-normal text-muted-foreground/70">{roleLabel}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-[13px]" onClick={() => navigate({ to: "/app/perfil" })}>
            <User className="h-3.5 w-3.5" /> Meu perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 text-[13px] text-destructive focus:text-destructive" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}


/** Sino de notificações — consome /api/notifications/ (por usuário, tenant-scoped). */
function NotificationsBell() {
  const qc = useQueryClient();
  const notifications = useQuery<any[]>({
    queryKey: ["notifications", "bell"],
    queryFn: async () => {
      const data = await api.get<any>("/notifications/", { ordering: "-created_at" });
      return Array.isArray(data) ? data : data?.results ?? [];
    },
    refetchInterval: 60_000,
  });
  const items = notifications.data ?? [];
  const unread = items.filter((n) => !n.read);

  async function markRead(n: any) {
    try {
      await api.patch(`/notifications/${n.id}/`, { read: true });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    } catch { /* silencioso */ }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Notificações" className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition">
          <Bell className="h-4 w-4" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9.5px] font-semibold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-[13px] font-semibold">Notificações</p>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {items.length === 0 && <p className="px-4 py-8 text-center text-[12.5px] text-muted-foreground">Nenhuma notificação.</p>}
          {items.slice(0, 12).map((n) => (
            <button key={n.id} onClick={() => markRead(n)}
              className={`block w-full border-b border-border/60 px-4 py-3 text-left transition hover:bg-muted/40 ${n.read ? "opacity-60" : ""}`}>
              <p className="text-[12.5px] font-medium leading-tight">{n.title}</p>
              {n.message && <p className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">{n.message}</p>}
              <p className="mt-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                {new Date(n.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </p>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
