from __future__ import annotations

import logging
import unicodedata
from typing import Any

from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import permissions, serializers
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import (
    LandingBlogPost,
    LandingDifferential,
    LandingLead,
    LandingLeadDeliveryLog,
    LandingNavigationLink,
    LandingPage,
    LandingProcessStep,
    LandingSiteSettings,
    LandingSocialLink,
    LandingTestimonial,
    Tenant,
)
from apps.core.permissions import IsOwnerOrAdmin, IsTenantMember
from apps.core.viewsets import TenantAuditedModelViewSet, TenantScopedModelViewSet
from apps.processes.models import LegalCause, ProcessArea

logger = logging.getLogger("nimbuslaw.request")


def split_recipients(raw: str | None) -> list[str]:
    values = str(raw or "").replace(";", ",").replace("\n", ",").split(",")
    out: list[str] = []
    for value in values:
        item = value.strip()
        if item and item not in out:
            out.append(item)
    return out


def build_file_url(request, file_field) -> str:
    if not file_field:
        return ""
    try:
        url = file_field.url
    except Exception:
        return ""
    if request is None:
        return url
    return request.build_absolute_uri(url)


def guess_process_area(name: str) -> str:
    normalized = str(name or "").strip().lower()
    if "trabalh" in normalized:
        return ProcessArea.TRABALHISTA
    if "tribut" in normalized:
        return ProcessArea.TRIBUTARIO
    if "crimin" in normalized:
        return ProcessArea.CRIMINAL
    if "empres" in normalized:
        return ProcessArea.EMPRESARIAL
    if "famil" in normalized:
        return ProcessArea.FAMILIA
    if "consum" in normalized:
        return ProcessArea.CONSUMIDOR
    return ProcessArea.CIVEL


def normalize_copy_value(value: Any) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or "").strip().lower())
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    return " ".join(normalized.split())


def should_replace_generic_copy(value: Any, markers: list[str]) -> bool:
    normalized = normalize_copy_value(value)
    if not normalized:
        return True
    return any(marker in normalized for marker in markers)


