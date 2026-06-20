import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from apps.notifications.email_templates import invite_email, welcome_email
from apps.notifications.services import _safe_send_email
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.accounts.jwt import EmailOrUsernameTokenObtainPairSerializer
from apps.accounts.access import ACCESS_PERMISSION_CODES
from apps.accounts.models import Profile, UserRole, AppRole, TenantInvite, UserAccessPermission, Employee
from apps.core.models import Tenant
from apps.clients.models import Client
from apps.billing.services import ensure_subscription_for_tenant
from apps.billing.limits import assert_can_create_user


User = get_user_model()


def _resolve_user_links(*, tenant, linked_employee_id=None, linked_client_id=None, current_user=None):
    linked_employee = None
    linked_client = None

    employee_id = str(linked_employee_id or '').strip()
    client_id = str(linked_client_id or '').strip()

    if employee_id and client_id:
        return None, None, Response({'detail': 'O usuário deve ser vinculado a exatamente um cliente ou um funcionário.'}, status=400)

    if employee_id:
        linked_employee = Employee.objects.filter(id=employee_id).first()
        if linked_employee is None or (tenant is not None and linked_employee.tenant_id != tenant.id):
            return None, None, Response({'detail': 'Funcionário inválido para o tenant informado.'}, status=400)
        if linked_employee.user_id and (current_user is None or linked_employee.user_id != current_user.id):
            return None, None, Response({'detail': 'Este funcionário já está vinculado a outro usuário.'}, status=400)

    if client_id:
        linked_client = Client.objects.filter(id=client_id).first()
        if linked_client is None or (tenant is not None and linked_client.tenant_id != tenant.id):
            return None, None, Response({'detail': 'Cliente inválido para o tenant informado.'}, status=400)
        if linked_client.portal_user_id and (current_user is None or linked_client.portal_user_id != current_user.id):
            return None, None, Response({'detail': 'Este cliente já está vinculado a outro usuário.'}, status=400)

    return linked_employee, linked_client, None


def _require_tenant_membership(*, tenant, current_user=None):
    if current_user is not None and current_user.is_superuser:
        return None
    if tenant is None:
        return Response({'detail': 'O usuario deve ser vinculado a uma empresa ou escritorio.'}, status=400)
    return None


def _apply_user_links(*, user, tenant, linked_employee=None, linked_client=None):
    if tenant is not None:
        Employee.objects.filter(tenant=tenant, user=user).exclude(id=getattr(linked_employee, 'id', None)).update(user=None)
        Client.objects.filter(tenant=tenant, portal_user=user).exclude(id=getattr(linked_client, 'id', None)).update(portal_user=None)
    else:
        Employee.objects.filter(user=user).exclude(id=getattr(linked_employee, 'id', None)).update(user=None)
        Client.objects.filter(portal_user=user).exclude(id=getattr(linked_client, 'id', None)).update(portal_user=None)

    if linked_employee is not None:
        linked_employee.user = user
        linked_employee.save(update_fields=['user'])
    if linked_client is not None:
        linked_client.portal_user = user
        linked_client.save(update_fields=['portal_user'])


def _reject_superuser_management(request):
    if 'is_superuser' in request.data:
        return Response({'detail': 'Superuser so pode ser criado ou alterado pelo backend/linha de comando.'}, status=400)

    roles = request.data.get('roles') or []
    if isinstance(roles, list) and any(str(role).strip().upper() == 'SUPERUSER' for role in roles):
        return Response({'detail': 'O perfil SUPERUSER nao pode ser gerenciado por esta interface.'}, status=400)

    return None



class LoginView(TokenObtainPairView):
    throttle_scope = 'login'
    """Facade endpoint: POST /api/auth/login

    Accepts {email,password} (or {username,password}) and returns {access,refresh}.
    """

    serializer_class = EmailOrUsernameTokenObtainPairSerializer


