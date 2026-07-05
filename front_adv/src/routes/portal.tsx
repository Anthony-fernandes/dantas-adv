import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PortalSidebar } from "@/components/shell/PortalSidebar";
import { Bell, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

function PortalLayout() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, profile, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate({ to: "/portal/login" });
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  const name = profile?.full_name || "Cliente";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <PortalSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 backdrop-blur-md px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Portal do cliente</p>
            <p className="text-[13.5px] font-medium">{name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted transition">
              <Bell className="h-4 w-4" />
            </button>
            <button onClick={() => { logout(); navigate({ to: "/portal/login" }); }} className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted transition" aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold">{initials}</div>
          </div>
        </header>
        <main className="flex-1"><Outlet /></main>
      </div>
    </div>
  );
}
