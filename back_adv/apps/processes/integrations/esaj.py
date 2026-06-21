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

_BASE_URL = "https://esaj.tjsp.jus.br"


class eSAJService:
    def __init__(self, session_cookies: dict | None = None):
        self.session_cookies = session_cookies or {}

    def _parse_html(self, html: str) -> dict:
        movimentos = []
        status = ""

        if _HAS_BS4:
            soup = _BS(html, "html.parser")

            status_tag = soup.find("span", {"id": "situacaoProcesso"}) or soup.find(
                "td", string=re.compile(r"Situação|Situacao", re.I)
            )
            if status_tag:
                status = status_tag.get_text(strip=True)

            rows = soup.select("table#tabelaTodasMovimentacoes tr") or soup.select("tr.fundocinza1, tr.fundocinza2")
            for row in rows:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    data_text = cells[0].get_text(strip=True)
                    desc_text = cells[-1].get_text(" ", strip=True)
                    if data_text and desc_text:
                        movimentos.append({"data": data_text, "descricao": desc_text})
        else:
            date_pattern = re.compile(r"(\d{2}/\d{2}/\d{4})")
            status_match = re.search(r"Situação[^:]*:\s*([^<\n]+)", html, re.I)
            if status_match:
                status = status_match.group(1).strip()

            lines = html.split("\n")
            for line in lines:
                date_match = date_pattern.search(line)
                if date_match:
                    clean = re.sub(r"<[^>]+>", "", line).strip()
                    if clean:
                        movimentos.append({"data": date_match.group(1), "descricao": clean})

        return {"status": status, "movimentos": movimentos[:50]}

    def consultar_processo(self, cnj: str) -> dict:
        if not _HAS_REQUESTS:
            raise RuntimeError("requests library is not installed")

        cnj_clean = re.sub(r"[.\-/]", "", cnj)
        url = f"{_BASE_URL}/cpopg/show.do"
        params = {"processo.codigo": cnj, "processo.foro": "1"}

        try:
            resp = _requests.get(
                url,
                params=params,
                cookies=self.session_cookies,
                timeout=15,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            resp.raise_for_status()
            return self._parse_html(resp.text)
        except _requests.HTTPError as exc:
            raise RuntimeError(f"eSAJ HTTP error: {exc}") from exc
        except _requests.RequestException as exc:
            raise RuntimeError(f"eSAJ request failed: {exc}") from exc