class LogoutView(APIView):
    """Invalidate refresh token when provided."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except Exception:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class TenantsMyView(APIView):
    """List all tenants the authenticated user belongs to."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_superuser:
            tenants = Tenant.objects.all().order_by("name")
            return Response(
                {
                    "tenants": [
                        {
                            "id": str(t.id),
                            "name": t.name,
                            "slug": t.slug,
                            "roles": ["SUPERUSER"],
                        }
                        for t in tenants
                    ]
                }
            )

        roles = UserRole.objects.select_related('tenant').filter(user=request.user)
        by_tenant = {}
        for ur in roles:
            tid = str(ur.tenant_id)
            if tid not in by_tenant:
                by_tenant[tid] = {
                    'id': tid,
                    'name': ur.tenant.name,
                    'slug': ur.tenant.slug,
                    'roles': [],
                }
            by_tenant[tid]['roles'].append(ur.role)
        return Response({'tenants': list(by_tenant.values())})


class TenantOnboardingView(APIView):
    """Create a new tenant (office) + owner user.

    Public endpoint: POST /api/tenants
    Payload example:
      {
        "tenant": {"name": "Meu Escritório", "cnpj": "..."},
        "owner": {"email": "owner@x.com", "password": "...", "full_name": "..."}
      }
    """

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

    @transaction.atomic
    def post(self, request):
        tenant_data = request.data.get('tenant') or {}
        owner_data = request.data.get('owner') or {}

        tenant_name = (tenant_data.get('name') or '').strip()
        if not tenant_name:
            return Response({'detail': 'tenant.name is required.'}, status=400)

        email = (owner_data.get('email') or '').strip().lower()
        password = owner_data.get('password')
        full_name = (owner_data.get('full_name') or '').strip()
        if not email or not password:
            return Response({'detail': 'owner.email and owner.password are required.'}, status=400)

        user, created = User.objects.get_or_create(email=email, defaults={'username': email})
        if created:
            user.set_password(password)
            user.save(update_fields=['password'])
        else:
            # If user exists, validate password for onboarding (avoid hijacking).
            if not user.check_password(password):
                return Response({'detail': 'Invalid credentials for existing user.'}, status=400)

        tenant = Tenant.objects.create(
            name=tenant_name,
            cnpj=tenant_data.get('cnpj'),
            address=tenant_data.get('address'),
            phone=tenant_data.get('phone'),
            email=tenant_data.get('email'),
            logo_url=tenant_data.get('logo_url'),
            owner=user,
            settings=tenant_data.get('settings') or {},
        )
        tenant.ensure_slug()

        Profile.objects.update_or_create(
            id=user,
            defaults={'full_name': full_name, 'tenant': tenant},
        )

        # OWNER role
        UserRole.objects.get_or_create(user=user, tenant=tenant, role=AppRole.OWNER)

        # Billing foundation (PR17)
        ensure_subscription_for_tenant(tenant, plan_code='free')

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'tenant': {'id': str(tenant.id), 'name': tenant.name, 'slug': tenant.slug},
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=201,
        )


