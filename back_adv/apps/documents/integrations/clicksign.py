from __future__ import annotations

import base64

try:
    import requests as _requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False


class ClicksignService:
    def __init__(self, api_key: str, base_url: str = "https://sandbox.clicksign.com/api/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def _get(self, path: str, **kwargs):
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        url = f"{self.base_url}{path}"
        params = kwargs.pop("params", {})
        params["access_token"] = self.api_key
        resp = _requests.get(url, params=params, **kwargs)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, json=None, **kwargs):
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        url = f"{self.base_url}{path}"
        params = kwargs.pop("params", {})
        params["access_token"] = self.api_key
        resp = _requests.post(url, json=json, params=params, **kwargs)
        resp.raise_for_status()
        return resp.json()

    def _patch(self, path: str, json=None, **kwargs):
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        url = f"{self.base_url}{path}"
        params = kwargs.pop("params", {})
        params["access_token"] = self.api_key
        resp = _requests.patch(url, json=json, params=params, **kwargs)
        resp.raise_for_status()
        return resp.json()

    def create_document(self, pdf_bytes: bytes, filename: str) -> dict:
        content_b64 = base64.b64encode(pdf_bytes).decode()
        payload = {
            "document": {
                "path": f"/{filename}",
                "content_base64": f"data:application/pdf;base64,{content_b64}",
                "auto_close": True,
                "locale": "pt-BR",
            }
        }
        data = self._post("/documents", json=payload)
        doc = data.get("document", data)
        return {
            "external_id": doc.get("key") or doc.get("id"),
            "signing_url": doc.get("url") or doc.get("request_signature_key"),
            "raw": data,
        }

    def add_signer(self, doc_key: str, name: str, email: str, role: str = "party") -> dict:
        signer_payload = {
            "signer": {
                "email": email,
                "phone_number": "",
                "auth_type": "email",
                "name": name,
                "has_documentation": False,
            }
        }
        signer_data = self._post("/signers", json=signer_payload)
        signer_key = signer_data.get("signer", signer_data).get("key")

        list_payload = {
            "list": {
                "document_key": doc_key,
                "signer_key": signer_key,
                "sign_as": role,
            }
        }
        list_data = self._post("/lists", json=list_payload)
        return {
            "signer_key": signer_key,
            "list_key": list_data.get("list", list_data).get("key"),
        }

    def finalize_list(self, doc_key: str) -> dict:
        return self._patch(f"/documents/{doc_key}/finish")

    def get_document_status(self, doc_key: str) -> dict:
        data = self._get(f"/documents/{doc_key}")
        doc = data.get("document", data)
        return {
            "status": doc.get("status"),
            "raw": data,
        }

    def cancel_document(self, doc_key: str) -> dict:
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")
        url = f"{self.base_url}/documents/{doc_key}/cancel"
        resp = _requests.patch(url, params={"access_token": self.api_key})
        resp.raise_for_status()
        return resp.json()
