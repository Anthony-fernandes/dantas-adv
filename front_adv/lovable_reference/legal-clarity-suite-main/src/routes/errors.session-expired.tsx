import { createFileRoute } from "@tanstack/react-router";
import { ErrorPage } from "./errors.forbidden";

export const Route = createFileRoute("/errors/session-expired")({
  component: () => <ErrorPage code="—" title="Sessão expirada" msg="Por segurança, sua sessão foi encerrada. Faça login novamente para continuar." />,
});