class SuperAdminCompanyView(APIView):
    """Superadmin endpoint to create/list companies (tenants).

    GET  /api/admin/companies/  -> list all companies
    POST /api/admin/companies/  -> create company + admin user with full tenant roles
    """

    permission_classes = [permissions.IsAuthenticated]

    def _forbidden_if_not_superuser(self, request):
        if not request.user.is_superuser:
            return Response({'detail': 'Only superusers can manage companies.'}, status=403)
        return None

    def _serialize_company(self, tenant: Tenant):
        settings_data = tenant.settings or {}
        address = tenant.address or {}
        return {
            'id': str(tenant.id),
            'name': tenant.name,
            'slug': tenant.slug,
            'cnpj': tenant.cnpj,
            'email': tenant.email,
            'phone': tenant.phone,
            'website': settings_data.get('website'),
            'legal_name': settings_data.get('legal_name'),
            'trade_name': settings_data.get('trade_name'),
            'cep': address.get('cep'),
            'state': address.get('state'),
            'city': address.get('city'),
            'address_line1': address.get('line1'),
            'address_line2': address.get('line2'),
            'logo_url': tenant.logo_url,
            'owner_id': str(tenant.owner_id) if tenant.owner_id else None,
            'owner_email': tenant.owner.email if tenant.owner_id else None,
            'created_at': tenant.created_at,
            'updated_at': tenant.updated_at,
        }

    def get(self, request):
        forbidden = self._forbidden_if_not_superuser(request)
        if forbidden:
            return forbidden

        tenants = Tenant.objects.select_related('owner').all().order_by('-created_at')
        return Response({'companies': [self._serialize_company(t) for t in tenants]})

    @transaction.atomic
    def post(self, request):
        forbidden = self._forbidden_if_not_superuser(request)
        if forbidden:
            return forbidden

        tenant_data = request.data.get('tenant') or {}
        admin_data = request.data.get('admin') or {}

        tenant_name = (tenant_data.get('name') or '').strip()
        if not tenant_name:
            return Response({'detail': 'tenant.name is required.'}, status=400)

        admin_email = (admin_data.get('email') or '').strip().lower()
        admin_password = admin_data.get('password')
        admin_full_name = (admin_data.get('full_name') or '').strip()
        if not admin_email:
            return Response({'detail': 'admin.email is required.'}, status=400)

        admin_user = User.objects.filter(email=admin_email).first()
        if admin_user is None:
            if not admin_password:
                return Response({'detail': 'admin.password is required for new users.'}, status=400)
            admin_user = User.objects.create_user(email=admin_email, password=admin_password, username=admin_email)
            admin_user.is_staff = True
            admin_user.save(update_fields=['is_staff'])
        elif admin_password and not admin_user.check_password(admin_password):
            return Response({'detail': 'Invalid credentials for existing admin user.'}, status=400)

        tenant = Tenant.objects.create(
            name=tenant_name,
            slug=(tenant_data.get('slug') or None),
            cnpj=tenant_data.get('cnpj'),
            address=tenant_data.get('address') or {
                'cep': tenant_data.get('cep'),
                'state': tenant_data.get('state'),
                'city': tenant_data.get('city'),
                'line1': tenant_data.get('address_line1'),
                'line2': tenant_data.get('address_line2'),
            },
            phone=tenant_data.get('phone'),
            email=tenant_data.get('email'),
            logo_url=tenant_data.get('logo_url'),
            owner=admin_user,
            settings=(
                tenant_data.get('settings')
                or {
                    'website': tenant_data.get('website'),
                    'legal_name': tenant_data.get('legal_name'),
                    'trade_name': tenant_data.get('trade_name'),
                }
            ),
        )
        tenant.ensure_slug()

        Profile.objects.update_or_create(
            id=admin_user,
            defaults={'full_name': admin_full_name or admin_user.email, 'tenant': tenant},
        )

        # Full tenant access for the designated admin user.
        for role, _ in AppRole.choices:
            UserRole.objects.get_or_create(user=admin_user, tenant=tenant, role=role)

        # Optional: mirror superuser roles in the new tenant for explicit auditability.
        for role, _ in AppRole.choices:
            UserRole.objects.get_or_create(user=request.user, tenant=tenant, role=role)

        ensure_subscription_for_tenant(tenant, plan_code='free')

        return Response(
            {
                'tenant': self._serialize_company(tenant),
                'admin_user': {
                    'id': str(admin_user.id),
                    'email': admin_user.email,
                    'is_superuser': bool(admin_user.is_superuser),
                },
            },
            status=201,
        )


