import React from "react";
import { Button } from "@/components/ui/button";

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || "Erro inesperado na interface." };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("UI ErrorBoundary:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-xl border bg-background p-6 space-y-3">
          <h1 className="text-xl font-semibold">Ocorreu um erro na interface</h1>
          <p className="text-sm text-muted-foreground">{this.state.message}</p>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => window.location.reload()}>Recarregar</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/app/dashboard")}>
              Ir para o Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