def ensure_landing_site_settings(tenant: Tenant) -> LandingSiteSettings:
    legacy_page = LandingPage.objects.filter(tenant=tenant).order_by("-updated_at").first()
    settings_obj, created = LandingSiteSettings.objects.get_or_create(
        tenant=tenant,
        defaults={
            "is_published": bool(getattr(legacy_page, "is_published", False)),
            "brand_name": getattr(legacy_page, "brand_name", "") or tenant.name or "",
            "brand_tagline": "Advocacia especializada",
            "theme": getattr(legacy_page, "theme", {}) or {},
            "hero_subtitle": "Advogado de direito trabalhista",
            "hero_title": getattr(legacy_page, "hero_title", "") or "Seu caso merece atenção, estratégia e defesa de verdade.",
            "hero_description": getattr(legacy_page, "hero_subtitle", "")
            or "Atendimento jurídico claro e próximo para analisar seu caso, orientar seus direitos e buscar a melhor solução.",
            "hero_primary_cta_label": getattr(legacy_page, "primary_cta_label", "") or "Agendar consulta",
            "hero_primary_cta_url": getattr(legacy_page, "primary_cta_url", "") or "#contato",
            "services_title": "Áreas em que podemos ajudar",
            "services_description": "Conheça as principais áreas em que o escritório pode atuar por você.",
            "about_title": getattr(legacy_page, "brand_name", "") or tenant.name or "",
            "about_description": "O escritório atua com seriedade, estratégia e atendimento próximo, oferecendo orientação jurídica personalizada em cada etapa do caso.",
            "differentials_title": "Atendimento com clareza, estratégia e confiança",
            "differentials_description": "Clareza, estratégia e acompanhamento responsável para você tomar decisões com segurança.",
            "contact_description": "Preencha o formulario e receba uma orientacao inicial.",
            "contact_recipient_emails": getattr(legacy_page, "contact_email", "") or tenant.email or "",
            "process_title": "Voce precisa de um advogado?",
            "process_description": "Da primeira conversa à definição da estratégia jurídica, você entende os próximos passos do seu caso.",
            "blog_title": "Conteúdo jurídico para orientar você",
            "blog_description": "Artigos, notícias e explicações objetivas sobre temas relevantes do dia a dia jurídico.",
            "testimonials_title": "O que dizem nossos clientes",
            "map_embed_url": (tenant.settings or {}).get("map_embed_url", ""),
            "final_cta_title": "Precisa de orientação jurídica?",
            "final_cta_description": "Fale com nossa equipe no WhatsApp e receba um primeiro direcionamento sobre o seu caso.",
            "final_cta_button_url": getattr(legacy_page, "contact_whatsapp", "") or tenant.phone or "",
            "footer_description": getattr(legacy_page, "hero_subtitle", "")
            or "Atendimento jurídico com seriedade, clareza e estratégia para defender seus direitos.",
            "footer_address": getattr(legacy_page, "contact_address", "") or "",
            "footer_phone": getattr(legacy_page, "contact_phone", "") or tenant.phone or "",
            "footer_email": getattr(legacy_page, "contact_email", None) or tenant.email or None,
            "seo_title": getattr(legacy_page, "seo_title", "") or tenant.name or "",
            "seo_description": getattr(legacy_page, "seo_description", "")
            or "Escritório de advocacia com atendimento jurídico próximo, estratégico e transparente para pessoas e empresas.",
        },
    )

    update_fields: list[str] = []

    generic_setting_updates = [
        ("hero_title", "Seu caso merece atenção, estratégia e defesa de verdade.", ["tecnologia e transparencia", "advocacia estrategica"]),
        ("hero_description", "Atendimento jurídico claro e próximo para analisar seu caso, orientar seus direitos e buscar a melhor solução.", ["solucoes juridicas completas", "acompanhamento em tempo real", "comunicacao proxima e estrategia clara"]),
        ("hero_primary_cta_label", "Agendar consulta", ["quero conversar com a equipe", "fale com a equipe"]),
        ("services_title", "Áreas em que podemos ajudar", ["deixe a nossa experiencia ser o seu guia"]),
        ("services_description", "Conheça as principais áreas em que o escritório pode atuar por você.", ["cards administraveis pela area interna"]),
        ("about_eyebrow", "Sobre o escritório", ["escritorio de advocacia"]),
        ("about_description", "O escritório atua com seriedade, estratégia e atendimento próximo, oferecendo orientação jurídica personalizada em cada etapa do caso.", ["apresente o escritorio", "forma de atendimento"]),
        ("differentials_eyebrow", "Nossos diferenciais", ["porque escolher-nos"]),
        ("differentials_title", "Atendimento com clareza, estratégia e confiança", ["experiencia e dedicacao ao cliente"]),
        ("differentials_description", "Clareza, estratégia e acompanhamento responsável para você tomar decisões com segurança.", ["explique porque o escritorio", "escolha certa"]),
        ("process_eyebrow", "Etapas do atendimento", ["como isso funciona"]),
        ("process_title", "Como funciona o atendimento", ["voce precisa de um advogado"]),
        ("process_description", "Da primeira conversa à definição da estratégia jurídica, você entende os próximos passos do seu caso.", ["explique como funciona o atendimento"]),
        ("blog_title", "Conteúdo jurídico para orientar você", ["conheca nosso blog de noticias"]),
        ("blog_description", "Artigos, notícias e explicações objetivas sobre temas relevantes do dia a dia jurídico.", ["ultimos artigos publicados pelo escritorio"]),
        ("final_cta_title", "Precisa de orientação jurídica?", ["qualidade global"]),
        ("final_cta_description", "Fale com nossa equipe no WhatsApp e receba um primeiro direcionamento sobre o seu caso.", ["clique no botao abaixo", "fale com a nossa equipe"]),
        ("footer_description", "Atendimento jurídico com seriedade, clareza e estratégia para defender seus direitos.", ["solucoes juridicas completas", "acompanhamento em tempo real", "atendimento consultivo"]),
        ("seo_description", "Escritório de advocacia com atendimento jurídico próximo, estratégico e transparente para pessoas e empresas.", ["landing page administravel"]),
    ]

    for field_name, replacement, markers in generic_setting_updates:
        current_value = getattr(settings_obj, field_name, "")
        if should_replace_generic_copy(current_value, markers) and current_value != replacement:
            setattr(settings_obj, field_name, replacement)
            update_fields.append(field_name)

    if update_fields:
        settings_obj.save(update_fields=list(dict.fromkeys(update_fields + ["updated_at"])))

    generic_differential_updates = [
        (["sistema proprio de gestao", "ia para analise", "gestao juridica"], "Scale", "Estratégia jurídica", "Cada caso é analisado com cuidado para definir a melhor linha de atuação."),
        (["portal do cliente", "andamento dos processos", "acompanhamento claro dos processos"], "Shield", "Transparência", "Explicamos riscos, prazos e próximos passos de forma objetiva."),
        (["equipe dedicada", "comunicacao agil", "equipe especializada e agil"], "Users", "Atendimento próximo", "Você recebe orientação clara e acompanhamento em cada etapa do caso."),
    ]

    for differential in LandingDifferential.objects.filter(tenant=tenant):
        differential_value = normalize_copy_value(differential.description)
        title_value = normalize_copy_value(differential.title)
        for markers, new_icon, new_title, new_description in generic_differential_updates:
            if any(marker in differential_value for marker in markers) or any(marker in title_value for marker in markers):
                differential_changed = False
                if differential.icon != new_icon:
                    differential.icon = new_icon
                    differential_changed = True
                if differential.title != new_title:
                    differential.title = new_title
                    differential_changed = True
                if differential.description != new_description:
                    differential.description = new_description
                    differential_changed = True
                if differential_changed:
                    differential.save(update_fields=["icon", "title", "description", "updated_at"])
                break

    if legacy_page:
        legacy_differentials = legacy_page.differentials or []
        if legacy_differentials and not LandingDifferential.objects.filter(tenant=tenant).exists():
            for index, item in enumerate(legacy_differentials):
                if not isinstance(item, dict):
                    continue
                LandingDifferential.objects.create(
                    tenant=tenant,
                    icon=str(item.get("icon") or "Shield"),
                    title=str(item.get("title") or f"Diferencial {index + 1}"),
                    description=str(item.get("desc") or item.get("description") or ""),
                    sort_order=index,
                    is_active=True,
                )

        legacy_testimonials = legacy_page.testimonials or []
        if legacy_testimonials and not LandingTestimonial.objects.filter(tenant=tenant).exists():
            for index, item in enumerate(legacy_testimonials):
                if not isinstance(item, dict):
                    continue
                LandingTestimonial.objects.create(
                    tenant=tenant,
                    name=str(item.get("name") or f"Cliente {index + 1}"),
                    role=str(item.get("role") or ""),
                    text=str(item.get("text") or item.get("desc") or ""),
                    rating=int(item.get("rating") or 5),
                    sort_order=index,
                    is_active=True,
                )

        legacy_areas = legacy_page.areas or []
        if legacy_areas and not LegalCause.objects.filter(tenant=tenant).exists():
            for index, item in enumerate(legacy_areas):
                if not isinstance(item, dict):
                    continue
                title = str(item.get("title") or item.get("name") or "").strip()
                if not title:
                    continue
                LegalCause.objects.get_or_create(
                    tenant=tenant,
                    name=title,
                    defaults={
                        "area": guess_process_area(title),
                        "description": str(item.get("desc") or item.get("description") or ""),
                        "landing_icon": str(item.get("icon") or "Scale"),
                        "landing_link": str(item.get("link") or ""),
                        "display_order": index,
                        "show_on_landing": True,
                        "is_active": True,
                    },
                )

    if not LandingNavigationLink.objects.filter(tenant=tenant).exists():
        defaults = [
            {"label": "Home", "url": "#inicio", "sort_order": 0},
            {"label": "Sobre", "url": "#sobre", "sort_order": 1},
            {"label": "Servicos", "url": "#servicos", "sort_order": 2},
            {"label": "Artigos", "url": "#artigos", "sort_order": 3},
            {"label": "Contato", "url": "#contato", "sort_order": 4},
        ]
        for item in defaults:
            LandingNavigationLink.objects.create(
                tenant=tenant,
                label=item["label"],
                url=item["url"],
                location=LandingNavigationLink.Location.BOTH,
                sort_order=item["sort_order"],
                open_in_new_tab=False,
                is_active=True,
            )

    return settings_obj


