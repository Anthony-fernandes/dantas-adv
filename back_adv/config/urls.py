from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.api import (
    AcceptLGPDView,
    AccessControlTypesView,
    EmployeePositionViewSet,
    EmployeeViewSet,
    MeView,
    TenantViewSet,
    UserViewSet,
)
from apps.accounts.jwt import EmailOrUsernameTokenObtainPairSerializer
from apps.accounts.saas_api import (
    AcceptInviteView,
    LoginView,
    LogoutView,
    SuperAdminCompanyDetailView,
    SuperAdminCompanyView,
    SuperAdminUserDetailView,
    SuperAdminUserView,
    TenantInviteView,
    TenantOnboardingView,
    TenantsMyView,
)
from apps.clients.api import ClientViewSet
from apps.core.calendar_api import CalendarEventViewSet
from apps.core.dashboard_api import LegalDashboardView
from apps.core.export_api import TenantExportView
from apps.core.landing_api import (
    LandingPageManageView,
    PublicContactView,
    PublicLandingLeadCreateView,
    PublicLandingPageView,
    PublicSiteLeadView,
    PublicSiteView,
    PublicTenantListView,
)
from apps.core.landing_cms_api import (
    LandingBlogPostAdminViewSet,
    LandingDifferentialViewSet,
    LandingLeadAdminViewSet,
    LandingNavigationLinkViewSet,
    LandingProcessStepViewSet,
    LandingSiteSettingsManageView,
    LandingSocialLinkViewSet,
    LandingTestimonialAdminViewSet,
    PublicBlogPostListView,
    PublicContactMessageView,
    PublicLandingView,
    PublicTestimonialListView,
)
from apps.core.portal_api import (
    PortalDashboardView,
    PortalDocumentsView,
    PortalMeView,
    PortalMessagesView,
    PortalProcessDetailView,
    PortalProcessListView,
    PortalTimelineView,
)
from apps.core.workspace_state_api import WorkspaceStateRecordView, WorkspaceStateView
from apps.documents.api import ContractViewSet, DocumentViewSet, JobPositionViewSet, LegalTemplateViewSet, ProcessRichDocumentViewSet
from apps.finance.api import (
    AccountsPayableViewSet,
    AccountsReceivableViewSet,
    FinanceReportView,
    InvoiceViewSet,
    PaymentViewSet,
    ReceivableInstallmentViewSet,
)
from apps.chat.api import ChatMessageViewSet
from apps.notifications.api import NotificationViewSet
from apps.processes.api import DeadlineViewSet, HearingViewSet, LegalCauseViewSet, MovementViewSet, ProcessViewSet, TaskViewSet, TimeEntryViewSet


class EmailOrUsernameTokenView(TokenObtainPairView):
    serializer_class = EmailOrUsernameTokenObtainPairSerializer


router = DefaultRouter()
router.register(r"tenants", TenantViewSet, basename="tenant")
router.register(r"users", UserViewSet, basename="user")
router.register(r"employee-positions", EmployeePositionViewSet, basename="employee-position")
router.register(r"employees", EmployeeViewSet, basename="employee")
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"processes", ProcessViewSet, basename="process")
router.register(r"causes", LegalCauseViewSet, basename="cause")
router.register(r"movements", MovementViewSet, basename="movement")
router.register(r"deadlines", DeadlineViewSet, basename="deadline")
router.register(r"hearings", HearingViewSet, basename="hearing")
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"time-entries", TimeEntryViewSet, basename="time-entry")
router.register(r"accounts-receivable", AccountsReceivableViewSet, basename="accountsreceivable")
router.register(r"receivable-installments", ReceivableInstallmentViewSet, basename="receivableinstallment")
router.register(r"accounts-payable", AccountsPayableViewSet, basename="accountspayable")
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(r"chat-messages", ChatMessageViewSet, basename="chat-message")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"documents", DocumentViewSet, basename="document")
router.register(r"editor-documents", ProcessRichDocumentViewSet, basename="editor-document")
router.register(r"contracts", ContractViewSet, basename="contract")
router.register(r"job-positions", JobPositionViewSet, basename="jobposition")
router.register(r"legal-templates", LegalTemplateViewSet, basename="legal-template")
router.register(r"calendar/events", CalendarEventViewSet, basename="calendar-event")
router.register(r"admin/landing/differentials", LandingDifferentialViewSet, basename="landing-differential")
router.register(r"admin/landing/process-steps", LandingProcessStepViewSet, basename="landing-process-step")
router.register(r"admin/posts", LandingBlogPostAdminViewSet, basename="landing-post-admin")
router.register(r"admin/testimonials", LandingTestimonialAdminViewSet, basename="landing-testimonial-admin")
router.register(r"admin/landing/social-links", LandingSocialLinkViewSet, basename="landing-social-link")
router.register(r"admin/landing/navigation-links", LandingNavigationLinkViewSet, basename="landing-navigation-link")
router.register(r"messages", LandingLeadAdminViewSet, basename="landing-message")


