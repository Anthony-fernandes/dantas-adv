import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/horas")({
  component: HorasLayout,
});

function HorasLayout() {
  return <Outlet />;
}
