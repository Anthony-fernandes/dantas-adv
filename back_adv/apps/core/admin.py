from django.contrib import admin

from .models import (
    AuditEvent,
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
    WorkspaceState,
)


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "owner", "cnpj", "email", "phone", "created_at")
    search_fields = ("name", "slug", "cnpj", "email", "owner__email")
    list_filter = ("created_at",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("created_at", "tenant", "event_type", "entity_type", "entity_id", "actor")
    list_filter = ("tenant", "event_type", "entity_type")
    search_fields = ("summary", "entity_type", "event_type", "entity_id", "payload")


@admin.register(LandingPage)
class LandingPageAdmin(admin.ModelAdmin):
    list_display = ("tenant", "is_published", "brand_name", "updated_at", "updated_by")
    list_filter = ("is_published", "updated_at")
    search_fields = ("tenant__name", "tenant__slug", "brand_name", "hero_title")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LandingSiteSettings)
class LandingSiteSettingsAdmin(admin.ModelAdmin):
    list_display = ("tenant", "is_published", "brand_name", "updated_at", "updated_by")
    list_filter = ("is_published", "updated_at")
    search_fields = ("tenant__name", "tenant__slug", "brand_name", "hero_title", "seo_title")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LandingDifferential)
class LandingDifferentialAdmin(admin.ModelAdmin):
    list_display = ("tenant", "title", "icon", "sort_order", "is_active", "updated_at")
    list_filter = ("tenant", "is_active")
    search_fields = ("title", "description")
    ordering = ("tenant", "sort_order", "title")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LandingProcessStep)
class LandingProcessStepAdmin(admin.ModelAdmin):
    list_display = ("tenant", "title", "icon", "sort_order", "is_active", "updated_at")
    list_filter = ("tenant", "is_active")
    search_fields = ("title", "description")
    ordering = ("tenant", "sort_order", "title")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LandingBlogPost)
class LandingBlogPostAdmin(admin.ModelAdmin):
    list_display = ("tenant", "title", "slug", "author_name", "is_published", "published_at", "sort_order")
    list_filter = ("tenant", "is_published")
    search_fields = ("title", "summary", "content", "slug", "author_name")
    ordering = ("tenant", "sort_order", "-published_at")
    readonly_fields = ("created_at", "updated_at")
    prepopulated_fields = {"slug": ("title",)}


@admin.register(LandingTestimonial)
class LandingTestimonialAdmin(admin.ModelAdmin):
    list_display = ("tenant", "name", "rating", "sort_order", "is_active", "updated_at")
    list_filter = ("tenant", "is_active", "rating")
    search_fields = ("name", "role", "text")
    ordering = ("tenant", "sort_order", "name")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LandingSocialLink)
class LandingSocialLinkAdmin(admin.ModelAdmin):
    list_display = ("tenant", "label", "icon", "sort_order", "is_active")
    list_filter = ("tenant", "is_active")
    search_fields = ("label", "url", "icon")
    ordering = ("tenant", "sort_order", "label")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LandingNavigationLink)
class LandingNavigationLinkAdmin(admin.ModelAdmin):
    list_display = ("tenant", "label", "location", "sort_order", "open_in_new_tab", "is_active")
    list_filter = ("tenant", "location", "is_active")
    search_fields = ("label", "url")
    ordering = ("tenant", "sort_order", "label")
    readonly_fields = ("created_at", "updated_at")


@admin.register(LandingLead)
class LandingLeadAdmin(admin.ModelAdmin):
    list_display = ("created_at", "tenant", "name", "email", "phone", "status", "source", "email_sent", "is_spam")
    list_filter = ("tenant", "source", "status", "email_sent", "is_spam")
    search_fields = ("name", "email", "phone", "message", "response_message")
    readonly_fields = ("created_at", "updated_at", "responded_at")


@admin.register(LandingLeadDeliveryLog)
class LandingLeadDeliveryLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "tenant", "lead", "direction", "channel", "recipient", "status")
    list_filter = ("tenant", "direction", "channel", "status")
    search_fields = ("recipient", "error_message", "payload")
    readonly_fields = ("created_at", "updated_at")


@admin.register(WorkspaceState)
class WorkspaceStateAdmin(admin.ModelAdmin):
    list_display = ("tenant", "namespace", "scope_key", "item_key", "updated_at", "updated_by")
    list_filter = ("tenant", "namespace", "updated_at")
    search_fields = ("namespace", "scope_key", "item_key", "payload")
    readonly_fields = ("created_at", "updated_at")
