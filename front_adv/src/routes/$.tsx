import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFound,
});

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Erro 404</p>
        <h1 className="mt-2 font-display text-6xl font-semibold tracking-tight">Página não encontrada</h1>
        <p className="mt-4 text-sm text-muted-foreground">O endereço que você procurou não existe ou foi movido.</p>
        <Link to="/" className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2.5 text-[13.5px] font-medium text-primary-foreground hover:bg-primary/90">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}