from __future__ import annotations

import io
from dataclasses import dataclass
from typing import Any

from django.template import Context, Template
from django.utils import timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

from apps.accounts.models import User
from apps.clients.models import Client
from apps.core.models import Tenant
from apps.processes.models import Process


@dataclass
class RenderContext:
    tenant: Tenant
    user: User
    client: Client | None = None
    process: Process | None = None


def build_template_context(ctx: RenderContext) -> dict[str, Any]:
    """Context seguro e previsível para templates.

    Mantemos um dicionário plano com sub-objetos para reduzir acoplamento.
    """

    tenant = ctx.tenant
    user = ctx.user
    client = ctx.client
    process = ctx.process
    now = timezone.now()

    return {
        'now': now,
        'tenant': {
            'id': str(tenant.id),
            'name': tenant.name,
            'email': getattr(tenant, 'email', None),
            'phone': getattr(tenant, 'phone', None),
        },
        'user': {
            'id': str(user.id),
            'email': user.email,
            'full_name': getattr(getattr(user, 'profile', None), 'full_name', '') if hasattr(user, 'profile') else '',
        },
        'client': None if not client else {
            'id': str(client.id),
            'name': getattr(client, 'name', '') or getattr(client, 'full_name', ''),
            'doc': getattr(client, 'doc', None) or getattr(client, 'cpf', None) or getattr(client, 'cnpj', None),
            'email': getattr(client, 'email', None),
            'phone': getattr(client, 'whatsapp', None) or getattr(client, 'phone', None),
        },
        'process': None if not process else {
            'id': str(process.id),
            'cnj': getattr(process, 'cnj', None),
            'title': getattr(process, 'title', None) or getattr(process, 'subject', None),
            'status': getattr(process, 'status', None),
        },
    }


def render_rich_text(template_str: str, ctx: dict[str, Any]) -> str:
    """Renderiza usando o Django Template Engine.

    Sintaxe: {{ tenant.name }}, {{ client.name }}, {{ process.cnj }}...
    """

    tpl = Template(template_str)
    return tpl.render(Context(ctx))


def htmlish_to_pdf_bytes(title: str, rendered: str) -> bytes:
    """Gera PDF via ReportLab.

    Aceita um subset simples de tags HTML suportadas pelo Paragraph.
    """

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, title=title)
    styles = getSampleStyleSheet()
    story = []

    # split por linhas em branco -> parágrafos
    blocks = [b.strip() for b in rendered.replace('\r\n', '\n').split('\n\n') if b.strip()]
    for block in blocks:
        # converte quebras de linha em <br/>
        html = block.replace('\n', '<br/>')
        story.append(Paragraph(html, styles['Normal']))
        story.append(Spacer(1, 12))

    doc.build(story)
    return buf.getvalue()
