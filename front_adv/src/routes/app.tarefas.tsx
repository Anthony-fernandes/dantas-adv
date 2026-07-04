import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/tarefas")({
  component: TarefasLayout,
});

function TarefasLayout() {
  return <Outlet />;
}
