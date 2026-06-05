from __future__ import annotations

from django.core.mail import send_mail
from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AppRole, UserRole
from apps.core.models import LandingLead, LandingPage, Tenant


class LandingPageSerializer(serializers.ModelSerializer):
    tenant = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = LandingPage
        fields = (
            'id',
            'tenant',
            'is_published',
            'brand_name',
            'logo_url',
            'hero_title',
            'hero_subtitle',
            'primary_cta_label',
            'primary_cta_url',
            'secondary_cta_label',
            'secondary_cta_url',
            'areas',
            'differentials',
            'testimonials',
            'team',
            'faqs',
            'contact_phone',
            'contact_email',
            'contact_address',
            'contact_whatsapp',
            'seo_title',
            'seo_description',
            'theme',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')

    def get_tenant(self, obj: LandingPage):
        return {'id': str(obj.tenant_id), 'name': obj.tenant.name, 'slug': obj.tenant.slug}

    def get_logo_url(self, obj: LandingPage):
        return obj.tenant.logo_url or ''


class LandingLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingLead
        fields = ('id', 'name', 'email', 'phone', 'message', 'source', 'created_at')
        read_only_fields = ('id', 'created_at')


class LandingPageManageView(APIView):
    """Tenant-scoped landing page management."""

    permission_classes = [permissions.IsAuthenticated]

    def _has_write_access(self, request, tenant) -> bool:
        if request.user.is_superuser:
            return True
        return UserRole.objects.filter(
            user=request.user,
            tenant=tenant,
            role__in=[AppRole.OWNER, AppRole.ADMIN],
        ).exists()

    def _get_or_create_page(self, tenant) -> LandingPage:
        page, _ = LandingPage.objects.get_or_create(
            tenant=tenant,
            defaults={
                'brand_name': tenant.name,
                'hero_title': 'Seu caso merece atenção, estratégia e defesa de verdade.',
                'hero_subtitle': 'Atendimento jurídico claro e próximo para orientar seus direitos e buscar a melhor solução.',
                'contact_email': tenant.email or '',
                'contact_phone': tenant.phone or '',
            },
        )
        return page

    def get(self, request):
        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            return Response({'detail': 'Tenant context is required.'}, status=400)
        page = self._get_or_create_page(tenant)
        return Response(LandingPageSerializer(page).data)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial: bool):
        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            return Response({'detail': 'Tenant context is required.'}, status=400)
        if not self._has_write_access(request, tenant):
            return Response({'detail': 'You do not have permission to update landing page.'}, status=403)

        page = self._get_or_create_page(tenant)
        serializer = LandingPageSerializer(page, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        page = serializer.save(updated_by=request.user)
        return Response(LandingPageSerializer(page).data)


class PublicLandingPageView(APIView):
    """Public landing content by tenant slug."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, slug: str):
        tenant = Tenant.objects.filter(slug=slug).first()
        if tenant is None:
            return Response({'detail': 'Landing page not found.'}, status=404)
        page = LandingPage.objects.filter(tenant=tenant, is_published=True).first()
        if page is None:
            return Response({'detail': 'Landing page not found.'}, status=404)
        payload = LandingPageSerializer(page).data
        company = _public_company_payload(tenant, page)
        payload['brand_name'] = company.get('name', '')
        payload['logo_url'] = company.get('logo_url', '')
        payload['contact_phone'] = company.get('phone', '')
        payload['contact_email'] = company.get('email', '')
        payload['contact_address'] = company.get('address', '')
        payload['areas'] = [
            {'title': a.get('name', ''), 'desc': a.get('description', '')}
            for a in _public_areas_payload(page)
        ]
        payload['team'] = [
            {'name': t.get('full_name', ''), 'role': t.get('role', ''), 'area': ''}
            for t in _public_team_payload(tenant, page)
        ]
        return Response(payload)


class PublicLandingLeadCreateView(APIView):
    """Capture public leads from landing contact form."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, slug: str):
        tenant = Tenant.objects.filter(slug=slug).first()
        if tenant is None:
            return Response({'detail': 'Landing page not found.'}, status=404)

        page = LandingPage.objects.filter(tenant=tenant, is_published=True).first()
        if page is None:
            return Response({'detail': 'Landing page not available.'}, status=404)

        serializer = LandingLeadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save(tenant=tenant)
        return Response(LandingLeadSerializer(lead).data, status=201)


class PublicSiteQuerySerializer(serializers.Serializer):
    slug = serializers.CharField(required=False, allow_blank=False)


class PublicContactSerializer(serializers.Serializer):
    slug = serializers.CharField(required=False, allow_blank=False)
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=50)
    message = serializers.CharField(required=False, allow_blank=True)
    source = serializers.CharField(required=False, allow_blank=True, max_length=120, default='landing_public')


def _resolve_public_landing(slug: str | None):
    def _get_or_create_page(tenant: Tenant):
        page = LandingPage.objects.filter(tenant=tenant).order_by('-updated_at').first()
        if page is not None:
            return page
        return LandingPage.objects.create(
            tenant=tenant,
            brand_name=tenant.name or '',
            hero_title='Seu caso merece atenção, estratégia e defesa de verdade.',
            hero_subtitle='Atendimento jurídico claro e próximo para orientar seus direitos e buscar a melhor solução.',
            contact_email=tenant.email or '',
            contact_phone=tenant.phone or '',
            is_published=False,
        )

    if slug:
        tenant = Tenant.objects.filter(slug=slug).first()
        if tenant is None:
            return None, None
        return tenant, _get_or_create_page(tenant)

    page = (
        LandingPage.objects
        .select_related('tenant')
        .filter(is_published=True)
        .order_by('-updated_at')
        .first()
    )
    if page is not None:
        return page.tenant, page

    any_page = LandingPage.objects.select_related('tenant').order_by('-updated_at').first()
    if any_page is not None:
        return any_page.tenant, any_page

    tenant = Tenant.objects.order_by('created_at').first()
    if tenant is None:
        return None, None
    return tenant, _get_or_create_page(tenant)


