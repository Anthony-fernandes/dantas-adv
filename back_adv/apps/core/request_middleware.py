from __future__ import annotations

import json
import time
import uuid
from typing import Optional

from django.utils.deprecation import MiddlewareMixin
from django.http import HttpRequest, HttpResponse


def _get_request_id(request: HttpRequest) -> str:
    incoming = request.headers.get("X-Request-ID") or request.META.get("HTTP_X_REQUEST_ID")
    if incoming:
        # Keep it short-ish
        return str(incoming)[:64]
    return str(uuid.uuid4())


class RequestIDMiddleware(MiddlewareMixin):
    """Assigns a request_id to every request and returns it as X-Request-ID."""

    def process_request(self, request: HttpRequest):
        request.request_id = _get_request_id(request)
        return None

    def process_response(self, request: HttpRequest, response: HttpResponse):
        rid = getattr(request, "request_id", None)
        if rid:
            response["X-Request-ID"] = str(rid)
        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """Logs each API request as a single JSON line.

    This is intentionally lightweight and production-friendly. Configure handlers/formatters
    in LOGGING if you want to ship logs to Loki/ELK later.
    """

    def process_request(self, request: HttpRequest):
        request._start_ts = time.time()
        return None

    def process_response(self, request: HttpRequest, response: HttpResponse):
        try:
            if not (request.path or "").startswith("/api/"):
                return response
            duration_ms = None
            if hasattr(request, "_start_ts"):
                duration_ms = int((time.time() - request._start_ts) * 1000)

            payload = {
                "event": "http_request",
                "request_id": getattr(request, "request_id", None),
                "tenant_id": getattr(getattr(request, "tenant", None), "id", None) or getattr(request, "tenant_id", None),
                "user_id": getattr(getattr(request, "user", None), "id", None) if getattr(request, "user", None) and getattr(request.user, "is_authenticated", False) else None,
                "method": request.method,
                "path": request.path,
                "status": int(getattr(response, "status_code", 0) or 0),
                "duration_ms": duration_ms,
            }
            import logging

            logging.getLogger("lawflow.request").info(json.dumps(payload, default=str))
        except Exception:
            # Never break responses due to logging.
            pass
        return response
