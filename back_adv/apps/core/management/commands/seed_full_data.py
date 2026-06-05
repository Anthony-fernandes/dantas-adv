from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.models import AppRole, Employee, EmployeePosition, Profile, UserRole
from apps.clients.models import Client, ClientStatus, ClientType
from apps.core.models import LandingPage, Tenant
from apps.finance.models import (
    AccountsPayable,
    AccountsReceivable,
    FinancialStatus,
    Invoice,
    InvoiceStatus,
    Payment,
    PaymentMethod,
    ReceivableInstallment,
)
from apps.processes.models import (
    Deadline,
    DeadlinePriority,
    DeadlineStatus,
    Hearing,
    HearingModality,
    HearingStatus,
    LegalCause,
    Movement,
    MovementType,
    ProbabilityLevel,
    Process,
    ProcessArea,
    ProcessPhase,
    ProcessStatus,
)


class Command(BaseCommand):
    help = "Populate a complete demo dataset: company, HR, legal, hearings, and finance."

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

        owner = self._ensure_user(email=email, password=password, full_name="Anthony Fernandes", superuser=True)
        tenant = self._ensure_tenant(owner=owner, tenant_name=tenant_name, tenant_slug=tenant_slug)
        self._ensure_user_access(owner, tenant, [AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.FINANCE, AppRole.ASSISTANT])

        # Team users
        lawyer_user = self._ensure_user("lawyer@silva.adv.br", "Lawyer@123", "Dra. Ana Oliveira")
        finance_user = self._ensure_user("finance@silva.adv.br", "Finance@123", "Maria Financeiro")
        portal_user = self._ensure_user("cliente@techsolutions.com", "Cliente@123", "Roberto Mendes")
        self._ensure_user_access(lawyer_user, tenant, [AppRole.LAWYER])
        self._ensure_user_access(finance_user, tenant, [AppRole.FINANCE])
        self._ensure_user_access(portal_user, tenant, [AppRole.CLIENT])

        self._ensure_landing(tenant)
        causes = self._ensure_causes(tenant)
        positions = self._ensure_positions(tenant)
        employees = self._ensure_employees(tenant, positions, lawyer_user, finance_user)
        clients = self._ensure_clients(tenant, owner, portal_user)
        processes = self._ensure_processes(tenant, clients, causes, lawyer_user)
        self._ensure_process_events(tenant, processes, lawyer_user)
        self._ensure_financial(tenant, clients, processes, employees, finance_user)

        self.stdout.write(self.style.SUCCESS("Seed completo concluido."))
        self.stdout.write(f"Tenant: {tenant.name} ({tenant.slug})")
        self.stdout.write(f"Users: owner={owner.email}, lawyer={lawyer_user.email}, finance={finance_user.email}, portal={portal_user.email}")
        self.stdout.write(f"Records: causes={len(causes)}, employees={len(employees)}, clients={len(clients)}, processes={len(processes)}")

    def _ensure_user(self, email: str, password: str, full_name: str, superuser: bool = False):
        User = get_user_model()
        user = User.objects.filter(email=email).first()
        if user is None:
            user = User.objects.create_user(
                email=email,
                username=email,
                password=password,
                is_staff=True,
                is_superuser=superuser,
                is_active=True,
            )
        else:
            user.username = user.username or email
            user.is_staff = True
            if superuser:
                user.is_superuser = True
            user.is_active = True
            user.set_password(password)
            user.save(update_fields=["username", "is_staff", "is_superuser", "is_active", "password"])
        return user

    def _ensure_tenant(self, owner, tenant_name: str, tenant_slug: str):
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
                settings={"map_embed_url": "https://www.google.com/maps?q=Av.+Paulista,+1000,+Sao+Paulo&output=embed"},
            )
            return tenant

        tenant.name = tenant.name or tenant_name
        tenant.slug = tenant.slug or tenant_slug
        tenant.owner = owner
        tenant.cnpj = tenant.cnpj or "00.000.000/0001-00"
        tenant.phone = tenant.phone or "(83) 99999-0000"
        tenant.email = tenant.email or "contato@silva.adv.br"
        tenant.logo_url = tenant.logo_url or "https://dummyimage.com/256x256/0f172a/ffffff&text=S%26A"
        tenant.address = tenant.address or {"line1": "Av. Paulista, 1000", "city": "Sao Paulo", "state": "SP", "cep": "01310-100"}
        tenant.settings = tenant.settings or {"map_embed_url": "https://www.google.com/maps?q=Av.+Paulista,+1000,+Sao+Paulo&output=embed"}
        tenant.save()
        tenant.ensure_slug()
        tenant.refresh_from_db()
        return tenant

    def _ensure_user_access(self, user, tenant, roles: list[str]):
        Profile.objects.update_or_create(id=user, defaults={"full_name": user.email.split("@")[0], "tenant": tenant})
        for role in roles:
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
        addr = tenant.address or {}
        page.contact_address = ", ".join([x for x in [addr.get("line1"), addr.get("city"), addr.get("state")] if x])
        page.save()

    def _ensure_causes(self, tenant):
        data = [
            ("Direito Civel", ProcessArea.CIVEL, "Acoes civeis e contratos."),
            ("Direito Trabalhista", ProcessArea.TRABALHISTA, "Reclamacoes e consultoria trabalhista."),
            ("Direito Tributario", ProcessArea.TRIBUTARIO, "Contencioso e planejamento tributario."),
        ]
        out = []
        for name, area, desc in data:
            obj, _ = LegalCause.objects.update_or_create(
                tenant=tenant,
                name=name,
                defaults={"area": area, "description": desc, "is_active": True},
            )
            out.append(obj)
        return out

    def _ensure_positions(self, tenant):
        pos_adv, _ = EmployeePosition.objects.update_or_create(
            tenant=tenant, name="Advogado", defaults={"description": "Atuacao juridica", "salario_base": Decimal("6500.00"), "is_active": True}
        )
        pos_fin, _ = EmployeePosition.objects.update_or_create(
            tenant=tenant, name="Financeiro", defaults={"description": "Controle financeiro", "salario_base": Decimal("4200.00"), "is_active": True}
        )
        pos_rec, _ = EmployeePosition.objects.update_or_create(
            tenant=tenant, name="Recepcionista", defaults={"description": "Atendimento inicial", "salario_base": Decimal("2200.00"), "is_active": True}
        )
        return {"advogado": pos_adv, "financeiro": pos_fin, "recepcionista": pos_rec}

    def _ensure_employees(self, tenant, positions, lawyer_user, finance_user):
        emp_law, _ = Employee.objects.update_or_create(
            tenant=tenant,
            email="ana@silva.adv.br",
            defaults={
                "position": positions["advogado"],
                "user": lawyer_user,
                "full_name": "Dra. Ana Oliveira",
                "phone": "(11) 99999-0002",
                "document_id": "222.222.222-22",
                "hire_date": date.today() - timedelta(days=600),
                "salario": Decimal("7200.00"),
                "is_active": True,
            },
        )
        emp_fin, _ = Employee.objects.update_or_create(
            tenant=tenant,
            email="maria.finance@silva.adv.br",
            defaults={
                "position": positions["financeiro"],
                "user": finance_user,
                "full_name": "Maria Financeiro",
                "phone": "(11) 99999-0004",
                "document_id": "444.444.444-44",
                "hire_date": date.today() - timedelta(days=400),
                "salario": Decimal("4800.00"),
                "is_active": True,
            },
        )
        emp_rec, _ = Employee.objects.update_or_create(
            tenant=tenant,
            email="atendimento@silva.adv.br",
            defaults={
                "position": positions["recepcionista"],
                "full_name": "Maria Atendimento",
                "phone": "(11) 99999-0003",
                "document_id": "333.333.333-33",
                "hire_date": date.today() - timedelta(days=300),
                "salario": Decimal("2500.00"),
                "is_active": True,
            },
        )
        return {"lawyer": emp_law, "finance": emp_fin, "reception": emp_rec}

    def _ensure_clients(self, tenant, owner, portal_user):
        c1, _ = Client.objects.update_or_create(
            tenant=tenant,
            doc="12.345.678/0001-90",
            defaults={
                "type": ClientType.PJ,
                "name": "Tech Solutions Ltda",
                "trade_name": "Tech Solutions",
                "email": "contato@techsolutions.com",
                "whatsapp": "(11) 98888-0001",
                "status": ClientStatus.ATIVO,
                "responsible_user": owner,
                "portal_user": portal_user,
                "address": {"city": "Sao Paulo", "state": "SP"},
            },
        )
        c2, _ = Client.objects.update_or_create(
            tenant=tenant,
            doc="123.456.789-00",
            defaults={
                "type": ClientType.PF,
                "name": "Joao Pereira",
                "email": "joao@email.com",
                "whatsapp": "(11) 97777-0002",
                "status": ClientStatus.ATIVO,
                "responsible_user": owner,
            },
        )
        return {"tech": c1, "joao": c2}

    def _ensure_processes(self, tenant, clients, causes, lawyer_user):
        by_name = {c.name: c for c in causes}
        p1, _ = Process.objects.update_or_create(
            tenant=tenant,
            cnj="0001234-56.2024.8.26.0100",
            defaults={
                "court": "TJSP",
                "class_name": "Acao de Cobranca",
                "subject": "Honorarios em atraso",
                "area": ProcessArea.CIVEL,
                "phase": ProcessPhase.CONHECIMENTO,
                "status": ProcessStatus.EM_ANDAMENTO,
                "cause": by_name.get("Direito Civel"),
                "cause_value": Decimal("150000.00"),
                "probability": ProbabilityLevel.ALTA,
                "plaintiff": clients["tech"].name,
                "defendant": "Empresa XYZ",
                "client": clients["tech"],
                "responsible_lawyer": lawyer_user,
                "notes": "Processo prioritario.",
                "created_by": lawyer_user,
                "updated_by": lawyer_user,
            },
        )
        p2, _ = Process.objects.update_or_create(
            tenant=tenant,
            cnj="0005678-90.2024.5.02.0001",
            defaults={
                "court": "TRT-2",
                "class_name": "Reclamacao Trabalhista",
                "subject": "Horas extras",
                "area": ProcessArea.TRABALHISTA,
                "phase": ProcessPhase.RECURSAL,
                "status": ProcessStatus.EM_ANDAMENTO,
                "cause": by_name.get("Direito Trabalhista"),
                "cause_value": Decimal("85000.00"),
                "probability": ProbabilityLevel.MEDIA,
                "plaintiff": clients["joao"].name,
                "defendant": "Empresa ABC",
                "client": clients["joao"],
                "responsible_lawyer": lawyer_user,
                "created_by": lawyer_user,
                "updated_by": lawyer_user,
            },
        )
        return {"p1": p1, "p2": p2}

    def _ensure_process_events(self, tenant, processes, lawyer_user):
        now = timezone.now()
        Movement.objects.update_or_create(
            tenant=tenant,
            process=processes["p1"],
            type=MovementType.PETICAO,
            date=now.date(),
            defaults={"description": "Peticao inicial protocolada.", "created_by": lawyer_user},
        )
        Deadline.objects.update_or_create(
            tenant=tenant,
            process=processes["p1"],
            description="Prazo para manifestacao",
            defaults={
                "due_date": now + timedelta(days=5),
                "priority": DeadlinePriority.ALTA,
                "status": DeadlineStatus.PENDENTE,
                "responsible": lawyer_user,
                "created_by": lawyer_user,
                "updated_by": lawyer_user,
            },
        )
        Hearing.objects.update_or_create(
            tenant=tenant,
            process=processes["p2"],
            type="Instrucao",
            defaults={
                "hearing_date": now + timedelta(days=10),
                "modality": HearingModality.PRESENCIAL,
                "status": HearingStatus.AGENDADA,
                "location": "Forum Trabalhista - Sala 5",
                "responsible": lawyer_user,
                "created_by": lawyer_user,
                "updated_by": lawyer_user,
            },
        )

    def _ensure_financial(self, tenant, clients, processes, employees, finance_user):
        receivable, _ = AccountsReceivable.objects.update_or_create(
            tenant=tenant,
            client=clients["tech"],
            process=processes["p1"],
            description="Honorarios contratuais - parcela 1/3",
            defaults={
                "category": "honorarios",
                "amount": Decimal("15000.00"),
                "due_date": date.today() + timedelta(days=7),
                "status": FinancialStatus.ABERTA,
                "installments_count": 3,
                "installment_interval_days": 30,
                "created_by": finance_user,
                "updated_by": finance_user,
            },
        )
        for n in [1, 2, 3]:
            ReceivableInstallment.objects.update_or_create(
                tenant=tenant,
                receivable=receivable,
                number=n,
                defaults={
                    "due_date": receivable.due_date + timedelta(days=(n - 1) * 30),
                    "amount": Decimal("5000.00"),
                    "status": FinancialStatus.ABERTA,
                },
            )

        payable, _ = AccountsPayable.objects.update_or_create(
            tenant=tenant,
            description="Pagamento salarial - Financeiro",
            due_date=date.today() + timedelta(days=3),
            defaults={
                "category": "folha",
                "supplier": "Colaborador",
                "employee": employees["finance"],
                "amount": Decimal("4800.00"),
                "status": FinancialStatus.ABERTA,
                "created_by": finance_user,
                "updated_by": finance_user,
            },
        )

        invoice, _ = Invoice.objects.update_or_create(
            tenant=tenant,
            client=clients["tech"],
            process=processes["p1"],
            due_date=date.today() + timedelta(days=7),
            amount=Decimal("15000.00"),
            defaults={
                "type": "NF",
                "issue_date": date.today(),
                "status": InvoiceStatus.EMITIDA,
                "items": [{"description": "Honorarios advocaticios", "amount": 15000}],
                "created_by": finance_user,
                "updated_by": finance_user,
            },
        )

        Payment.objects.update_or_create(
            tenant=tenant,
            receivable=receivable,
            invoice=invoice,
            client=clients["tech"],
            process=processes["p1"],
            payment_date=date.today(),
            amount=Decimal("5000.00"),
            defaults={
                "method": PaymentMethod.PIX,
                "notes": "Pagamento parcial primeira parcela.",
                "created_by": finance_user,
            },
        )
