import { createFileRoute } from "@tanstack/react-router";
import { ErrorPage } from "./errors.forbidden";

export const Route = createFileRoute("/errors/server")({
  component: () => <ErrorPage code="500" title="Erro inesperado" msg="Algo deu errado em nossos servidores. Já fomos notificados e estamos analisando." />,
});
