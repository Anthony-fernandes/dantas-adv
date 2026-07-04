import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/usuarios")({
  component: UsuariosLayout,
});

function UsuariosLayout() {
  return <Outlet />;
}