def _public_company_payload(tenant: Tenant, page: LandingPage):
    address = tenant.address or {}
    settings_data = tenant.settings or {}
    address_line1 = address.get('line1') or ''
    city = address.get('city') or ''
    state = address.get('state') or ''
    address_line = ", ".join([p for p in [address_line1, city, state] if p])
    return {
        'name': tenant.name or page.brand_name or '',
        'phone': tenant.phone or page.contact_phone or '',
        'email': tenant.email or page.contact_email or '',
        'address': address_line or '',
        'address_line1': address_line1,
        'city': city,
        'state': state,
        'logo_url': tenant.logo_url or '',
        'map_embed_url': settings_data.get('map_embed_url') or '',
    }


def _public_areas_payload(page: LandingPage):
    from apps.processes.models import LegalCause

    causes = (
        LegalCause.objects
        .filter(tenant=page.tenant, is_active=True)
        .order_by('name')
        .values('id', 'name', 'description')
    )
    out = [
        {
            'id': str(c['id']),
            'name': c.get('name') or '',
            'description': c.get('description') or '',
        }
        for c in causes
    ]
    if out:
        return out

    areas = page.areas or []
    fallback = []
    for idx, item in enumerate(areas, start=1):
        if isinstance(item, dict):
            fallback.append(
                {
                    'id': str(item.get('id') or idx),
                    'name': item.get('name') or item.get('title') or '',
                    'description': item.get('description') or item.get('desc') or '',
                }
            )
    return fallback


def _public_team_payload(tenant: Tenant, page: LandingPage):
    # Primary source: active employees from the tenant.
    from apps.accounts.models import Employee

    employees = (
        Employee.objects
        .select_related('position')
        .filter(tenant=tenant, is_active=True)
        .order_by('full_name')[:12]
    )
    out = [
        {
            'id': str(e.id),
            'full_name': e.full_name,
            'role': getattr(e.position, 'name', '') or '',
        }
        for e in employees
    ]
    if out:
        return out

    team = page.team or []
    fallback = []
    for idx, item in enumerate(team, start=1):
        if isinstance(item, dict):
            fallback.append(
                {
                    'id': str(item.get('id') or idx),
                    'full_name': item.get('full_name') or item.get('name') or '',
                    'role': item.get('role') or '',
                }
            )
    return fallback


class PublicSiteView(APIView):
    """Public consolidated payload for landing page consumption."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = PublicSiteQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        slug = query.validated_data.get('slug')

        tenant, page = _resolve_public_landing(slug)
        if tenant is None or page is None:
            return Response({'detail': 'Landing page not found.'}, status=404)
        company = _public_company_payload(tenant, page)

        return Response(
            {
                'company': company,
                'landing': {
                    'hero_title': page.hero_title,
                    'hero_subtitle': page.hero_subtitle,
                    'contact_phone': company.get('phone', ''),
                    'contact_email': company.get('email', ''),
                    'contact_address': company.get('address', ''),
                    'primary_cta_label': page.primary_cta_label,
                    'primary_cta_url': page.primary_cta_url,
                    'secondary_cta_label': page.secondary_cta_label,
                    'secondary_cta_url': page.secondary_cta_url,
                    'differentials': page.differentials or [],
                },
                'areas': _public_areas_payload(page),
                'team': _public_team_payload(tenant, page),
            }
        )


class PublicContactView(APIView):
    """Public landing contact endpoint: save lead + send email."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PublicContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        tenant, page = _resolve_public_landing(payload.get('slug'))
        if tenant is None or page is None:
            return Response({'detail': 'Landing page not found.'}, status=404)

        lead = LandingLead.objects.create(
            tenant=tenant,
            name=payload['name'],
            email=payload.get('email'),
            phone=payload.get('phone') or '',
            message=payload.get('message') or '',
            source=payload.get('source') or 'landing_public',
        )

        target_email = page.contact_email or tenant.email
        email_sent = False
        email_error = None
        if target_email:
            try:
                send_mail(
                    subject=f"[Landing] Novo contato - {tenant.name}",
                    message=(
                        f"Nome: {lead.name}\n"
                        f"Email: {lead.email or '-'}\n"
                        f"Telefone: {lead.phone or '-'}\n"
                        f"Origem: {lead.source or '-'}\n\n"
                        f"Mensagem:\n{lead.message or '-'}\n"
                    ),
                    from_email=None,  # uses DEFAULT_FROM_EMAIL
                    recipient_list=[target_email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as exc:
                email_error = str(exc)

        return Response(
            {
                'id': str(lead.id),
                'saved': True,
                'email_sent': email_sent,
                'email_error': email_error,
            },
            status=201,
        )


class PublicSiteLeadView(PublicContactView):
    """Alias endpoint: POST /api/public/site/lead/."""


class PublicTenantListView(APIView):
    """Public tenant catalog for landing discovery."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        rows = (
            Tenant.objects
            .filter(landing_page__is_published=True)
            .exclude(slug__isnull=True)
            .exclude(slug='')
            .order_by('name')
            .values('id', 'name', 'slug')
        )
        return Response(
            {
                'tenants': [
                    {'id': str(r['id']), 'name': r['name'], 'slug': r['slug']}
                    for r in rows
                ]
            }
        )
