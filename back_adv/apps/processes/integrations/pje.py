from __future__ import annotations

import re

try:
    import requests as _requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False

try:
    from bs4 import BeautifulSoup as _BS
    _HAS_BS4 = True
except ImportError:
    _HAS_BS4 = False


class PJeService:
    def __init__(self):
        pass

    def _parse_html(self, html: str) -> dict:
        movimentos = []
        status = ""

        if _HAS_BS4:
            soup = _BS(html, "html.parser")
            status_tag = soup.find(attrs={"class": re.compile(r"status|situacao", re.I)})
            if status_tag:
                status = status_tag.get_text(strip=True)

            rows = soup.select("tr")
            for row in rows:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    data_text = cells[0].get_text(strip=True)
                    desc_text = cells[-1].get_text(" ", strip=True)
                    if re.match(r"\d{2}/\d{2}/\d{4}", data_text) and desc_text:
                        movimentos.append({"data": data_text, "descricao": desc_text})
        else:
            date_pattern = re.compile(r"(\d{2}/\d{2}/\d{4})")
            for line in html.split("\n"):
                m = date_pattern.search(line)
                if m:
                    clean = re.sub(r"<[^>]+>", "", line).strip()
                    if clean:
                        movimentos.append({"data": m.group(1), "descricao": clean})

        return {"status": status, "movimentos": movimentos[:50]}

    def consultar_processo(self, cnj: str, tribunal_url: str) -> dict:
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")

        tribunal_url = tribunal_url.rstrip("/")
        url = f"{tribunal_url}/pje/Processo/ConsultaProcesso/listView.seam"
        params = {"numeroProcesso": cnj}

        try:
            resp = _requests.get(
                url,
                params=params,
                timeout=15,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()
            return self._parse_html(resp.text)
        except _requests.HTTPError as exc:
            raise RuntimeError(f"PJe HTTP error: {exc}") from exc
        except _requests.RequestException as exc:
            raise RuntimeError(f"PJe request failed: {exc}") from exc
