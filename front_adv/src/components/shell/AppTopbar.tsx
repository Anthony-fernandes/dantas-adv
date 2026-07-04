import { Bell, Search, Plus, HelpCircle, Command, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function AppTopbar({ title, breadcrumb }: { title?: string; breadcrumb?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);
  const toggle = () => {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    setDark(next);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 backdrop-blur-md px-6">
      <div className="min-w-0 flex-1">
        {breadcrumb && <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{breadcrumb}</p>}
        {title && <h1 className="truncate text-[15px] font-semibold text-foreground">{title}</h1>}
      </div>

      <div className="relative hidden lg:block w-[380px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Buscar processos, clientes, prazos…"
          className="h-9 w-full rounded-md border border-border bg-muted/50 pl-9 pr-16 text-[13px] outline-none focus:bg-background focus:border-ring focus:ring-2 focus:ring-ring/20 transition"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </div>

      <Button size="sm" className="gap-1.5 h-9 bg-primary hover:bg-primary/90">
        <Plus className="h-4 w-4" />
        Novo
      </Button>

      <button onClick={toggle} aria-label="Alternar tema" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition">
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <button aria-label="Ajuda" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition">
        <HelpCircle className="h-4 w-4" />
      </button>
      <button aria-label="Notificações" className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
      </button>
    </header>
  );
}