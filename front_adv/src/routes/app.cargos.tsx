import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/cargos")({
  component: CargosLayout,
});

function CargosLayout() {
  return <Outlet />;
}
