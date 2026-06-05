import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-xl border bg-background p-6 space-y-3">
        <h1 className="text-xl font-semibold">403 — Acesso negado</h1>
        <p className="text-sm text-muted-foreground">Você não tem permissão para acessar esta área.</p>
        <div className="flex gap-2 pt-2">
          <Button asChild>
            <Link to="/app/dashboard">Ir para o Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