class SuperAdminCompanyDetailView(APIView):
    """Superadmin endpoint to retrieve/update one company."""

    permission_classes = [permissions.IsAuthenticated]

    def _forbidden_if_not_superuser(self, request):
        if not request.user.is_superuser:
            return Response({'detail': 'Only superusers can manage companies.'}, status=403)
        return None

    def _serialize_company(self, tenant: Tenant):
        return SuperAdminCompanyView()._serialize_company(tenant)

    def _get_company(self, tenant_id: str):
        return Tenant.objects.select_related('owner').filter(id=tenant_id).first()

    def get(self, request, tenant_id: str):
        forbidden = self._forbidden_if_not_superuser(request)
        if forbidden:
            return forbidden
        tenant = self._get_company(tenant_id)
        if tenant is None:
            return Response({'detail': 'Company not found.'}, status=404)
        return Response(self._serialize_company(tenant))

    @transaction.atomic
    def patch(self, request, tenant_id: str):
        return self._update(request, tenant_id)

    @transaction.atomic
    def put(self, request, tenant_id: str):
        return self._update(request, tenant_id)

    def _update(self, request, tenant_id: str):
        forbidden = self._forbidden_if_not_superuser(request)
        if forbidden:
            return forbidden

        tenant = self._get_company(tenant_id)
        if tenant is None:
            return Response({'detail': 'Company not found.'}, status=404)

        data = request.data or {}
        tenant_data = data.get('tenant') or data

        if 'name' in tenant_data:
            name = (tenant_data.get('name') or '').strip()
            if not name:
                return Response({'detail': 'name cannot be empty.'}, status=400)
            tenant.name = name
        if 'slug' in tenant_data:
            tenant.slug = (tenant_data.get('slug') or '').strip() or None
        if 'cnpj' in tenant_data:
            tenant.cnpj = tenant_data.get('cnpj') or None
        if 'email' in tenant_data:
            tenant.email = tenant_data.get('email') or None
        if 'phone' in tenant_data:
            tenant.phone = tenant_data.get('phone') or None
        if 'logo_url' in tenant_data:
            tenant.logo_url = tenant_data.get('logo_url') or None

        settings_data = dict(tenant.settings or {})
        if 'website' in tenant_data:
            settings_data['website'] = tenant_data.get('website')
        if 'legal_name' in tenant_data:
            settings_data['legal_name'] = tenant_data.get('legal_name')
        if 'trade_name' in tenant_data:
            settings_data['trade_name'] = tenant_data.get('trade_name')
        if settings_data != (tenant.settings or {}):
            tenant.settings = settings_data

        address_data = dict(tenant.address or {})
        if 'cep' in tenant_data:
            address_data['cep'] = tenant_data.get('cep')
        if 'state' in tenant_data:
            address_data['state'] = tenant_data.get('state')
        if 'city' in tenant_data:
            address_data['city'] = tenant_data.get('city')
        if 'address_line1' in tenant_data:
            address_data['line1'] = tenant_data.get('address_line1')
        if 'address_line2' in tenant_data:
            address_data['line2'] = tenant_data.get('address_line2')
        if address_data != (tenant.address or {}):
            tenant.address = address_data

        tenant.save()
        tenant.ensure_slug()
        tenant.refresh_from_db()
        return Response(self._serialize_company(tenant))


