import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/areas")({
  component: AreasLayout,
});

function AreasLayout() {
  return <Outlet />;
}
