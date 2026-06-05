import uuid

from django.conf import settings
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication

from apps.accounts.models import UserRole
from apps.billing.services import ensure_subscription_for_tenant
from apps.core.models import Tenant


def _error(code: str, message: str, status_code: int, request_id: str | None = None):
    return JsonResponse(
        {
            "error": {
                "code": code,
                "message": message,
                "details": None,
                "request_id": request_id,
            }
        },
        status=status_code,
    )


class TenantContextMiddleware(MiddlewareMixin):
    """Row-level multi-tenancy middleware."""

    PUBLIC_PREFIXES = (
        "/api/auth/login",
        "/api/auth/token",
        "/api/auth/accept-invite",
        "/api/tenants/my",
        "/api/admin/companies",
        "/api/landing",
        "/api/posts",
        "/api/testimonials",
        "/api/contact-messages",
        "/api/public/tenants",
        "/api/public/site",
        "/api/public/contact",
        "/api/public/landing",
        "/api/health",
        "/admin",
    )

    def _is_public(self, request) -> bool:
        path = request.path or ""
        if any(path.startswith(prefix) for prefix in self.PUBLIC_PREFIXES):
            return True
        if path.rstrip("/") == "/api/tenants" and request.method.upper() in {"GET", "POST"}:
            return True
        return False

    def process_request(self, request):
        request.tenant = None
        request.tenant_id = None

        if self._is_public(request):
            return None

        if not (request.path or "").startswith("/api/"):
            return None

        request_id = getattr(request, "request_id", None)

        auth = JWTAuthentication()
        try:
            user_auth_tuple = auth.authenticate(request)
        except Exception:
            return _error("AUTH_INVALID", "Autenticacao invalida.", 401, request_id)

        if not user_auth_tuple:
            return _error("AUTH_REQUIRED", "Credenciais de autenticacao nao fornecidas.", 401, request_id)

        request.user, request.auth = user_auth_tuple

        if getattr(settings, "LGPD_REQUIRED", False):
            if getattr(request.user, "lgpd_accepted_at", None) is None:
                if not (request.path or "").startswith("/api/me/accept-lgpd"):
                    return _error(
                        "LGPD_REQUIRED",
                        "E necessario aceitar os termos de uso/LGPD para continuar.",
                        403,
                        request_id,
                    )

        tenant_query = request.GET.get("tenant_id") or request.GET.get("tenant")
        tenant_header = request.headers.get("X-Tenant-ID") or request.META.get("HTTP_X_TENANT_ID")
        tenant_ref = tenant_query or tenant_header

        if not tenant_ref:
            if request.user.is_superuser:
                return None
            return _error("TENANT_REQUIRED", "Header X-Tenant-ID ou query tenant_id e obrigatorio.", 400, request_id)

        try:
            tenant_uuid = uuid.UUID(str(tenant_ref))
        except Exception:
            return _error("TENANT_REQUIRED", "Header X-Tenant-ID ou query tenant_id deve ser um UUID valido.", 400, request_id)

        try:
            tenant = Tenant.objects.get(id=tenant_uuid)
        except Tenant.DoesNotExist:
            return _error("NOT_FOUND", "Tenant nao encontrado.", 404, request_id)

        if (not request.user.is_superuser) and (not UserRole.objects.filter(user=request.user, tenant=tenant).exists()):
            return _error("TENANT_FORBIDDEN", "Voce nao tem acesso a este tenant.", 403, request_id)

        request.tenant = tenant
        request.tenant_id = tenant_uuid

        try:
            if not request.user.is_superuser:
                sub = ensure_subscription_for_tenant(tenant)
                if not sub.is_access_allowed():
                    return _error(
                        "BILLING_BLOCKED",
                        "Acesso bloqueado por cobranca/assinatura. Atualize seu plano para continuar.",
                        402,
                        request_id,
                    )
        except Exception:
            return _error("SERVER_ERROR", "Erro ao validar assinatura.", 500, request_id)

        return None