def resolve_public_site(slug: str | None):
    if slug:
        tenant = Tenant.objects.filter(slug=slug).first()
        if tenant is None:
            return None, None
        return tenant, ensure_landing_site_settings(tenant)

    settings_obj = (
        LandingSiteSettings.objects.select_related("tenant")
        .filter(is_published=True)
        .order_by("-updated_at")
        .first()
    )
    if settings_obj is not None:
        return settings_obj.tenant, settings_obj

    settings_obj = LandingSiteSettings.objects.select_related("tenant").order_by("-updated_at").first()
    if settings_obj is not None:
        return settings_obj.tenant, settings_obj

    legacy_page = LandingPage.objects.select_related("tenant").order_by("-updated_at").first()
    if legacy_page is not None:
        return legacy_page.tenant, ensure_landing_site_settings(legacy_page.tenant)

    tenant = Tenant.objects.order_by("created_at").first()
    if tenant is None:
        return None, None
    return tenant, ensure_landing_site_settings(tenant)


def company_payload(tenant: Tenant, settings_obj: LandingSiteSettings) -> dict[str, Any]:
    address_data = tenant.address or {}
    address_line1 = str(address_data.get("line1") or "").strip()
    city = str(address_data.get("city") or "").strip()
    state = str(address_data.get("state") or "").strip()
    merged_address = settings_obj.footer_address or ", ".join([part for part in [address_line1, city, state] if part])
    return {
        "id": str(tenant.id),
        "name": settings_obj.brand_name or tenant.name or "",
        "tagline": settings_obj.brand_tagline or "",
        "slug": tenant.slug or "",
        "logo_url": tenant.logo_url or "",
        "email": settings_obj.footer_email or tenant.email or "",
        "phone": settings_obj.footer_phone or tenant.phone or "",
        "address": merged_address or "",
        "address_line1": address_line1,
        "city": city,
        "state": state,
        "map_embed_url": settings_obj.map_embed_url or (tenant.settings or {}).get("map_embed_url", ""),
    }


def record_delivery_log(
    *,
    lead: LandingLead,
    direction: str,
    recipient: str,
    status: str,
    payload: dict[str, Any] | None = None,
    error_message: str = "",
    created_by=None,
) -> None:
    LandingLeadDeliveryLog.objects.create(
        tenant=lead.tenant,
        lead=lead,
        direction=direction,
        recipient=recipient,
        status=status,
        payload=payload or {},
        error_message=error_message,
        created_by=created_by,
    )


