from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.text import slugify

from apps.accounts.access import ACCESS_PERMISSION_CODES
from apps.core.permissions import (
    EmployeeAccessPermission,
    IsTenantMember,
    PositionAccessPermission,
)
from apps.core.viewsets import TenantScopedModelViewSet
from apps.core.models import Tenant
from .models import User, Profile, UserRole, AppRole, EmployeePosition, Employee


class IsSuperOrTenantAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user and request.user.is_superuser:
            return True
        # allow admins/socios for tenant-scoped management
        tenant = getattr(request, 'tenant', None) or getattr(getattr(request.user, 'profile', None), 'tenant', None)
        if not tenant:
            return False
        return UserRole.objects.filter(user=request.user, tenant=tenant, role__in=[AppRole.ADMIN, AppRole.OWNER]).exists()


class TenantPermissions(permissions.BasePermission):
    """Tenants: only superuser can CREATE. Owner can EDIT their own tenant."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action in ['create']:
            return request.user.is_superuser

        # list/retrieve allowed for superuser, or tenant admins (scoped)
        return True

    def has_object_permission(self, request, view, obj: Tenant):
        if request.user.is_superuser:
            return True
        # Only allow editing own tenant if owner
        if view.action in ['update', 'partial_update']:
            return obj.owner_id == request.user.id
        # retrieve allowed if user belongs to that tenant
        tenant = getattr(getattr(request.user, 'profile', None), 'tenant', None)
        return tenant and tenant.id == obj.id


class TenantSerializer(serializers.ModelSerializer):
    owner_id = serializers.UUIDField(source='owner_id', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Tenant
        fields = (
            'id', 'name', 'slug', 'owner_id', 'owner_email',
            'cnpj', 'address', 'phone', 'email', 'logo_url', 'settings',
            'created_at', 'updated_at'
        )


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='profile.full_name', allow_blank=True, required=False)
    tenant_id = serializers.UUIDField(source='profile.tenant_id', allow_null=True, required=False)
    role = serializers.ChoiceField(choices=[r[0] for r in AppRole.choices] + ['admin','socio','advogado','assistente','financeiro','cliente'], required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = ('id', 'email', 'is_active', 'is_staff', 'full_name', 'tenant_id', 'role', 'password')
        read_only_fields = ('id',)


class EmployeePositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeePosition
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')


class EmployeeSerializer(serializers.ModelSerializer):
    position_name = serializers.CharField(source='position.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    has_system_access = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = (
            'id',
            'tenant',
            'position',
            'position_name',
            'user',
            'user_email',
            'has_system_access',
            'full_name',
            'email',
            'phone',
            'document_id',
            'hire_date',
            'termination_date',
            'salario',
            'is_active',
            'notes',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at', 'position_name', 'user_email', 'has_system_access')

    def get_has_system_access(self, obj: Employee) -> bool:
        return obj.user_id is not None

    def validate(self, attrs):
        request = self.context.get('request')
        tenant = getattr(request, 'tenant', None) if request else None

        position = attrs.get('position') or getattr(self.instance, 'position', None)
        if tenant and position and position.tenant_id != tenant.id:
            raise serializers.ValidationError({'position': 'Cargo nÃ£o pertence ao tenant atual.'})

        user = attrs.get('user')
        if user is not None and tenant:
            if not (user.is_superuser or UserRole.objects.filter(user=user, tenant=tenant).exists()):
                raise serializers.ValidationError({'user': 'UsuÃ¡rio nÃ£o pertence ao tenant atual.'})

        termination_date = attrs.get('termination_date')
        hire_date = attrs.get('hire_date') or getattr(self.instance, 'hire_date', None)
        if hire_date and termination_date and termination_date < hire_date:
            raise serializers.ValidationError({'termination_date': 'Data de desligamento nÃ£o pode ser anterior Ã  admissÃ£o.'})

        return attrs


class EmployeePositionHRSerializer(EmployeePositionSerializer):
    class Meta(EmployeePositionSerializer.Meta):
        fields = EmployeePositionSerializer.Meta.fields


class EmployeeHRSerializer(EmployeeSerializer):
    class Meta(EmployeeSerializer.Meta):
        fields = EmployeeSerializer.Meta.fields
        read_only_fields = EmployeeSerializer.Meta.read_only_fields


class TenantViewSet(viewsets.ModelViewSet):
    serializer_class = TenantSerializer
    permission_classes = [TenantPermissions]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Tenant.objects.all().order_by('-created_at')
        tenant = self.request.user.profile.tenant
        return Tenant.objects.filter(id=tenant.id)

    def perform_create(self, serializer):
        # superuser only (enforced by permission)
        tenant: Tenant = serializer.save(owner=self.request.user)
        # ensure slug
        if not tenant.slug:
            base = slugify(tenant.name) or 'tenant'
            slug = base
            i = 2
            while Tenant.objects.filter(slug=slug).exclude(pk=tenant.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            tenant.slug = slug
            tenant.save(update_fields=['slug'])


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsSuperOrTenantAdmin]

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None) or getattr(getattr(self.request.user, 'profile', None), 'tenant', None)
        if self.request.user.is_superuser:
            return User.objects.all().order_by('-date_joined')
        if not tenant:
            return User.objects.none()
        # users in tenant = profile.tenant
        return User.objects.filter(profile__tenant=tenant).order_by('email')

    def perform_create(self, serializer):
        data = serializer.validated_data
        profile_data = data.pop('profile', {})
        tenant_id = profile_data.get('tenant_id')
        full_name = profile_data.get('full_name', '')
        role = data.pop('role', None)
        password = data.pop('password', None)

        # Tenant assignment rules:
        # - superuser can choose tenant_id
        # - tenant admin creates users only inside their own tenant
        if self.request.user.is_superuser:
            tenant = Tenant.objects.filter(id=tenant_id).first() if tenant_id else None
        else:
            tenant = getattr(getattr(self.request.user, 'profile', None), 'tenant', None)

        # Create user
        user = User.objects.create_user(email=data['email'], password=password or User.objects.make_random_password())
        user.is_active = data.get('is_active', True)
        user.is_staff = data.get('is_staff', False)
        user.save()

        # Ensure profile
        profile, _ = Profile.objects.get_or_create(id=user)
        profile.full_name = full_name or profile.full_name
        if tenant:
            profile.tenant = tenant
        profile.save()

        # Optional role
        if tenant and role:
            UserRole.objects.get_or_create(user=user, tenant=tenant, role=role)

        # Return instance
        serializer.instance = user

    def _resolve_target_tenant(self, request):
        tenant = getattr(request, 'tenant', None)
        if tenant is not None:
            return tenant
        if not request.user.is_superuser:
            return None
        tenant_id = request.data.get('tenant_id') or request.query_params.get('tenant_id')
        if not tenant_id:
            return None
        return Tenant.objects.filter(id=tenant_id).first()

    def _can_manage_roles(self, request, tenant):
        if request.user.is_superuser:
            return True
        return UserRole.objects.filter(
            user=request.user,
            tenant=tenant,
            role__in=[AppRole.ADMIN, AppRole.OWNER],
        ).exists()

    @action(detail=True, methods=['get', 'put', 'patch'], url_path='access')
    def access(self, request, pk=None):
        user = self.get_object()

        if request.method == 'GET':
            tenant = self._resolve_target_tenant(request)
            if tenant is None and request.user.is_superuser:
                by_tenant = {}
                for ur in UserRole.objects.select_related('tenant').filter(user=user).order_by('tenant__name', 'role'):
                    tid = str(ur.tenant_id)
                    if tid not in by_tenant:
                        by_tenant[tid] = {
                            'tenant': {'id': tid, 'name': ur.tenant.name, 'slug': ur.tenant.slug},
                            'roles': [],
                        }
                    by_tenant[tid]['roles'].append(ur.role)
                return Response({'user_id': str(user.id), 'email': user.email, 'tenants': list(by_tenant.values())})

            if tenant is None:
                return Response({'detail': 'Tenant context is required.'}, status=400)
            if not self._can_manage_roles(request, tenant):
                return Response({'detail': 'You do not have permission to manage roles in this tenant.'}, status=403)

            roles = list(UserRole.objects.filter(user=user, tenant=tenant).values_list('role', flat=True))
            return Response(
                {
                    'user_id': str(user.id),
                    'email': user.email,
                    'tenant': {'id': str(tenant.id), 'name': tenant.name, 'slug': tenant.slug},
                    'roles': roles,
                }
            )

        tenant = self._resolve_target_tenant(request)
        if tenant is None:
            if request.user.is_superuser:
                return Response({'detail': 'tenant_id is required for superuser when X-Tenant-ID is not provided.'}, status=400)
            return Response({'detail': 'Tenant context is required.'}, status=400)

        if not self._can_manage_roles(request, tenant):
            return Response({'detail': 'You do not have permission to manage roles in this tenant.'}, status=403)

        roles_payload = request.data.get('roles')
        if roles_payload is None or not isinstance(roles_payload, list):
            return Response({'detail': 'roles must be a list.'}, status=400)

        normalized_roles = []
        valid_roles = {r[0] for r in AppRole.choices}
        for role in roles_payload:
            try:
                normalized = AppRole.normalize(str(role))
            except Exception:
                return Response({'detail': f'Invalid role: {role}'}, status=400)
            if normalized not in valid_roles:
                return Response({'detail': f'Invalid role: {role}'}, status=400)
            if normalized not in normalized_roles:
                normalized_roles.append(normalized)

        with transaction.atomic():
            current_qs = UserRole.objects.filter(user=user, tenant=tenant)
            current_roles = set(current_qs.values_list('role', flat=True))
            new_roles = set(normalized_roles)

            to_remove = current_roles - new_roles
            to_add = new_roles - current_roles

            if to_remove:
                current_qs.filter(role__in=to_remove).delete()
            for role in to_add:
                UserRole.objects.create(user=user, tenant=tenant, role=role)

            profile, _ = Profile.objects.get_or_create(id=user)
            if profile.tenant_id is None and new_roles:
                profile.tenant = tenant
                profile.save(update_fields=['tenant'])

        roles = list(UserRole.objects.filter(user=user, tenant=tenant).values_list('role', flat=True))
        return Response(
            {
                'user_id': str(user.id),
                'email': user.email,
                'tenant': {'id': str(tenant.id), 'name': tenant.name, 'slug': tenant.slug},
                'roles': roles,
            }
        )


class EmployeePositionViewSet(TenantScopedModelViewSet):
    queryset = EmployeePosition.objects.all().order_by('name')
    serializer_class = EmployeePositionHRSerializer
    permission_classes = [IsTenantMember, PositionAccessPermission]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']


class EmployeeViewSet(TenantScopedModelViewSet):
    queryset = Employee.objects.select_related('position', 'user').all().order_by('full_name')
    serializer_class = EmployeeHRSerializer
    permission_classes = [IsTenantMember, EmployeeAccessPermission]
    filterset_fields = ['position', 'is_active', 'user']
    search_fields = ['full_name', 'email', 'phone', 'document_id', 'user__email', 'position__name']
    ordering_fields = ['full_name', 'created_at', 'updated_at', 'hire_date']


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _build_response(self, request):
        u: User = request.user
        tenant = getattr(request, 'tenant', None) or getattr(getattr(u, 'profile', None), 'tenant', None)
        roles = list(UserRole.objects.filter(user=u, tenant=tenant).values_list('role', flat=True)) if tenant else []
        return Response({
            'id': str(u.id),
            'email': u.email,
            'full_name': getattr(getattr(u, 'profile', None), 'full_name', ''),
            'phone': getattr(getattr(u, 'profile', None), 'phone', '') or '',
            'oab': getattr(getattr(u, 'profile', None), 'oab', '') or '',
            'bio': getattr(getattr(u, 'profile', None), 'bio', '') or '',
            'tenant': {'id': str(tenant.id), 'name': tenant.name, 'slug': tenant.slug, 'owner_id': str(tenant.owner_id) if tenant.owner_id else None} if tenant else None,
            'roles': roles,
            'is_superuser': bool(u.is_superuser),
        })

    def get(self, request):
        return self._build_response(request)

    def patch(self, request):
        u: User = request.user
        data = request.data

        full_name = data.get('full_name')
        if full_name is not None:
            profile = getattr(u, 'profile', None)
            if profile:
                profile.full_name = str(full_name).strip()
                update_fields = ['full_name']
                for field in ('phone', 'oab', 'bio'):
                    if field in data:
                        setattr(profile, field, str(data[field]).strip())
                        update_fields.append(field)
                profile.save(update_fields=update_fields)

        if 'password' in data and data['password']:
            new_password = str(data['password']).strip()
            current_password = str(data.get('current_password', '')).strip()
            if not u.check_password(current_password):
                return Response({'detail': 'Senha atual incorreta.'}, status=400)
            if len(new_password) < 8:
                return Response({'detail': 'A nova senha deve ter ao menos 8 caracteres.'}, status=400)
            u.set_password(new_password)
            u.save(update_fields=['password'])

        return self._build_response(request)


class AcceptLGPDView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.lgpd_accepted_at = timezone.now()
        user.save(update_fields=['lgpd_accepted_at'])
        return Response({'ok': True, 'lgpd_accepted_at': user.lgpd_accepted_at.isoformat()})


class AccessControlTypesView(APIView):
    """List available access control types (roles) for UI checkboxes/selectors."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        role_items = [{'code': code, 'label': label} for code, label in AppRole.choices]
        return Response(
            {
                'access_controls': role_items,
                'permissions': [{'code': code, 'label': code} for code in ACCESS_PERMISSION_CODES],
                'legacy_aliases': {
                    'socio': AppRole.OWNER.value,
                    'owner': AppRole.OWNER.value,
                    'admin': AppRole.ADMIN.value,
                    'advogado': AppRole.LAWYER.value,
                    'lawyer': AppRole.LAWYER.value,
                    'assistente': AppRole.ASSISTANT.value,
                    'assistant': AppRole.ASSISTANT.value,
                    'financeiro': AppRole.FINANCE.value,
                    'finance': AppRole.FINANCE.value,
                    'cliente': AppRole.CLIENT.value,
                    'client': AppRole.CLIENT.value,
                },
                'default_selection': [AppRole.CLIENT.value],
            }
        )
