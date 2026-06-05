from __future__ import annotations

from typing import Any, Dict, Optional

from django.http import HttpRequest
from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
    NotFound,
    Throttled,
)
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def _request_id(request: Optional[HttpRequest]) -> Optional[str]:
    rid = getattr(request, "request_id", None)
    if rid:
        return str(rid)
    return None


def _code_for(exc: Exception, response_status: int) -> str:
    if isinstance(exc, ValidationError):
        return "VALIDATION_ERROR"
    if isinstance(exc, (NotAuthenticated,)):
        return "AUTH_REQUIRED"
    if isinstance(exc, (AuthenticationFailed,)):
        return "AUTH_INVALID"
    if isinstance(exc, PermissionDenied):
        return "FORBIDDEN"
    if isinstance(exc, NotFound):
        return "NOT_FOUND"
    if isinstance(exc, Throttled) or response_status == status.HTTP_429_TOO_MANY_REQUESTS:
        return "RATE_LIMIT"
    if response_status == status.HTTP_401_UNAUTHORIZED:
        return "AUTH_REQUIRED"
    if response_status == status.HTTP_403_FORBIDDEN:
        return "FORBIDDEN"
    if response_status == status.HTTP_404_NOT_FOUND:
        return "NOT_FOUND"
    if 500 <= response_status <= 599:
        return "SERVER_ERROR"
    return "ERROR"


def _message_for(response_data: Any, exc: Exception) -> str:
    # Prefer DRF's "detail" when present
    if isinstance(response_data, dict):
        detail = response_data.get("detail")
        if isinstance(detail, str) and detail.strip():
            return detail.strip()
    # For validation errors, keep a generic message
    if isinstance(exc, ValidationError):
        return "Erro de validação."
    if isinstance(exc, Throttled):
        return "Limite de requisições excedido. Tente novamente."
    if isinstance(exc, PermissionDenied):
        return "Você não tem permissão para executar esta ação."
    if isinstance(exc, NotAuthenticated):
        return "Autenticação necessária."
    if isinstance(exc, AuthenticationFailed):
        return "Falha na autenticação."
    if isinstance(exc, NotFound):
        return "Recurso não encontrado."
    return "Ocorreu um erro inesperado."


def api_exception_handler(exc: Exception, context: Dict[str, Any]) -> Optional[Response]:
    """Global DRF exception handler.

    Returns a stable error envelope suitable for SaaS products:
      {
        "error": {"code","message","details","request_id"}
      }
    """
    response = drf_exception_handler(exc, context)

    request = context.get("request")
    rid = _request_id(request)

    # If DRF doesn't know how to handle it, return SERVER_ERROR envelope.
    if response is None:
        return Response(
            {
                "error": {
                    "code": "SERVER_ERROR",
                    "message": "Ocorreu um erro inesperado.",
                    "details": None,
                    "request_id": rid,
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    response_status = int(response.status_code)
    code = _code_for(exc, response_status)
    message = _message_for(response.data, exc)

    # details: keep validation field errors; otherwise keep minimal structured info
    details: Any = None
    if isinstance(exc, ValidationError):
        details = response.data
    elif isinstance(response.data, dict):
        # keep non-sensitive fields (avoid leaking tracebacks)
        details = {k: v for k, v in response.data.items() if k not in {"traceback"}}
    else:
        details = response.data

    response.data = {
        "error": {
            "code": code,
            "message": message,
            "details": details,
            "request_id": rid,
        }
    }
    return response