def send_lead_notification(lead: LandingLead, settings_obj: LandingSiteSettings) -> tuple[bool, str, str]:
    recipients = split_recipients(settings_obj.contact_recipient_emails)
    if not recipients:
        fallback = settings_obj.footer_email or lead.tenant.email or ""
        recipients = [fallback] if fallback else []
    if not recipients:
        record_delivery_log(
            lead=lead,
            direction=LandingLeadDeliveryLog.Direction.INBOUND_NOTIFICATION,
            recipient="",
            status=LandingLeadDeliveryLog.Status.SKIPPED,
            payload={"reason": "no_recipient"},
        )
        return False, "", ""

    subject = lead.subject or f"[Landing] Novo contato - {lead.tenant.name}"
    message = (
        f"Nome: {lead.name}\n"
        f"Email: {lead.email or '-'}\n"
        f"Telefone: {lead.phone or '-'}\n"
        f"Origem: {lead.source or '-'}\n\n"
        f"Mensagem:\n{lead.message or '-'}\n"
    )
    recipient_text = ", ".join(recipients)

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=None,
            recipient_list=recipients,
            fail_silently=False,
        )
        record_delivery_log(
            lead=lead,
            direction=LandingLeadDeliveryLog.Direction.INBOUND_NOTIFICATION,
            recipient=recipient_text,
            status=LandingLeadDeliveryLog.Status.SENT,
            payload={"subject": subject},
        )
        return True, "", recipient_text
    except Exception as exc:
        logger.warning("landing contact email failed for tenant=%s: %s", lead.tenant_id, exc)
        error_message = str(exc)
        record_delivery_log(
            lead=lead,
            direction=LandingLeadDeliveryLog.Direction.INBOUND_NOTIFICATION,
            recipient=recipient_text,
            status=LandingLeadDeliveryLog.Status.FAILED,
            payload={"subject": subject},
            error_message=error_message,
        )
        return False, error_message, recipient_text


def send_lead_reply(lead: LandingLead, actor=None) -> None:
    if not lead.email or not lead.response_message:
        record_delivery_log(
            lead=lead,
            direction=LandingLeadDeliveryLog.Direction.OUTBOUND_REPLY,
            recipient=lead.email or "",
            status=LandingLeadDeliveryLog.Status.SKIPPED,
            payload={"reason": "missing_email_or_response"},
            created_by=actor,
        )
        return

    subject = f"{lead.tenant.name}: resposta ao seu contato"
    try:
        send_mail(
            subject=subject,
            message=lead.response_message,
            from_email=None,
            recipient_list=[lead.email],
            fail_silently=False,
        )
        record_delivery_log(
            lead=lead,
            direction=LandingLeadDeliveryLog.Direction.OUTBOUND_REPLY,
            recipient=lead.email,
            status=LandingLeadDeliveryLog.Status.SENT,
            payload={"subject": subject},
            created_by=actor,
        )
    except Exception as exc:
        logger.warning("landing reply email failed for lead=%s: %s", lead.id, exc)
        record_delivery_log(
            lead=lead,
            direction=LandingLeadDeliveryLog.Direction.OUTBOUND_REPLY,
            recipient=lead.email,
            status=LandingLeadDeliveryLog.Status.FAILED,
            payload={"subject": subject},
            error_message=str(exc),
            created_by=actor,
        )


class LandingSiteSettingsAdminSerializer(serializers.ModelSerializer):
    hero_background_image_url = serializers.SerializerMethodField()
    about_image_url = serializers.SerializerMethodField()
    final_cta_background_image_url = serializers.SerializerMethodField()
    clear_hero_background_image = serializers.BooleanField(write_only=True, required=False, default=False)
    clear_about_image = serializers.BooleanField(write_only=True, required=False, default=False)
    clear_final_cta_background_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = LandingSiteSettings
        fields = (
            "id",
            "tenant",
            "is_published",
            "brand_name",
            "brand_tagline",
            "theme",
            "hero_enabled",
            "hero_subtitle",
            "hero_title",
            "hero_description",
            "hero_primary_cta_label",
            "hero_primary_cta_url",
            "hero_background_image",
            "hero_background_image_url",
            "hero_overlay_color",
            "hero_overlay_opacity",
            "clear_hero_background_image",
            "services_enabled",
            "services_eyebrow",
            "services_title",
            "services_description",
            "services_button_text",
            "about_enabled",
            "about_eyebrow",
            "about_title",
            "about_highlight",
            "about_description",
            "about_secondary_description",
            "about_image",
            "about_image_url",
            "clear_about_image",
            "differentials_enabled",
            "differentials_eyebrow",
            "differentials_title",
            "differentials_description",
            "contact_enabled",
            "contact_eyebrow",
            "contact_title",
            "contact_description",
            "contact_button_text",
            "contact_success_message",
            "contact_recipient_emails",
            "contact_send_email",
            "process_enabled",
            "process_eyebrow",
            "process_title",
            "process_description",
            "blog_enabled",
            "blog_eyebrow",
            "blog_title",
            "blog_description",
            "blog_button_text",
            "blog_button_url",
            "testimonials_enabled",
            "testimonials_eyebrow",
            "testimonials_title",
            "map_enabled",
            "map_embed_url",
            "final_cta_enabled",
            "final_cta_eyebrow",
            "final_cta_title",
            "final_cta_description",
            "final_cta_button_text",
            "final_cta_button_url",
            "final_cta_background_image",
            "final_cta_background_image_url",
            "clear_final_cta_background_image",
            "footer_enabled",
            "footer_description",
            "footer_address",
            "footer_phone",
            "footer_email",
            "footer_copyright",
            "client_portal_label",
            "client_portal_url",
            "internal_area_label",
            "internal_area_url",
            "seo_title",
            "seo_description",
            "seo_keywords",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "tenant", "created_at", "updated_at")

    def get_hero_background_image_url(self, obj: LandingSiteSettings):
        return build_file_url(self.context.get("request"), obj.hero_background_image)

    def get_about_image_url(self, obj: LandingSiteSettings):
        return build_file_url(self.context.get("request"), obj.about_image)

    def get_final_cta_background_image_url(self, obj: LandingSiteSettings):
        return build_file_url(self.context.get("request"), obj.final_cta_background_image)

    def update(self, instance, validated_data):
        if validated_data.pop("clear_hero_background_image", False):
            if instance.hero_background_image:
                instance.hero_background_image.delete(save=False)
            instance.hero_background_image = None
        if validated_data.pop("clear_about_image", False):
            if instance.about_image:
                instance.about_image.delete(save=False)
            instance.about_image = None
        if validated_data.pop("clear_final_cta_background_image", False):
            if instance.final_cta_background_image:
                instance.final_cta_background_image.delete(save=False)
            instance.final_cta_background_image = None
        return super().update(instance, validated_data)