class SuperAdminUserView(APIView):
    """Superadmin endpoint to list/create users."""

    permission_classes = [permissions.IsAuthenticated]

    def _forbidden_if_not_superuser(self, request):
        if not request.user.is_superuser:
            return Response({'detail': 'Only superusers can manage admin users.'}, status=403)
        return None

    def _serialize_user(self, user, tenant=None):
        profile = getattr(user, 'profile', None)
        if tenant is None:
            tenant = getattr(profile, 'tenant', None)

        roles = []
        permissions_codes = []
        tenant_payload = None
        if tenant is not None:
            roles = list(UserRole.objects.filter(user=user, tenant=tenant).values_list('role', flat=True))
            permissions_codes = list(
                UserAccessPermission.objects.filter(user=user, tenant=tenant).values_list('code', flat=True)
            )
            tenant_payload = {'id': str(tenant.id), 'name': tenant.name, 'slug': tenant.slug}

        linked_employee = Employee.objects.filter(user=user, tenant=tenant).only('id', 'full_name').first() if tenant is not None else Employee.objects.filter(user=user).only('id', 'full_name').first()
        linked_client = Client.objects.filter(portal_user=user, tenant=tenant).only('id', 'name').first() if tenant is not None else Client.objects.filter(portal_user=user).only('id', 'name').first()

        return {
            'id': str(user.id),
            'email': user.email,
            'full_name': getattr(profile, 'full_name', ''),
            'is_active': bool(user.is_active),
            'is_superuser': bool(user.is_superuser),
            'tenant': tenant_payload,
            'roles': roles,
            'permissions': permissions_codes,
            'linked_employee_id': str(linked_employee.id) if linked_employee else None,
            'linked_employee_name': linked_employee.full_name if linked_employee else None,
            'linked_client_id': str(linked_client.id) if linked_client else None,
            'linked_client_name': linked_client.name if linked_client else None,
        }

    def get(self, request):
        forbidden = self._forbidden_if_not_superuser(request)
        if forbidden:
            return forbidden

        tenant_id = request.query_params.get('tenant_id')
        qs = User.objects.all().order_by('email')
        if tenant_id:
            qs = qs.filter(profile__tenant_id=tenant_id)
        return Response({'users': [self._serialize_user(u) for u in qs]})

    @transaction.atomic
    def post(self, request):
        forbidden = self._forbidden_if_not_superuser(request)
        if forbidden:
            return forbidden

        superuser_error = _reject_superuser_management(request)
        if superuser_error:
            return superuser_error

        email = (request.data.get('email') or '').strip().lower()
        password = request.data.get('password')
        full_name = (request.data.get('full_name') or '').strip()
        tenant_id = request.data.get('tenant_id')
        is_active = bool(request.data.get('is_active', True))
        roles = request.data.get('roles') or []
        permission_codes = request.data.get('permissions') or []
        linked_employee_id = request.data.get('linked_employee_id')
        linked_client_id = request.data.get('linked_client_id')

        if not email:
            return Response({'detail': 'email is required.'}, status=400)
        if not password:
            return Response({'detail': 'password is required.'}, status=400)

        tenant = Tenant.objects.filter(id=tenant_id).first() if tenant_id else None
        if tenant_id and tenant is None:
            return Response({'detail': 'tenant_id is invalid.'}, status=400)
        tenant_error = _require_tenant_membership(tenant=tenant)
        if tenant_error:
            return tenant_error

        linked_employee, linked_client, link_error = _resolve_user_links(tenant=tenant, linked_employee_id=linked_employee_id, linked_client_id=linked_client_id)
        if link_error:
            return link_error

        if User.objects.filter(email=email).exists():
            return Response({'detail': 'A user with this email already exists.'}, status=400)

        user = User.objects.create_user(email=email, password=password, username=email)
        user.is_active = is_active
        user.is_staff = True
        user.save(update_fields=['is_active', 'is_staff'])

        profile, _ = Profile.objects.get_or_create(id=user)
        profile.full_name = full_name
        if tenant is not None:
            profile.tenant = tenant
        profile.save()

        valid_roles = {r[0] for r in AppRole.choices}
        normalized_roles = []
        for role in roles:
            try:
                norm = AppRole.normalize(str(role))
            except Exception:
                continue
            if norm in valid_roles and norm not in normalized_roles:
                normalized_roles.append(norm)

        if tenant is not None:
            for role in normalized_roles:
                UserRole.objects.get_or_create(user=user, tenant=tenant, role=role)

            valid_permission_codes = set(ACCESS_PERMISSION_CODES)
            filtered_permissions = []
            for code in permission_codes:
                c = str(code).strip()
                if c in valid_permission_codes and c not in filtered_permissions:
                    filtered_permissions.append(c)
            for code in filtered_permissions:
                UserAccessPermission.objects.get_or_create(user=user, tenant=tenant, code=code)

        _apply_user_links(user=user, tenant=tenant, linked_employee=linked_employee, linked_client=linked_client)

        return Response(self._serialize_user(user, tenant), status=201)


