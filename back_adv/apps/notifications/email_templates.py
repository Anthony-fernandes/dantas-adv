from __future__ import annotations

from django.conf import settings


def _base(title: str, body_html: str, footer_note: str = "", office_name: str | None = None) -> str:
    """Layout base.

    Quando `office_name` é informado, a comunicação é DO ESCRITÓRIO: o cabeçalho
    destaca o nome do escritório e a plataforma aparece apenas como
    "Tecnologia fornecida por {brand}". Sem `office_name`, é comunicação
    administrativa da plataforma (brand em destaque).
    """
    brand = getattr(settings, "EMAIL_BRAND_NAME", "NimbusLaw")
    color = getattr(settings, "EMAIL_BRAND_COLOR", "#1d4ed8")
    base_url = getattr(settings, "FRONTEND_BASE_URL", "").rstrip("/")
    footer = footer_note or f"Você está recebendo este e-mail porque tem uma conta no {brand}."
    header_name = office_name or brand
    tech_line = (
        f"<p style='margin:6px 0 0;color:#ffffffb3;font-size:11px;'>Tecnologia fornecida por {brand}</p>"
        if office_name
        else ""
    )
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:{color};border-radius:12px 12px 0 0;padding:28px 32px;">
            <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">{header_name}</span>
            {tech_line}
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
            {body_html}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 0 0;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">{footer}</p>
            {"<p style='margin:8px 0 0;'><a href='" + base_url + "' style='color:#94a3b8;font-size:12px;'>Acessar o sistema</a></p>" if base_url else ""}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def invite_email(*, office_name: str, role_label: str, invite_url: str | None, token: str, expires_days: int = 7) -> tuple[str, str]:
    """Returns (subject, html_body)."""
    brand = getattr(settings, "EMAIL_BRAND_NAME", "NimbusLaw")
    subject = f"Você foi convidado para {office_name} — {brand}"

    cta = ""
    if invite_url:
        cta = f"""
        <div style="margin:28px 0;text-align:center;">
          <a href="{invite_url}" style="display:inline-block;background:#1d4ed8;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:-0.2px;">
            Aceitar convite
          </a>
        </div>
        <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
          Ou copie este link: <br/>
          <span style="font-family:monospace;font-size:12px;color:#475569;word-break:break-all;">{invite_url}</span>
        </p>"""
    else:
        cta = f"""
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Token do convite</p>
          <p style="margin:0;font-family:monospace;font-size:15px;color:#1e293b;font-weight:700;">{token}</p>
        </div>"""

    body = f"""
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.5px;">
      Você foi convidado!
    </h1>
    <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
      Você recebeu um convite para acessar o escritório <strong style="color:#0f172a;">{office_name}</strong>
      com a função <strong style="color:#0f172a;">{role_label}</strong>.
    </p>
    {cta}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
      ⏰ Este convite expira em <strong>{expires_days} dias</strong>.<br/>
      Se você não esperava este convite, pode ignorar este e-mail com segurança.
    </p>"""

    return subject, _base(subject, body, f"Você recebeu um convite do escritório {office_name}.", office_name=office_name)


def deadline_alert_email(*, user_name: str, deadline_description: str, due_date_str: str, process_cnj: str, days_until: int, office_name: str) -> tuple[str, str]:
    """Returns (subject, html_body) for deadline alert."""
    brand = getattr(settings, "EMAIL_BRAND_NAME", "NimbusLaw")
    urgency_color = "#dc2626" if days_until <= 1 else "#d97706" if days_until <= 3 else "#2563eb"
    urgency_label = "URGENTE — Vence hoje!" if days_until == 0 else f"Vence em {days_until} dia{'s' if days_until != 1 else ''}"
    subject = f"[{urgency_label}] Prazo: {deadline_description[:60]}"

    body = f"""
    <p style="margin:0 0 20px;color:#475569;font-size:15px;">Olá, <strong style="color:#0f172a;">{user_name}</strong>.</p>
    <div style="border-left:4px solid {urgency_color};background:#fafafa;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 4px;color:{urgency_color};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">{urgency_label}</p>
      <p style="margin:0;color:#0f172a;font-size:17px;font-weight:600;">{deadline_description}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;width:140px;">Vencimento</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;">{due_date_str}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:14px;">Processo (CNJ)</td>
        <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;">{process_cnj or '—'}</td>
      </tr>
    </table>
    <p style="margin:0;color:#94a3b8;font-size:13px;">Enviado pelo escritório <strong>{office_name}</strong> via {brand}.</p>"""

    return subject, _base(subject, body, office_name=office_name)


def hearing_alert_email(*, user_name: str, hearing_type: str, hearing_date_str: str, process_cnj: str, office_name: str) -> tuple[str, str]:
    subject = f"Audiência agendada: {hearing_type} em {hearing_date_str}"
    body = f"""
    <p style="margin:0 0 20px;color:#475569;font-size:15px;">Olá, <strong style="color:#0f172a;">{user_name}</strong>.</p>
    <div style="border-left:4px solid #7c3aed;background:#fafafa;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px;">
      <p style="margin:0 0 4px;color:#7c3aed;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Audiência agendada</p>
      <p style="margin:0;color:#0f172a;font-size:17px;font-weight:600;">{hearing_type}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;width:140px;">Data/Hora</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;">{hearing_date_str}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#64748b;font-size:14px;">Processo (CNJ)</td>
        <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;">{process_cnj or '—'}</td>
      </tr>
    </table>
    <p style="margin:0;color:#94a3b8;font-size:13px;">Enviado pelo escritório <strong>{office_name}</strong>.</p>"""
    return subject, _base(subject, body, office_name=office_name)


def welcome_email(*, user_name: str, office_name: str, login_url: str | None) -> tuple[str, str]:
    brand = getattr(settings, "EMAIL_BRAND_NAME", "NimbusLaw")
    subject = f"Bem-vindo ao {office_name} — {brand}"
    cta = f'<div style="margin:28px 0;text-align:center;"><a href="{login_url}" style="display:inline-block;background:#1d4ed8;color:#fff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">Acessar o sistema</a></div>' if login_url else ""
    body = f"""
    <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#0f172a;">Bem-vindo, {user_name}!</h1>
    <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.6;">
      Seu acesso ao escritório <strong style="color:#0f172a;">{office_name}</strong> foi ativado com sucesso.
      Você já pode entrar no sistema e começar a trabalhar.
    </p>
    {cta}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
      Caso tenha dúvidas, entre em contato com o administrador do escritório.
    </p>"""
    return subject, _base(subject, body, office_name=office_name)
