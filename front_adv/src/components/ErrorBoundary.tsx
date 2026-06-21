import React from "react";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || "Erro inesperado na interface." };
  }

  componentDidCatch(error: any, info: any) {
    console.error("UI ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/30 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
          <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="space-y-2">
          <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Erro de interface
          </p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Algo deu errado</h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {this.state.message || "Ocorreu um erro inesperado. Recarregue a página ou volte ao painel."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => (window.location.href = "/app/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
            Ir ao painel
          </Button>
        </div>
      </div>
    );
  }
}
