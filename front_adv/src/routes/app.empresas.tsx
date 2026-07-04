import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/empresas")({
  component: EmpresasLayout,
});

function EmpresasLayout() {
  return <Outlet />;
}
