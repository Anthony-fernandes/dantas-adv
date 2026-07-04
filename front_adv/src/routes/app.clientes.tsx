import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/clientes")({
  component: RouteLayout,
});

function RouteLayout() {
  return <Outlet />;
}
