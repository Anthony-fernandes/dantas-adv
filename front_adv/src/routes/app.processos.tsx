import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/processos")({
  component: RouteLayout,
});

function RouteLayout() {
  return <Outlet />;
}
