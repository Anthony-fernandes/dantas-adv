import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PortalSidebar } from "@/components/shell/PortalSidebar";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

function PortalLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <PortalSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 backdrop-blur-md px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Portal do cliente</p>
            <p className="text-[13.5px] font-medium">Construtora Aurora S.A.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted transition">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold">AS</div>
          </div>
        </header>
        <main className="flex-1"><Outlet /></main>
      </div>
    </div>
  );
}