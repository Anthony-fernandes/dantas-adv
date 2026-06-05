import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function TenantRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-xl border bg-background p-6 space-y-3">
        <h1 className="text-xl font-semibold">Escritório não selecionado</h1>
        <p className="text-sm text-muted-foreground">
          Para continuar, selecione um escritório. Se você não tiver acesso, fale com o administrador do sistema.
        </p>
        <div className="flex gap-2 pt-2">
          <Button asChild>
            <Link to="/app/select-tenant">Selecionar escritório</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