class LandingSiteSettingsPublicSerializer(serializers.ModelSerializer):
    hero_background_image_url = serializers.SerializerMethodField()
    about_image_url = serializers.SerializerMethodField()
    final_cta_background_image_url = serializers.SerializerMethodField()

    class Meta:
        model = LandingSiteSettings
        fields = (
            "is_published",
            "brand_name",
            "brand_tagline",
            "theme",
            "hero_enabled",
            "hero_subtitle",
            "hero_title",
            "hero_description",
            "hero_primary_cta_label",
            "hero_primary_cta_url",
            "hero_background_image_url",
            "hero_overlay_color",
            "hero_overlay_opacity",
            "services_enabled",
            "services_eyebrow",
            "services_title",
            "services_description",
            "services_button_text",
            "about_enabled",
            "about_eyebrow",
            "about_title",
            "about_highlight",
            "about_description",
            "about_secondary_description",
            "about_image_url",
            "differentials_enabled",
            "differentials_eyebrow",
            "differentials_title",
            "differentials_description",
            "contact_enabled",
            "contact_eyebrow",
            "contact_title",
            "contact_description",
            "contact_button_text",
            "contact_success_message",
            "process_enabled",
            "process_eyebrow",
            "process_title",
            "process_description",
            "blog_enabled",
            "blog_eyebrow",
            "blog_title",
            "blog_description",
            "blog_button_text",
            "blog_button_url",
            "testimonials_enabled",
            "testimonials_eyebrow",
            "testimonials_title",
            "map_enabled",
            "map_embed_url",
            "final_cta_enabled",
            "final_cta_eyebrow",
            "final_cta_title",
            "final_cta_description",
            "final_cta_button_text",
            "final_cta_button_url",
            "final_cta_background_image_url",
            "footer_enabled",
            "footer_description",
            "footer_address",
            "footer_phone",
            "footer_email",
            "footer_copyright",
            "client_portal_label",
            "client_portal_url",
            "internal_area_label",
            "internal_area_url",
            "seo_title",
            "seo_description",
            "seo_keywords",
        )

    def get_hero_background_image_url(self, obj: LandingSiteSettings):
        return build_file_url(self.context.get("request"), obj.hero_background_image)

    def get_about_image_url(self, obj: LandingSiteSettings):
        return build_file_url(self.context.get("request"), obj.about_image)

    def get_final_cta_background_image_url(self, obj: LandingSiteSettings):
        return build_file_url(self.context.get("request"), obj.final_cta_background_image)


class LandingDifferentialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingDifferential
        fields = "__all__"
        read_only_fields = ("id", "tenant", "created_at", "updated_at")


class LandingProcessStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingProcessStep
        fields = "__all__"
        read_only_fields = ("id", "tenant", "created_at", "updated_at")


class LandingBlogPostAdminSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    clear_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = LandingBlogPost
        fields = (
            "id",
            "tenant",
            "title",
            "summary",
            "content",
            "image",
            "image_url",
            "clear_image",
            "author_name",
            "slug",
            "seo_title",
            "seo_description",
            "published_at",
            "sort_order",
            "is_published",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "tenant", "created_at", "updated_at")

    def get_image_url(self, obj: LandingBlogPost):
        return build_file_url(self.context.get("request"), obj.image)

    def update(self, instance, validated_data):
        if validated_data.pop("clear_image", False):
            if instance.image:
                instance.image.delete(save=False)
            instance.image = None
        return super().update(instance, validated_data)


class LandingBlogPostPublicSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = LandingBlogPost
        fields = (
            "id",
            "title",
            "summary",
            "content",
            "image_url",
            "author_name",
            "slug",
            "seo_title",
            "seo_description",
            "published_at",
        )

    def get_image_url(self, obj: LandingBlogPost):
        return build_file_url(self.context.get("request"), obj.image)


class LandingTestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingTestimonial
        fields = "__all__"
        read_only_fields = ("id", "tenant", "created_at", "updated_at")


class LandingSocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingSocialLink
        fields = "__all__"
        read_only_fields = ("id", "tenant", "created_at", "updated_at")


class LandingNavigationLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingNavigationLink
        fields = "__all__"
        read_only_fields = ("id", "tenant", "created_at", "updated_at")


class LandingLeadDeliveryLogSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LandingLeadDeliveryLog
        fields = (
            "id",
            "direction",
            "channel",
            "recipient",
            "status",
            "error_message",
            "payload",
            "created_by_name",
            "created_at",
        )

    def get_created_by_name(self, obj: LandingLeadDeliveryLog):
        return getattr(obj.created_by, "email", "") or ""


class LandingLeadAdminSerializer(serializers.ModelSerializer):
    responded_by_name = serializers.SerializerMethodField()
    delivery_logs = LandingLeadDeliveryLogSerializer(many=True, read_only=True)

    class Meta:
        model = LandingLead
        fields = (
            "id",
            "name",
            "email",
            "phone",
            "message",
            "source",
            "status",
            "subject",
            "email_sent",
            "email_error",
            "recipient_email",
            "responded_at",
            "responded_by",
            "responded_by_name",
            "response_message",
            "ip_address",
            "user_agent",
            "is_spam",
            "spam_reason",
            "created_at",
            "updated_at",
            "delivery_logs",
        )
        read_only_fields = (
            "id",
            "email_sent",
            "email_error",
            "recipient_email",
            "responded_at",
            "responded_by",
            "responded_by_name",
            "ip_address",
            "user_agent",
            "is_spam",
            "spam_reason",
            "created_at",
            "updated_at",
            "delivery_logs",
        )

    def get_responded_by_name(self, obj: LandingLead):
        return getattr(obj.responded_by, "email", "") or ""


class LandingPracticeAreaSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()
    link = serializers.SerializerMethodField()
    order = serializers.SerializerMethodField()

    class Meta:
        model = LegalCause
        fields = ("id", "title", "description", "icon", "link", "order")

    def get_title(self, obj: LegalCause):
        return obj.name or ""

    def get_description(self, obj: LegalCause):
        return obj.description or ""

    def get_icon(self, obj: LegalCause):
        return obj.landing_icon or "Scale"

    def get_link(self, obj: LegalCause):
        return obj.landing_link or ""

    def get_order(self, obj: LegalCause):
        return obj.display_order


class PublicContactMessageSerializer(serializers.Serializer):
    slug = serializers.CharField(required=False, allow_blank=False)
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=50)
    message = serializers.CharField(required=False, allow_blank=True)
    source = serializers.CharField(required=False, allow_blank=True, max_length=120, default="landing_public")
    subject = serializers.CharField(required=False, allow_blank=True, max_length=255)
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)
    started_at = serializers.DateTimeField(required=False, allow_null=True, write_only=True)


def detect_spam(payload: dict[str, Any], tenant: Tenant) -> tuple[bool, str]:
    if str(payload.get("website") or "").strip():
        return True, "honeypot"

    started_at = payload.get("started_at")
    if started_at is not None:
        elapsed = timezone.now() - started_at
        if elapsed.total_seconds() < 2:
            return True, "too_fast"

    email = str(payload.get("email") or "").strip()
    phone = str(payload.get("phone") or "").strip()
    message = str(payload.get("message") or "").strip()
    if not any([email, phone, message]):
        return True, "empty"

    duplicate_filter = LandingLead.objects.filter(
        tenant=tenant,
        created_at__gte=timezone.now() - timezone.timedelta(minutes=10),
    )
    if email:
        duplicate_filter = duplicate_filter.filter(email=email)
    elif phone:
        duplicate_filter = duplicate_filter.filter(phone=phone)
    else:
        duplicate_filter = duplicate_filter.filter(message=message[:80])
    if duplicate_filter.exists():
        return True, "duplicate_recent_contact"

    return False, ""


