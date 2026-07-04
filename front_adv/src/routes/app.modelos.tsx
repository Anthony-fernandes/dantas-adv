import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/modelos")({
  component: ModelosLayout,
});

function ModelosLayout() {
  return <Outlet />;
}
