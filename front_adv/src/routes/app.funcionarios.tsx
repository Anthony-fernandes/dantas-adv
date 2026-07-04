import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/funcionarios")({
  component: FuncionariosLayout,
});

function FuncionariosLayout() {
  return <Outlet />;
}
