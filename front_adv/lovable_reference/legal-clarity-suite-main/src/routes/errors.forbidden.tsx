import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/errors/forbidden")({ component: () => <ErrorPage code="403" title="Acesso negado" msg="Você não possui permissão para acessar este recurso. Entre em contato com o administrador do escritório." /> });

export function ErrorPage({ code, title, msg }: { code: string; title: string; msg: string }) {
  return (
    <div className="min-h-screen bg-paper grid place-items-center px-6">
      <div className="max-w-md text-center">
        <div className="font-display italic text-[160px] leading-none text-gold/30 select-none">{code}</div>
        <h1 className="font-display text-4xl -mt-6">{title}</h1>
        <p className="text-ink-soft mt-3">{msg}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="px-5 h-10 inline-flex items-center border border-rule text-xs uppercase tracking-widest rounded-md hover:bg-surface">Início</Link>
          <Link to="/app/dashboard" className="px-5 h-10 inline-flex items-center bg-ink text-paper text-xs uppercase tracking-widest rounded-md">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
