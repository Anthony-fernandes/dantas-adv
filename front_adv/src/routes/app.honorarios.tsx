import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/honorarios")({
  component: HonorariosLayout,
});

function HonorariosLayout() {
  return <Outlet />;
}
