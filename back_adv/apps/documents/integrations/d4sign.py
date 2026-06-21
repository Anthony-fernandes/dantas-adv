from __future__ import annotations

try:
    import requests as _requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False


class D4SignService:
    def __init__(self, token_api: str, crypt_key: str, base_url: str = "https://sandbox.d4sign.com.br/api/v1"):
        self.token_api = token_api
        self.crypt_key = crypt_key
        self.base_url = base_url.rstrip("/")

    def _headers(self) -> dict:
        return {
            "tokenAPI": self.token_api,
            "cryptKey": self.crypt_key,
        }

    def _get(self, path: str, **kwargs):
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        resp = _requests.get(f"{self.base_url}{path}", headers=self._headers(), **kwargs)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, data=None, files=None, json=None, **kwargs):
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        resp = _requests.post(
            f"{self.base_url}{path}",
            headers=self._headers() if not files else {k: v for k, v in self._headers().items()},
            data=data,
            files=files,
            json=json,
            **kwargs,
        )
        resp.raise_for_status()
        return resp.json()

    def upload_document(self, pdf_bytes: bytes, filename: str, safe_uuid: str) -> dict:
        files = {"file": (filename, pdf_bytes, "application/pdf")}
        data = self._post(f"/documents/{safe_uuid}/upload", files=files)
        doc_uuid = data.get("uuid") or (data.get("data", {}) or {}).get("uuid")
        return {
            "external_id": doc_uuid,
            "raw": data,
        }

    def add_signer(self, doc_uuid: str, email: str, name: str, key_signer: str = "1") -> dict:
        payload = {
            "email": email,
            "display_name": name,
            "key_signer": key_signer,
        }
        data = self._post(f"/documents/{doc_uuid}/createlist", json=payload)
        return {"raw": data}

    def send_to_signers(self, doc_uuid: str) -> dict:
        payload = {"message": "Por favor, assine o documento."}
        data = self._post(f"/documents/{doc_uuid}/sendtosigner", json=payload)
        signing_url = (data.get("data") or {}).get("link") or data.get("link")
        return {
            "signing_url": signing_url,
            "raw": data,
        }

    def get_document_status(self, doc_uuid: str) -> dict:
        data = self._get(f"/documents/{doc_uuid}")
        doc = data.get("data", data) if isinstance(data, dict) else {}
        status_code = doc.get("uuidDoc") and doc.get("statusName")
        return {
            "status": status_code or doc.get("status"),
            "raw": data,
        }
