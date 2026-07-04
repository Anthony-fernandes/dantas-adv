import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/prazos")({
  component: PrazosLayout,
});

function PrazosLayout() {
  return <Outlet />;
}
