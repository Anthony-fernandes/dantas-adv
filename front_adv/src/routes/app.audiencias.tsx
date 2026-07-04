import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/audiencias")({
  component: AudienciasLayout,
});

function AudienciasLayout() {
  return <Outlet />;
}
