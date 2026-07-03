"""Validação e formatação do número unificado CNJ (Resolução CNJ nº 65/2008).

Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
  NNNNNNN  número sequencial do processo
  DD       dígito verificador (ISO 7064, módulo 97-10)
  AAAA     ano do ajuizamento
  J        segmento do Poder Judiciário (1-9)
  TR       tribunal do segmento
  OOOO     unidade de origem
"""
from __future__ import annotations

import re

CNJ_DIGITS_LEN = 20
_CNJ_RE = re.compile(r"^(\d{7})-?(\d{2})\.?(\d{4})\.?(\d)\.?(\d{2})\.?(\d{4})$")

SEGMENTS = {
    "1": "STF",
    "2": "CNJ",
    "3": "STJ",
    "4": "Justiça Federal",
    "5": "Justiça do Trabalho",
    "6": "Justiça Eleitoral",
    "7": "Justiça Militar da União",
    "8": "Justiça Estadual",
    "9": "Justiça Militar Estadual",
}


def strip_cnj(value: str) -> str:
    """Remove tudo que não for dígito."""
    return re.sub(r"\D", "", value or "")


def is_valid_cnj(value: str) -> bool:
    """Confere estrutura e dígito verificador (módulo 97-10)."""
    digits = strip_cnj(value)
    if len(digits) != CNJ_DIGITS_LEN:
        return False
    seq, dv, year, segment, court, origin = (
        digits[0:7], digits[7:9], digits[9:13], digits[13:14], digits[14:16], digits[16:20]
    )
    if segment == "0":
        return False
    if int(year) < 1900:
        return False
    # ISO 7064 mod 97-10: DV tal que (número completo com DV) % 97 == 1,
    # calculado sobre seq + year + segment + court + origin + "00"
    base = int(seq + year + segment + court + origin + "00")
    expected = 98 - (base % 97)
    return int(dv) == expected


def format_cnj(value: str) -> str:
    """Formata 20 dígitos como NNNNNNN-DD.AAAA.J.TR.OOOO. Retorna original se inválido em tamanho."""
    digits = strip_cnj(value)
    if len(digits) != CNJ_DIGITS_LEN:
        return value or ""
    return f"{digits[0:7]}-{digits[7:9]}.{digits[9:13]}.{digits[13:14]}.{digits[14:16]}.{digits[16:20]}"


def cnj_segment_label(value: str) -> str | None:
    digits = strip_cnj(value)
    if len(digits) != CNJ_DIGITS_LEN:
        return None
    return SEGMENTS.get(digits[13:14])
