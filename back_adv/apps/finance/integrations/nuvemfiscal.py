from __future__ import annotations

try:
    import requests as _requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

_TOKEN_URL = "https://auth.nuvemfiscal.com.br/oauth/token"
_BASE_URL = "https://api.nuvemfiscal.com.br/v2"


class NuvemFiscalService:
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token: str | None = None

    def get_access_token(self) -> str:
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        resp = _requests.post(
            _TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "scope": "nfse",
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        self._access_token = resp.json()["access_token"]
        return self._access_token

    def _auth_headers(self) -> dict:
        token = self._access_token or self.get_access_token()
        return {"Authorization": f"Bearer {token}"}

    def _get(self, path: str, **kwargs):
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        resp = _requests.get(f"{_BASE_URL}{path}", headers=self._auth_headers(), **kwargs)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, json=None, **kwargs):
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        resp = _requests.post(f"{_BASE_URL}{path}", json=json, headers=self._auth_headers(), **kwargs)
        resp.raise_for_status()
        return resp.json()

    def _delete(self, path: str, json=None, **kwargs):
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        resp = _requests.delete(f"{_BASE_URL}{path}", json=json, headers=self._auth_headers(), **kwargs)
        resp.raise_for_status()
        return resp.json() if resp.content else {}

    def emitir_nfse(self, data: dict) -> dict:
        response = self._post("/nfse", json=data)
        return {
            "external_id": response.get("id"),
            "numero_nota": response.get("numero"),
            "serie": response.get("serie"),
            "status": response.get("status"),
            "pdf_url": (response.get("links") or {}).get("pdf"),
            "xml_url": (response.get("links") or {}).get("xml"),
            "raw": response,
        }

    def consultar_nfse(self, nfse_id: str) -> dict:
        response = self._get(f"/nfse/{nfse_id}")
        return {
            "external_id": response.get("id"),
            "numero_nota": response.get("numero"),
            "status": response.get("status"),
            "pdf_url": (response.get("links") or {}).get("pdf"),
            "xml_url": (response.get("links") or {}).get("xml"),
            "raw": response,
        }

    def cancelar_nfse(self, nfse_id: str) -> dict:
        response = self._delete(f"/nfse/{nfse_id}")
        return {"raw": response}
