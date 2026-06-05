import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearTokens, getAccessToken, setActiveTenantId } from "@/integrations/api/client";
import { toast } from "sonner";

type Detail = { status: number; code?: string; message?: string; requestId?: string | null };

export function GlobalApiErrorListener() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (evt: Event) => {
      const detail = (evt as CustomEvent).detail as Detail;
      const code = detail?.code || "";
      const status = detail?.status;

      // Friendly toast with request id for support
      const suffix = detail?.requestId ? ` (req: ${detail.requestId})` : "";
      const message = detail?.message || "Erro na requisição.";
      if (status >= 500) toast.error(`${message}${suffix}`);
      else if (status === 429) toast.warning(`${message}${suffix}`);

      if (code === "TENANT_REQUIRED") {
        navigate("/tenant-required", { replace: true });
        return;
      }

      if (code === "TENANT_FORBIDDEN") {
        navigate("/error/403", { replace: true });
        return;
      }

      if (code === "BILLING_BLOCKED" || status === 402) {
        toast.warning("Acesso temporariamente bloqueado para este escritório.");
        navigate(window.location.pathname.startsWith('/portal') ? "/portal" : "/app/dashboard", { replace: true });
        return;
      }

      if (status === 401) {
        // Ignore unauthenticated/public requests (e.g. failed login).
        if (!getAccessToken()) return;
        clearTokens();
        setActiveTenantId(null);
        navigate("/session-expired", { replace: true });
        return;
      }

      // Keep user on current page for recoverable server errors.
      // Most screens already render local fallback states and toasts.
    };

    window.addEventListener("lawflow:api-error", handler as any);
    return () => window.removeEventListener("lawflow:api-error", handler as any);
  }, [navigate]);

  return null;
}
