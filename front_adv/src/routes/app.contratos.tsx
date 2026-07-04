import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/contratos")({
  component: ContratosLayout,
});

function ContratosLayout() {
  return <Outlet />;
}
