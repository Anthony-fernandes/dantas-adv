import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/documentos")({
  component: DocumentosLayout,
});

function DocumentosLayout() {
  return <Outlet />;
}
