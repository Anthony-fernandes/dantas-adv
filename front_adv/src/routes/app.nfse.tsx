import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/nfse")({
  component: NfseLayout,
});

function NfseLayout() {
  return <Outlet />;
}