class HealthView(APIView):
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", LoginView.as_view(), name="auth_login"),
    path("api/portal/login/", LoginView.as_view(), name="portal_login"),
    path("api/auth/logout/", LogoutView.as_view(), name="auth_logout"),
    path("api/auth/accept-invite/", AcceptInviteView.as_view(), name="auth_accept_invite"),
    path("api/tenants/my/", TenantsMyView.as_view(), name="tenants_my"),
    path("api/tenants/", TenantOnboardingView.as_view(), name="tenant_onboarding"),
    path("api/tenants/<uuid:tenant_id>/invite/", TenantInviteView.as_view(), name="tenant_invite"),
    path("api/admin/companies/", SuperAdminCompanyView.as_view(), name="admin_companies"),
    path("api/admin/companies/<uuid:tenant_id>/", SuperAdminCompanyDetailView.as_view(), name="admin_companies_detail"),
    path("api/admin/users/", SuperAdminUserView.as_view(), name="admin_users"),
    path("api/admin/users/<uuid:user_id>/", SuperAdminUserDetailView.as_view(), name="admin_users_detail"),
    path("api/finance/report/", FinanceReportView.as_view(), name="finance_report"),
    path("api/dashboard/legal/", LegalDashboardView.as_view(), name="dashboard_legal"),
    path("api/auth/token/", EmailOrUsernameTokenView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/me/", MeView.as_view(), name="me"),
    path("api/me/accept-lgpd/", AcceptLGPDView.as_view(), name="accept_lgpd"),
    path("api/access-controls/", AccessControlTypesView.as_view(), name="access_controls"),
    path("api/landing-page/", LandingPageManageView.as_view(), name="landing_page_manage"),
    path("api/admin/landing/settings/", LandingSiteSettingsManageView.as_view(), name="admin_landing_settings"),
    path("api/landing/", PublicLandingView.as_view(), name="public_landing"),
    path("api/posts/", PublicBlogPostListView.as_view(), name="public_posts"),
    path("api/testimonials/", PublicTestimonialListView.as_view(), name="public_testimonials"),
    path("api/contact-messages/", PublicContactMessageView.as_view(), name="public_contact_messages"),
    path("api/public/tenants/", PublicTenantListView.as_view(), name="public_tenants"),
    path("api/public/site/", PublicSiteView.as_view(), name="public_site"),
    path("api/public/site/lead/", PublicSiteLeadView.as_view(), name="public_site_lead"),
    path("api/public/contact/", PublicContactView.as_view(), name="public_contact"),
    path("api/public/landing/<slug:slug>/", PublicLandingPageView.as_view(), name="public_landing_page"),
    path("api/public/landing/<slug:slug>/lead/", PublicLandingLeadCreateView.as_view(), name="public_landing_lead"),
    path("api/health/", HealthView.as_view(), name="health"),
    path("api/tenant/export/", TenantExportView.as_view(), name="tenant_export"),
    path("api/workspace-state/", WorkspaceStateView.as_view(), name="workspace_state"),
    path("api/workspace-state/record/", WorkspaceStateRecordView.as_view(), name="workspace_state_record"),
    path("api/portal/me/", PortalMeView.as_view(), name="portal_me"),
    path("api/portal/dashboard/", PortalDashboardView.as_view(), name="portal_dashboard"),
    path("api/portal/processes/", PortalProcessListView.as_view(), name="portal_processes"),
    path("api/portal/processes/<uuid:pk>/", PortalProcessDetailView.as_view(), name="portal_process_detail"),
    path("api/portal/processes/<uuid:pk>/timeline/", PortalTimelineView.as_view(), name="portal_process_timeline"),
    path("api/portal/processes/<uuid:pk>/documents/", PortalDocumentsView.as_view(), name="portal_process_documents"),
    path("api/portal/messages/", PortalMessagesView.as_view(), name="portal_messages"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