class SuperAdminUserDetailView(APIView):
    """Superadmin endpoint to update one user."""

    permission_classes = [permissions.IsAuthenticated]

    def _forbidden_if_not_superuser(self, request):
        if not request.user.is_superuser:
            return Response({'detail': 'Only superusers can manage admin users.'}, status=403)
        return None

    def _parse_tenant(self, request, user):
        tenant_id = request.data.get('tenant_id') or request.query_params.get('tenant_id')
        if tenant_id:
            return Tenant.objects.filter(id=tenant_id).first()
        return getattr(getattr(user, 'profile', None), 'tenant', None)

    @transaction.atomic
    def put(self, request, user_id: str):
        return self._update(request, user_id)

    @transaction.atomic
    def patch(self, request, user_id: str):
        return self._update(request, user_id)

    def _update(self, request, user_id: str):
        forbidden = self._forbidden_if_not_superuser(request)
        if forbidden:
            return forbidden

        superuser_error = _reject_superuser_management(request)
        if superuser_error:
            return superuser_error

        user = User.objects.filter(id=user_id).first()
        if user is None:
            return Response({'detail': 'User not found.'}, status=404)

        tenant = self._parse_tenant(request, user)
        if (request.data.get('tenant_id') or request.query_params.get('tenant_id')) and tenant is None:
            return Response({'detail': 'tenant_id is invalid.'}, status=400)
        tenant_error = _require_tenant_membership(tenant=tenant, current_user=user)
        if tenant_error:
            return tenant_error

        has_link_update = 'linked_employee_id' in request.data or 'linked_client_id' in request.data
        linked_employee = None
        linked_client = None
        if has_link_update:
            linked_employee_id = request.data.get('linked_employee_id')
            linked_client_id = request.data.get('linked_client_id')
            linked_employee, linked_client, link_error = _resolve_user_links(tenant=tenant, linked_employee_id=linked_employee_id, linked_client_id=linked_client_id, current_user=user)
            if link_error:
                return link_error

        email = request.data.get('email')
        if email is not None:
            email_norm = str(email).strip().lower()
            if not email_norm:
                return Response({'detail': 'email cannot be empty.'}, status=400)
            if User.objects.exclude(id=user.id).filter(email=email_norm).exists():
                return Response({'detail': 'A user with this email already exists.'}, status=400)
            user.email = email_norm
            user.username = email_norm

        password = request.data.get('password')
        if password:
            user.set_password(password)

        if 'is_active' in request.data:
            user.is_active = bool(request.data.get('is_active'))
        if user.is_superuser:
            user.is_staff = True
        user.save()

        profile, _ = Profile.objects.get_or_create(id=user)
        if 'full_name' in request.data:
            profile.full_name = (request.data.get('full_name') or '').strip()
        if tenant is not None:
            profile.tenant = tenant
        profile.save()

        roles = request.data.get('roles')
        if roles is not None and tenant is not None:
            valid_roles = {r[0] for r in AppRole.choices}
            normalized_roles = []
            for role in roles:
                try:
                    norm = AppRole.normalize(str(role))
                except Exception:
                    continue
                if norm in valid_roles and norm not in normalized_roles:
                    normalized_roles.append(norm)

            current_qs = UserRole.objects.filter(user=user, tenant=tenant)
            current_roles = set(current_qs.values_list('role', flat=True))
            target_roles = set(normalized_roles)
            to_remove = current_roles - target_roles
            to_add = target_roles - current_roles
            if to_remove:
                current_qs.filter(role__in=to_remove).delete()
            for role in to_add:
                UserRole.objects.get_or_create(user=user, tenant=tenant, role=role)

        permission_codes = request.data.get('permissions')
        if permission_codes is not None and tenant is not None:
            valid_permission_codes = set(ACCESS_PERMISSION_CODES)
            filtered_permissions = []
            for code in permission_codes:
                c = str(code).strip()
                if c in valid_permission_codes and c not in filtered_permissions:
                    filtered_permissions.append(c)

            current_qs = UserAccessPermission.objects.filter(user=user, tenant=tenant)
            current_codes = set(current_qs.values_list('code', flat=True))
            target_codes = set(filtered_permissions)
            to_remove = current_codes - target_codes
            to_add = target_codes - current_codes
            if to_remove:
                current_qs.filter(code__in=to_remove).delete()
            for code in to_add:
                UserAccessPermission.objects.get_or_create(user=user, tenant=tenant, code=code)

        if has_link_update:
            _apply_user_links(user=user, tenant=tenant, linked_employee=linked_employee, linked_client=linked_client)

        payload = SuperAdminUserView()._serialize_user(user, tenant)
        return Response(payload)