def build_public_landing_payload(request, tenant: Tenant, settings_obj: LandingSiteSettings) -> dict[str, Any]:
    company = company_payload(tenant, settings_obj)
    practice_areas = LegalCause.objects.filter(
        tenant=tenant,
        is_active=True,
        show_on_landing=True,
    ).order_by("display_order", "name")
    differentials = LandingDifferential.objects.filter(tenant=tenant, is_active=True).order_by("sort_order", "created_at")
    process_steps = LandingProcessStep.objects.filter(tenant=tenant, is_active=True).order_by("sort_order", "created_at")
    posts = LandingBlogPost.objects.filter(tenant=tenant, is_published=True).order_by("sort_order", "-published_at", "-created_at")[:3]
    testimonials = LandingTestimonial.objects.filter(tenant=tenant, is_active=True).order_by("sort_order", "created_at")
    social_links = LandingSocialLink.objects.filter(tenant=tenant, is_active=True).order_by("sort_order", "created_at")
    navigation_links = LandingNavigationLink.objects.filter(tenant=tenant, is_active=True).order_by("sort_order", "created_at")

    public_settings = LandingSiteSettingsPublicSerializer(settings_obj, context={"request": request}).data
    public_settings["map_embed_url"] = public_settings.get("map_embed_url") or company.get("map_embed_url", "")

    return {
        "company": company,
        "settings": public_settings,
        "landing": {
            "brand_name": company.get("name", ""),
            "logo_url": company.get("logo_url", ""),
            "hero_title": settings_obj.hero_title,
            "hero_subtitle": settings_obj.hero_description,
            "primary_cta_label": settings_obj.hero_primary_cta_label,
            "primary_cta_url": settings_obj.hero_primary_cta_url,
            "contact_phone": company.get("phone", ""),
            "contact_email": company.get("email", ""),
            "contact_address": company.get("address", ""),
            "differentials": LandingDifferentialSerializer(differentials, many=True).data,
        },
        "areas": LandingPracticeAreaSerializer(practice_areas, many=True).data,
        "practice_areas": LandingPracticeAreaSerializer(practice_areas, many=True).data,
        "differentials": LandingDifferentialSerializer(differentials, many=True).data,
        "process_steps": LandingProcessStepSerializer(process_steps, many=True).data,
        "posts": LandingBlogPostPublicSerializer(posts, many=True, context={"request": request}).data,
        "testimonials": LandingTestimonialSerializer(testimonials, many=True).data,
        "social_links": LandingSocialLinkSerializer(social_links, many=True).data,
        "navigation_links": LandingNavigationLinkSerializer(navigation_links, many=True).data,
    }


