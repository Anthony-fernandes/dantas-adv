from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.accounts.models import AppRole, Employee, EmployeePosition, Profile, UserRole
from apps.core.models import LandingPage, Tenant
from apps.processes.models import LegalCause, ProcessArea


class Command(BaseCommand):
    help = "Populate test data (tenant, landing, causes, positions, employees) in an idempotent way."

    def add_arguments(self, parser):
        parser.add_argument("--email", default="anthony.dn05@gmail.com")
        parser.add_argument("--password", default="Anthony-1305")
        parser.add_argument("--tenant-name", default="Silva & Associados")

    @transaction.atomic
    def handle(self, *args, **options):
        email = str(options["email"]).strip().lower()
        password = str(options["password"])
        tenant_name = str(options["tenant_name"]).strip()
        tenant_slug = slugify(tenant_name) or "tenant"

        user = self._ensure_user(email=email, password=password)
        tenant = self._ensure_tenant(owner=user, tenant_name=tenant_name, tenant_slug=tenant_slug)
        self._ensure_access(user=user, tenant=tenant)
        self._ensure_landing(tenant=tenant)
        self._ensure_causes(tenant=tenant)
        self._ensure_positions_and_employees(tenant=tenant)

        self.stdout.write(self.style.SUCCESS("Seed concluido com sucesso."))
        self.stdout.write(f"Tenant: {tenant.name} ({tenant.slug})")
        self.stdout.write(f"Admin: {user.email}")

    def _ensure_user(self, email: str, password: str):
        User = get_user_model()
        user = User.objects.filter(email=email).first()
        if user is None:
            user = User.objects.create_user(
                email=email,
                username=email,
                password=password,
                is_staff=True,
                is_superuser=True,
                is_active=True,
            )
            return user

        user.username = user.username or email
        user.is_staff = True
        user.is_active = True
        user.set_password(password)
        user.save(update_fields=["username", "is_staff", "is_active", "password"])
        return user

    def _ensure_tenant(self, owner, tenant_name: str, tenant_slug: str):
        # Project rule: only one company. Prefer existing tenant if present.
        tenant = Tenant.objects.order_by("created_at").first()
        if tenant is None:
            tenant = Tenant.objects.create(
                name=tenant_name,
                slug=tenant_slug,
                owner=owner,
                cnpj="00.000.000/0001-00",
                phone="(83) 99999-0000",
                email="contato@silva.adv.br",
                logo_url="https://dummyimage.com/256x256/0f172a/ffffff&text=S%26A",
                address={
                    "line1": "Av. Paulista, 1000",
                    "city": "Sao Paulo",
                    "state": "SP",
                    "cep": "01310-100",
                },
                settings={
                    "map_embed_url": "https://www.google.com/maps?q=Av.+Paulista,+1000,+Sao+Paulo&output=embed"
                },
            )
            return tenant

        tenant.name = tenant.name or tenant_name
        tenant.slug = tenant.slug or tenant_slug
        tenant.owner = owner
        tenant.cnpj = tenant.cnpj or "00.000.000/0001-00"
        tenant.phone = tenant.phone or "(83) 99999-0000"
        tenant.email = tenant.email or "contato@silva.adv.br"
        tenant.logo_url = tenant.logo_url or "https://dummyimage.com/256x256/0f172a/ffffff&text=S%26A"
        tenant.address = tenant.address or {
            "line1": "Av. Paulista, 1000",
            "city": "Sao Paulo",
            "state": "SP",
            "cep": "01310-100",
        }
        tenant.settings = tenant.settings or {
            "map_embed_url": "https://www.google.com/maps?q=Av.+Paulista,+1000,+Sao+Paulo&output=embed"
        }
        tenant.save()
        tenant.ensure_slug()
        tenant.refresh_from_db()
        return tenant

    def _ensure_access(self, user, tenant):
        Profile.objects.update_or_create(
            id=user,
            defaults={"full_name": "Anthony Fernandes", "tenant": tenant},
        )
        for role in [AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.FINANCE, AppRole.ASSISTANT]:
            UserRole.objects.get_or_create(user=user, tenant=tenant, role=role)

    def _ensure_landing(self, tenant):
        page, _ = LandingPage.objects.get_or_create(tenant=tenant)
        page.is_published = True
        page.brand_name = tenant.name
        page.hero_title = "Seu caso merece atenção, estratégia e defesa de verdade."
        page.hero_subtitle = "Atendimento jurídico claro e próximo para orientar seus direitos e buscar a melhor solução."
        page.primary_cta_label = "Agendar Consulta"
        page.primary_cta_url = "#contato"
        page.secondary_cta_label = "Falar no WhatsApp"
        page.secondary_cta_url = "https://wa.me/5583999990000"
        page.contact_phone = tenant.phone or ""
        page.contact_email = tenant.email or ""
        address = tenant.address or {}
        page.contact_address = ", ".join(
            [x for x in [address.get("line1"), address.get("city"), address.get("state")] if x]
        )
        page.differentials = [
            {"icon": "Scale", "title": "Estratégia jurídica", "desc": "Cada caso é analisado com cuidado para definir a melhor linha de atuação."},
            {"icon": "Shield", "title": "Transparência", "desc": "Explicamos riscos, prazos e próximos passos de forma objetiva."},
            {"icon": "Users", "title": "Atendimento próximo", "desc": "Você recebe orientação clara e acompanhamento em cada etapa do caso."},
        ]
        page.save()

    def _ensure_causes(self, tenant):
        causes = [
            ("Direito Civel", ProcessArea.CIVEL, "Acoes civeis e contratos."),
            ("Direito Trabalhista", ProcessArea.TRABALHISTA, "Reclamacoes e consultoria trabalhista."),
            ("Direito Tributario", ProcessArea.TRIBUTARIO, "Contencioso e planejamento tributario."),
        ]
        for name, area, description in causes:
            LegalCause.objects.update_or_create(
                tenant=tenant,
                name=name,
                defaults={"area": area, "description": description, "is_active": True},
            )

    def _ensure_positions_and_employees(self, tenant):
        pos_adv, _ = EmployeePosition.objects.update_or_create(
            tenant=tenant,
            name="Advogado",
            defaults={"description": "Atuacao juridica", "salario_base": "6500.00", "is_active": True},
        )
        pos_rec, _ = EmployeePosition.objects.update_or_create(
            tenant=tenant,
            name="Recepcionista",
            defaults={"description": "Atendimento inicial", "salario_base": "2200.00", "is_active": True},
        )

        Employee.objects.update_or_create(
            tenant=tenant,
            email="dr.joao@silva.adv.br",
            defaults={
                "position": pos_adv,
                "full_name": "Dr. Joao Silva",
                "phone": "(11) 99999-0001",
                "document_id": "111.111.111-11",
                "salario": "7800.00",
                "is_active": True,
            },
        )
        Employee.objects.update_or_create(
            tenant=tenant,
            email="ana@silva.adv.br",
            defaults={
                "position": pos_adv,
                "full_name": "Dra. Ana Oliveira",
                "phone": "(11) 99999-0002",
                "document_id": "222.222.222-22",
                "salario": "7200.00",
                "is_active": True,
            },
        )
        Employee.objects.update_or_create(
            tenant=tenant,
            email="atendimento@silva.adv.br",
            defaults={
                "position": pos_rec,
                "full_name": "Maria Atendimento",
                "phone": "(11) 99999-0003",
                "document_id": "333.333.333-33",
                "salario": "2500.00",
                "is_active": True,
            },
        )