class TenantInviteView(APIView):
    """Invite a user to a tenant.

    Tenant-scoped endpoint: requires Authorization + X-Tenant-ID.
    POST /api/tenants/{id}/invite
    Payload: {"email": "user@x.com", "role": "advogado"}
    """

    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, tenant_id: str):
        # Ensure URL tenant matches header tenant (avoid confusing admin mistakes).
        if not request.tenant or str(request.tenant.id) != str(tenant_id):
            return Response({'detail': 'Tenant mismatch.'}, status=400)

        # Only tenant admins can invite.
        admin_roles = {AppRole.ADMIN, AppRole.OWNER}
        if not UserRole.objects.filter(user=request.user, tenant=request.tenant, role__in=admin_roles).exists():
            return Response({'detail': 'You do not have permission to invite users.'}, status=403)

        email = (request.data.get('email') or '').strip().lower()
        role_raw = (request.data.get('role') or '').strip()
        role = AppRole.normalize(role_raw)
        if not email or role not in dict(AppRole.choices):
            return Response({'detail': 'Valid email and role are required.'}, status=400)

        # Billing: enforce user limit before creating invite
        assert_can_create_user(request.tenant)

        # Avoid duplicate active invites.
        now = timezone.now()
        active_invite = TenantInvite.objects.filter(
            tenant=request.tenant,
            email=email,
            accepted_at__isnull=True,
            expires_at__gt=now,
        ).order_by('-created_at').first()
        if active_invite:
            invite = active_invite
        else:
            token = secrets.token_urlsafe(32)
            expires_at = now + timedelta(days=getattr(settings, 'TENANT_INVITE_EXPIRES_DAYS', 7))
            invite = TenantInvite.objects.create(
                tenant=request.tenant,
                email=email,
                role=role,
                token=token,
                expires_at=expires_at,
                invited_by=request.user,
            )

        invite_url = None
        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', '')
        if frontend_base:
            invite_url = f"{frontend_base.rstrip('/')}/accept-invite?token={invite.token}"

        expires_days = getattr(settings, 'TENANT_INVITE_EXPIRES_DAYS', 7)
        role_labels = {
            'OWNER': 'Proprietário', 'ADMIN': 'Administrador', 'LAWYER': 'Advogado',
            'ASSISTANT': 'Assistente', 'FINANCE': 'Financeiro', 'CLIENT': 'Cliente',
        }
        subject, html_body = invite_email(
            office_name=request.tenant.name,
            role_label=role_labels.get(invite.role, invite.role),
            invite_url=invite_url,
            token=invite.token,
            expires_days=expires_days,
        )
        plain = f"Você foi convidado para {request.tenant.name} como {invite.role}.\n"
        plain += f"Aceite: {invite_url}" if invite_url else f"Token: {invite.token}"
        _safe_send_email(to_email=email, subject=subject, message=plain, html_message=html_body)

        return Response(
            {
                'invite_url': invite_url,
                'token': invite.token,
                'invite': {
                    'email': invite.email,
                    'role': invite.role,
                    'token': invite.token,
                    'expires_at': invite.expires_at,
                },
            },
            status=201,
        )


class AcceptInviteView(APIView):
    throttle_scope = 'accept_invite'
    """Accept an invite token.

    Public endpoint: POST /api/auth/accept-invite
    Payload:
      {"token": "...", "full_name": "...", "password": "..."}
    If the user exists, password is optional; if not, password is required.
    """

    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        token = (request.data.get('token') or '').strip()
        if not token:
            return Response({'detail': 'token is required.'}, status=400)

        invite = TenantInvite.objects.select_related('tenant').filter(token=token).first()
        if not invite:
            return Response({'detail': 'Invalid invite token.'}, status=400)

        now = timezone.now()
        if invite.is_accepted:
            return Response({'detail': 'Invite already accepted.'}, status=400)
        if invite.expires_at <= now:
            return Response({'detail': 'Invite expired.'}, status=400)

        # Create or attach user
        email = invite.email.strip().lower()
        password = request.data.get('password')
        full_name = (request.data.get('full_name') or '').strip()

        user = User.objects.filter(email=email).first()
        if not user:
            if not password:
                return Response({'detail': 'password is required for new users.'}, status=400)
            user = User.objects.create_user(email=email, password=password, username=email)
        else:
            # If password provided, validate it (avoid accepting invite into hijacked accounts).
            if password and not user.check_password(password):
                return Response({'detail': 'Invalid credentials for existing user.'}, status=400)

        # Billing: enforce user limit before accepting invite
        assert_can_create_user(invite.tenant)
        UserRole.objects.get_or_create(user=user, tenant=invite.tenant, role=invite.role)
        Profile.objects.update_or_create(
            id=user,
            defaults={'full_name': full_name or (getattr(user, 'first_name', '') or ''), 'tenant': invite.tenant},
        )

        invite.accepted_at = now
        invite.save(update_fields=['accepted_at'])

        # Welcome email
        display_name = full_name or getattr(getattr(user, 'profile', None), 'full_name', None) or user.email
        frontend_base = getattr(settings, 'FRONTEND_BASE_URL', '')
        login_url = f"{frontend_base.rstrip('/')}/app" if frontend_base else None
        _subj, html = welcome_email(user_name=display_name, office_name=invite.tenant.name, login_url=login_url)
        plain = f"Bem-vindo ao {invite.tenant.name}! Seu acesso foi ativado. Acesse: {login_url or ''}"
        _safe_send_email(to_email=user.email, subject=_subj, message=plain, html_message=html)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'tenant': {'id': str(invite.tenant.id), 'name': invite.tenant.name, 'slug': invite.tenant.slug},
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        )