class LandingSiteSettingsManageView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTenantMember, IsOwnerOrAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        settings_obj = ensure_landing_site_settings(request.tenant)
        return Response(LandingSiteSettingsAdminSerializer(settings_obj, context={"request": request}).data)

    def patch(self, request):
        settings_obj = ensure_landing_site_settings(request.tenant)
        serializer = LandingSiteSettingsAdminSerializer(
            settings_obj,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(LandingSiteSettingsAdminSerializer(settings_obj, context={"request": request}).data)

    def put(self, request):
        settings_obj = ensure_landing_site_settings(request.tenant)
        serializer = LandingSiteSettingsAdminSerializer(
            settings_obj,
            data=request.data,
            partial=False,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(LandingSiteSettingsAdminSerializer(settings_obj, context={"request": request}).data)


class LandingDifferentialViewSet(TenantAuditedModelViewSet):
    queryset = LandingDifferential.objects.all()
    serializer_class = LandingDifferentialSerializer
    permission_classes = [IsTenantMember, IsOwnerOrAdmin]
    audit_enabled = True
    audit_entity_type = "LandingDifferential"
    filterset_fields = {"is_active": ["exact"]}
    search_fields = ["title", "description", "icon"]
    ordering_fields = ["sort_order", "title", "created_at", "updated_at"]
    ordering = ["sort_order", "created_at"]


class LandingProcessStepViewSet(TenantAuditedModelViewSet):
    queryset = LandingProcessStep.objects.all()
    serializer_class = LandingProcessStepSerializer
    permission_classes = [IsTenantMember, IsOwnerOrAdmin]
    audit_enabled = True
    audit_entity_type = "LandingProcessStep"
    filterset_fields = {"is_active": ["exact"]}
    search_fields = ["title", "description", "icon"]
    ordering_fields = ["sort_order", "title", "created_at", "updated_at"]
    ordering = ["sort_order", "created_at"]


class LandingBlogPostAdminViewSet(TenantAuditedModelViewSet):
    queryset = LandingBlogPost.objects.all()
    serializer_class = LandingBlogPostAdminSerializer
    permission_classes = [IsTenantMember, IsOwnerOrAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    audit_enabled = True
    audit_entity_type = "LandingBlogPost"
    filterset_fields = {"is_published": ["exact"]}
    search_fields = ["title", "summary", "content", "slug", "author_name"]
    ordering_fields = ["sort_order", "published_at", "created_at", "updated_at", "title"]
    ordering = ["sort_order", "-published_at", "-created_at"]


class LandingTestimonialAdminViewSet(TenantAuditedModelViewSet):
    queryset = LandingTestimonial.objects.all()
    serializer_class = LandingTestimonialSerializer
    permission_classes = [IsTenantMember, IsOwnerOrAdmin]
    audit_enabled = True
    audit_entity_type = "LandingTestimonial"
    filterset_fields = {"is_active": ["exact"], "rating": ["exact"]}
    search_fields = ["name", "role", "text"]
    ordering_fields = ["sort_order", "name", "created_at", "updated_at", "rating"]
    ordering = ["sort_order", "created_at"]


class LandingSocialLinkViewSet(TenantAuditedModelViewSet):
    queryset = LandingSocialLink.objects.all()
    serializer_class = LandingSocialLinkSerializer
    permission_classes = [IsTenantMember, IsOwnerOrAdmin]
    audit_enabled = True
    audit_entity_type = "LandingSocialLink"
    filterset_fields = {"is_active": ["exact"]}
    search_fields = ["label", "url", "icon"]
    ordering_fields = ["sort_order", "label", "created_at", "updated_at"]
    ordering = ["sort_order", "created_at"]


class LandingNavigationLinkViewSet(TenantAuditedModelViewSet):
    queryset = LandingNavigationLink.objects.all()
    serializer_class = LandingNavigationLinkSerializer
    permission_classes = [IsTenantMember, IsOwnerOrAdmin]
    audit_enabled = True
    audit_entity_type = "LandingNavigationLink"
    filterset_fields = {"is_active": ["exact"], "location": ["exact"]}
    search_fields = ["label", "url"]
    ordering_fields = ["sort_order", "label", "created_at", "updated_at"]
    ordering = ["sort_order", "created_at"]


class LandingLeadAdminViewSet(TenantScopedModelViewSet):
    queryset = LandingLead.objects.select_related("responded_by").prefetch_related("delivery_logs").all().order_by("-created_at")
    serializer_class = LandingLeadAdminSerializer
    permission_classes = [IsTenantMember, IsOwnerOrAdmin]
    http_method_names = ["get", "patch", "head", "options"]
    filterset_fields = {"status": ["exact"], "is_spam": ["exact"], "source": ["exact"]}
    search_fields = ["name", "email", "phone", "message", "response_message"]
    ordering_fields = ["created_at", "updated_at", "status", "name"]
    ordering = ["-created_at"]

    def perform_update(self, serializer):
        instance = self.get_object()
        previous_response = instance.response_message
        response_message = serializer.validated_data.get("response_message")

        extra: dict[str, Any] = {}
        if response_message:
            extra["responded_at"] = timezone.now()
            extra["responded_by"] = self.request.user
            if not serializer.validated_data.get("status"):
                extra["status"] = LandingLead.Status.RESPONDED

        lead = serializer.save(**extra)
        if response_message and response_message != previous_response:
            send_lead_reply(lead, actor=self.request.user)


class PublicLandingView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        slug = request.query_params.get("slug")
        tenant, settings_obj = resolve_public_site(slug)
        if tenant is None or settings_obj is None:
            return Response({"detail": "Landing page not found."}, status=404)
        return Response(build_public_landing_payload(request, tenant, settings_obj))


class PublicBlogPostListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        slug = request.query_params.get("slug")
        tenant, settings_obj = resolve_public_site(slug)
        if tenant is None or settings_obj is None:
            return Response({"detail": "Posts not found."}, status=404)
        queryset = (
            LandingBlogPost.objects.filter(tenant=tenant, is_published=True)
            .order_by("sort_order", "-published_at", "-created_at")
        )
        return Response(LandingBlogPostPublicSerializer(queryset, many=True, context={"request": request}).data)


class PublicTestimonialListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        slug = request.query_params.get("slug")
        tenant, settings_obj = resolve_public_site(slug)
        if tenant is None or settings_obj is None:
            return Response({"detail": "Testimonials not found."}, status=404)
        queryset = LandingTestimonial.objects.filter(tenant=tenant, is_active=True).order_by("sort_order", "created_at")
        return Response(LandingTestimonialSerializer(queryset, many=True).data)


class PublicContactMessageView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PublicContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        tenant, settings_obj = resolve_public_site(payload.get("slug"))
        if tenant is None or settings_obj is None:
            return Response({"detail": "Landing page not found."}, status=404)

        is_spam, spam_reason = detect_spam(payload, tenant)
        lead = LandingLead.objects.create(
            tenant=tenant,
            name=payload["name"],
            email=payload.get("email"),
            phone=payload.get("phone") or "",
            message=payload.get("message") or "",
            source=payload.get("source") or "landing_public",
            subject=payload.get("subject") or f"[Landing] Novo contato - {tenant.name}",
            status=LandingLead.Status.SPAM if is_spam else LandingLead.Status.NEW,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=str(request.META.get("HTTP_USER_AGENT") or "")[:1000],
            is_spam=is_spam,
            spam_reason=spam_reason,
        )

        email_sent = False
        email_error = ""
        recipient_email = ""
        if not is_spam and settings_obj.contact_send_email:
            email_sent, email_error, recipient_email = send_lead_notification(lead, settings_obj)
            lead.email_sent = email_sent
            lead.email_error = email_error
            lead.recipient_email = recipient_email
            lead.save(update_fields=["email_sent", "email_error", "recipient_email", "updated_at"])
        elif is_spam:
            record_delivery_log(
                lead=lead,
                direction=LandingLeadDeliveryLog.Direction.INBOUND_NOTIFICATION,
                recipient="",
                status=LandingLeadDeliveryLog.Status.SKIPPED,
                payload={"reason": spam_reason},
            )

        return Response(
            {
                "id": str(lead.id),
                "saved": True,
                "email_sent": email_sent,
                "email_error": email_error,
                "status": lead.status,
            },
            status=201,
        )
