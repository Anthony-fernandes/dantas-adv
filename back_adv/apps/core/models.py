import os
import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def deleted(self):
        return self.filter(deleted_at__isnull=False)


class SoftDeleteModel(models.Model):
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="deleted_%(class)s_set",
    )

    objects = SoftDeleteQuerySet.as_manager()

    class Meta:
        abstract = True

    def soft_delete(self, *, user=None):
        from django.utils import timezone

        if self.deleted_at:
            return
        self.deleted_at = timezone.now()
        if hasattr(self, "deleted_by"):
            self.deleted_by = user
        self.save(update_fields=["deleted_at", "deleted_by"])


class Tenant(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, null=True, blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="owned_tenants",
    )
    cnpj = models.CharField(max_length=32, blank=True, null=True)
    address = models.JSONField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True)
    settings = models.JSONField(default=dict, blank=True)

    def ensure_slug(self):
        if self.slug:
            return
        base = slugify(self.name) or "tenant"
        slug = base
        index = 2
        while Tenant.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{index}"
            index += 1
        self.slug = slug
        self.save(update_fields=["slug"])

    def __str__(self) -> str:
        return self.name


class AuditEvent(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        "Tenant",
        on_delete=models.CASCADE,
        related_name="audit_events",
        null=True,
        blank=True,
        help_text="Nulo para eventos de conta (login/logout) anteriores à seleção de tenant.",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_events",
    )

    event_type = models.CharField(max_length=64)
    entity_type = models.CharField(max_length=64)
    entity_id = models.UUIDField(null=True, blank=True)
    summary = models.CharField(max_length=255, blank=True, default="")
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["tenant", "entity_type", "entity_id"]),
            models.Index(fields=["tenant", "event_type", "created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.tenant_id} {self.event_type} {self.entity_type}:{self.entity_id}"


def landing_asset_upload_to(instance, filename: str) -> str:
    extension = os.path.splitext(filename or "")[1] or ""
    tenant_id = getattr(instance, "tenant_id", None)
    if tenant_id is None:
        settings_obj = getattr(instance, "settings", None)
        tenant_id = getattr(settings_obj, "tenant_id", None)
    folder = instance.__class__.__name__.lower()
    return f"landing/{tenant_id or 'shared'}/{folder}/{uuid.uuid4().hex}{extension}"


def default_landing_areas():
    return [
        {"title": "Direito Civil", "desc": "Acoes de cobranca, indenizacoes e contratos."},
        {"title": "Direito Trabalhista", "desc": "Reclamacoes trabalhistas e consultoria."},
        {"title": "Direito Tributario", "desc": "Planejamento fiscal e contencioso."},
        {"title": "Direito Criminal", "desc": "Defesa criminal e habeas corpus."},
        {"title": "Direito Empresarial", "desc": "Societario, M&A e compliance."},
        {"title": "Direito de Familia", "desc": "Divorcio, inventario e guarda."},
    ]


def default_landing_differentials():
    return [
        {
            "icon": "Scale",
            "title": "Estratégia jurídica",
            "desc": "Cada caso é analisado com cuidado para definir a melhor linha de atuação.",
        },
        {
            "icon": "Shield",
            "title": "Transparência",
            "desc": "Explicamos riscos, prazos e próximos passos de forma objetiva.",
        },
        {
            "icon": "Users",
            "title": "Atendimento próximo",
            "desc": "Você recebe orientação clara e acompanhamento em cada etapa do caso.",
        },
    ]


class LandingPage(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField("Tenant", on_delete=models.CASCADE, related_name="landing_page")

    is_published = models.BooleanField(default=False)
    brand_name = models.CharField(max_length=255, blank=True, default="")
    hero_title = models.CharField(max_length=255, blank=True, default="")
    hero_subtitle = models.TextField(blank=True, default="")
    primary_cta_label = models.CharField(max_length=120, blank=True, default="Agendar Consulta")
    primary_cta_url = models.CharField(max_length=255, blank=True, default="#contato")
    secondary_cta_label = models.CharField(max_length=120, blank=True, default="Falar no WhatsApp")
    secondary_cta_url = models.CharField(max_length=255, blank=True, default="#contato")

    areas = models.JSONField(default=default_landing_areas, blank=True)
    differentials = models.JSONField(default=default_landing_differentials, blank=True)
    testimonials = models.JSONField(default=list, blank=True)
    team = models.JSONField(default=list, blank=True)
    faqs = models.JSONField(default=list, blank=True)

    contact_phone = models.CharField(max_length=50, blank=True, default="")
    contact_email = models.EmailField(blank=True, null=True)
    contact_address = models.CharField(max_length=255, blank=True, default="")
    contact_whatsapp = models.CharField(max_length=50, blank=True, default="")

    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.CharField(max_length=300, blank=True, default="")
    theme = models.JSONField(default=dict, blank=True)

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_landing_pages",
    )

    def __str__(self) -> str:
        return f"Landing {self.tenant.name}"


class LandingSiteSettings(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField("Tenant", on_delete=models.CASCADE, related_name="landing_site_settings")

    is_published = models.BooleanField(default=False)
    brand_name = models.CharField(max_length=255, blank=True, default="")
    brand_tagline = models.CharField(max_length=255, blank=True, default="Advocacia especializada")
    theme = models.JSONField(default=dict, blank=True)

    hero_enabled = models.BooleanField(default=True)
    hero_subtitle = models.CharField(max_length=255, blank=True, default="")
    hero_title = models.CharField(max_length=255, blank=True, default="")
    hero_description = models.TextField(blank=True, default="")
    hero_primary_cta_label = models.CharField(max_length=120, blank=True, default="Agendar consulta")
    hero_primary_cta_url = models.CharField(max_length=255, blank=True, default="#contato")
    hero_background_image = models.ImageField(upload_to=landing_asset_upload_to, blank=True, null=True)
    hero_overlay_color = models.CharField(max_length=30, blank=True, default="#081d36")
    hero_overlay_opacity = models.DecimalField(max_digits=4, decimal_places=2, default=0.74)

    services_enabled = models.BooleanField(default=True)
    services_eyebrow = models.CharField(max_length=255, blank=True, default="Áreas de atuação")
    services_title = models.CharField(max_length=255, blank=True, default="")
    services_description = models.TextField(blank=True, default="")
    services_button_text = models.CharField(max_length=120, blank=True, default="Fale pelo WhatsApp")

    about_enabled = models.BooleanField(default=True)
    about_eyebrow = models.CharField(max_length=255, blank=True, default="Sobre o escritório")
    about_title = models.CharField(max_length=255, blank=True, default="")
    about_highlight = models.CharField(max_length=255, blank=True, default="")
    about_description = models.TextField(blank=True, default="")
    about_secondary_description = models.TextField(blank=True, default="")
    about_image = models.ImageField(upload_to=landing_asset_upload_to, blank=True, null=True)

    differentials_enabled = models.BooleanField(default=True)
    differentials_eyebrow = models.CharField(max_length=255, blank=True, default="Nossos diferenciais")
    differentials_title = models.CharField(max_length=255, blank=True, default="")
    differentials_description = models.TextField(blank=True, default="")

    contact_enabled = models.BooleanField(default=True)
    contact_eyebrow = models.CharField(max_length=255, blank=True, default="Entre em Contato")
    contact_title = models.CharField(max_length=255, blank=True, default="Agendar consulta")
    contact_description = models.TextField(blank=True, default="")
    contact_button_text = models.CharField(max_length=120, blank=True, default="Enviar mensagem")
    contact_success_message = models.CharField(
        max_length=255,
        blank=True,
        default="Mensagem enviada com sucesso.",
    )
    contact_recipient_emails = models.TextField(blank=True, default="")
    contact_send_email = models.BooleanField(default=True)

    process_enabled = models.BooleanField(default=True)
    process_eyebrow = models.CharField(max_length=255, blank=True, default="Etapas do atendimento")
    process_title = models.CharField(max_length=255, blank=True, default="")
    process_description = models.TextField(blank=True, default="")

    blog_enabled = models.BooleanField(default=True)
    blog_eyebrow = models.CharField(max_length=255, blank=True, default="Artigos e informativos")
    blog_title = models.CharField(max_length=255, blank=True, default="")
    blog_description = models.TextField(blank=True, default="")
    blog_button_text = models.CharField(max_length=120, blank=True, default="Veja mais")
    blog_button_url = models.CharField(max_length=255, blank=True, default="#artigos")

    testimonials_enabled = models.BooleanField(default=True)
    testimonials_eyebrow = models.CharField(max_length=255, blank=True, default="Depoimentos")
    testimonials_title = models.CharField(max_length=255, blank=True, default="")

    map_enabled = models.BooleanField(default=True)
    map_embed_url = models.CharField(max_length=500, blank=True, default="")

    final_cta_enabled = models.BooleanField(default=True)
    final_cta_eyebrow = models.CharField(max_length=255, blank=True, default="Precisa de ajuda?")
    final_cta_title = models.CharField(max_length=255, blank=True, default="")
    final_cta_description = models.TextField(blank=True, default="")
    final_cta_button_text = models.CharField(max_length=120, blank=True, default="Fale pelo WhatsApp")
    final_cta_button_url = models.CharField(max_length=255, blank=True, default="")
    final_cta_background_image = models.ImageField(upload_to=landing_asset_upload_to, blank=True, null=True)

    footer_enabled = models.BooleanField(default=True)
    footer_description = models.TextField(blank=True, default="")
    footer_address = models.CharField(max_length=255, blank=True, default="")
    footer_phone = models.CharField(max_length=50, blank=True, default="")
    footer_email = models.EmailField(blank=True, null=True)
    footer_copyright = models.CharField(max_length=255, blank=True, default="")

    client_portal_label = models.CharField(max_length=120, blank=True, default="Area do Cliente")
    client_portal_url = models.CharField(max_length=255, blank=True, default="/portal/login")
    internal_area_label = models.CharField(max_length=120, blank=True, default="Area Interna")
    internal_area_url = models.CharField(max_length=255, blank=True, default="/app/login")

    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.CharField(max_length=300, blank=True, default="")
    seo_keywords = models.CharField(max_length=300, blank=True, default="")

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_landing_site_settings",
    )

    class Meta:
        verbose_name = "Landing Site Settings"
        verbose_name_plural = "Landing Site Settings"

    def __str__(self) -> str:
        return f"CMS {self.tenant.name}"


class LandingDifferential(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="landing_differentials")
    icon = models.CharField(max_length=64, blank=True, default="Shield")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "created_at"]
        indexes = [
            models.Index(fields=["tenant", "sort_order"]),
            models.Index(fields=["tenant", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.title


class LandingProcessStep(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="landing_process_steps")
    icon = models.CharField(max_length=64, blank=True, default="CheckCircle2")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "created_at"]
        indexes = [
            models.Index(fields=["tenant", "sort_order"]),
            models.Index(fields=["tenant", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.title


class LandingBlogPost(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="landing_blog_posts")
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True, default="")
    content = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to=landing_asset_upload_to, blank=True, null=True)
    author_name = models.CharField(max_length=255, blank=True, default="")
    slug = models.SlugField(max_length=255, blank=True)
    seo_title = models.CharField(max_length=255, blank=True, default="")
    seo_description = models.CharField(max_length=300, blank=True, default="")
    published_at = models.DateTimeField(null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["sort_order", "-published_at", "-created_at"]
        unique_together = (("tenant", "slug"),)
        indexes = [
            models.Index(fields=["tenant", "is_published", "published_at"]),
            models.Index(fields=["tenant", "slug"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or "artigo"
            slug = base
            index = 2
            while LandingBlogPost.objects.filter(tenant=self.tenant, slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{index}"
                index += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class LandingTestimonial(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="landing_testimonials")
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255, blank=True, default="")
    text = models.TextField(blank=True, default="")
    rating = models.PositiveSmallIntegerField(default=5)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "created_at"]
        indexes = [
            models.Index(fields=["tenant", "sort_order"]),
            models.Index(fields=["tenant", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.name


class LandingSocialLink(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="landing_social_links")
    label = models.CharField(max_length=120)
    url = models.CharField(max_length=255)
    icon = models.CharField(max_length=64, blank=True, default="Globe")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "created_at"]
        indexes = [
            models.Index(fields=["tenant", "sort_order"]),
            models.Index(fields=["tenant", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.label


class LandingNavigationLink(TimeStampedModel):
    class Location(models.TextChoices):
        HEADER = "HEADER", "Header"
        FOOTER = "FOOTER", "Footer"
        BOTH = "BOTH", "Both"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="landing_navigation_links")
    label = models.CharField(max_length=120)
    url = models.CharField(max_length=255)
    location = models.CharField(max_length=20, choices=Location.choices, default=Location.BOTH)
    sort_order = models.PositiveIntegerField(default=0)
    open_in_new_tab = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["sort_order", "created_at"]
        indexes = [
            models.Index(fields=["tenant", "location", "sort_order"]),
            models.Index(fields=["tenant", "is_active"]),
        ]

    def __str__(self) -> str:
        return self.label


class LandingLead(TimeStampedModel):
    class Status(models.TextChoices):
        NEW = "new", "Novo"
        READ = "read", "Lido"
        RESPONDED = "responded", "Respondido"
        SPAM = "spam", "Spam"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="landing_leads")
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, default="")
    message = models.TextField(blank=True, default="")
    source = models.CharField(max_length=120, blank=True, default="landing_contact")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    subject = models.CharField(max_length=255, blank=True, default="")
    email_sent = models.BooleanField(default=False)
    email_error = models.TextField(blank=True, default="")
    recipient_email = models.CharField(max_length=500, blank=True, default="")
    responded_at = models.DateTimeField(null=True, blank=True)
    responded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="responded_landing_leads",
    )
    response_message = models.TextField(blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    is_spam = models.BooleanField(default=False)
    spam_reason = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["tenant", "email"]),
            models.Index(fields=["tenant", "status", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.tenant.name}: {self.name}"


class LandingLeadDeliveryLog(TimeStampedModel):
    class Direction(models.TextChoices):
        INBOUND_NOTIFICATION = "inbound_notification", "Inbound notification"
        OUTBOUND_REPLY = "outbound_reply", "Outbound reply"

    class Status(models.TextChoices):
        SENT = "sent", "Sent"
        FAILED = "failed", "Failed"
        SKIPPED = "skipped", "Skipped"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="landing_lead_delivery_logs")
    lead = models.ForeignKey("LandingLead", on_delete=models.CASCADE, related_name="delivery_logs")
    direction = models.CharField(max_length=32, choices=Direction.choices)
    channel = models.CharField(max_length=32, default="email")
    recipient = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SENT)
    error_message = models.TextField(blank=True, default="")
    payload = models.JSONField(default=dict, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_landing_lead_delivery_logs",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["lead", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.lead_id} {self.direction} {self.status}"


class CalendarEvent(TimeStampedModel, SoftDeleteModel):
    class Kind(models.TextChoices):
        EVENT = "EVENT", "Evento"
        HEARING = "HEARING", "Audiencia"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="calendar_events")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField(default=False)
    location = models.CharField(max_length=255, blank=True, default="")
    color = models.CharField(max_length=20, blank=True, default="")
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.EVENT)

    class Recurrence(models.TextChoices):
        NONE = "none", "Sem recorrência"
        DAILY = "daily", "Diária"
        WEEKLY = "weekly", "Semanal"
        MONTHLY = "monthly", "Mensal"
        YEARLY = "yearly", "Anual"

    recurrence = models.CharField(max_length=10, choices=Recurrence.choices, default=Recurrence.NONE)
    recurrence_until = models.DateField(null=True, blank=True, help_text="Última data em que a recorrência gera ocorrência.")
    process_id_ref = models.UUIDField(null=True, blank=True)
    hearing_id_ref = models.UUIDField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_calendar_events",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_calendar_events",
    )

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "start_at"]),
            models.Index(fields=["tenant", "kind", "start_at"]),
        ]
        ordering = ["start_at"]

    def __str__(self) -> str:
        return self.title


class WorkspaceState(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey("Tenant", on_delete=models.CASCADE, related_name="workspace_states")
    namespace = models.CharField(max_length=64)
    scope_key = models.CharField(max_length=128, blank=True, default="")
    item_key = models.CharField(max_length=128)
    payload = models.JSONField(default=dict, blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_workspace_states",
    )

    class Meta:
        unique_together = (("tenant", "namespace", "scope_key", "item_key"),)
        indexes = [
            models.Index(fields=["tenant", "namespace", "scope_key"]),
            models.Index(fields=["tenant", "namespace", "updated_at"]),
        ]
        ordering = ["namespace", "scope_key", "item_key"]

    def __str__(self) -> str:
        scope = f" [{self.scope_key}]" if self.scope_key else ""
        return f"{self.tenant_id} {self.namespace}{scope}:{self.item_key}"
