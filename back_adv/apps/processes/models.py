import uuid

from django.db import models

from apps.accounts.models import User
from apps.clients.models import Client
from apps.core.models import Tenant


class ProcessStatus(models.TextChoices):
    PRE_PROCESSUAL = "pre_processual", "Pre-processual"
    EM_ANDAMENTO = "em_andamento", "Em andamento"
    SUSPENSO = "suspenso", "Suspenso"
    FINALIZADO = "finalizado", "Finalizado"
    ARQUIVADO = "arquivado", "Arquivado"


class ProcessPhase(models.TextChoices):
    CONHECIMENTO = "conhecimento", "Conhecimento"
    RECURSAL = "recursal", "Recursal"
    EXECUCAO = "execucao", "Execucao"
    CUMPRIMENTO = "cumprimento", "Cumprimento"


class ProcessArea(models.TextChoices):
    CIVEL = "civel", "Civel"
    TRABALHISTA = "trabalhista", "Trabalhista"
    CRIMINAL = "criminal", "Criminal"
    TRIBUTARIO = "tributario", "Tributario"
    EMPRESARIAL = "empresarial", "Empresarial"
    FAMILIA = "familia", "Familia"
    CONSUMIDOR = "consumidor", "Consumidor"


class ProbabilityLevel(models.TextChoices):
    BAIXA = "baixa", "Baixa"
    MEDIA = "media", "Media"
    ALTA = "alta", "Alta"


class ProcessPriority(models.TextChoices):
    BAIXA = "baixa", "Baixa"
    MEDIA = "media", "Média"
    ALTA = "alta", "Alta"
    URGENTE = "urgente", "Urgente"


class Process(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="processes")
    cnj = models.CharField(max_length=60, blank=True, null=True)
    court = models.CharField(max_length=255, blank=True, null=True)
    jurisdiction = models.CharField(max_length=255, blank=True, null=True)
    court_division = models.CharField(max_length=255, blank=True, null=True)
    class_name = models.CharField(max_length=255, blank=True, null=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    cause = models.ForeignKey("LegalCause", on_delete=models.SET_NULL, blank=True, null=True, related_name="processes")
    area = models.CharField(max_length=20, choices=ProcessArea.choices, default=ProcessArea.CIVEL)
    phase = models.CharField(max_length=20, choices=ProcessPhase.choices, default=ProcessPhase.CONHECIMENTO)
    status = models.CharField(max_length=20, choices=ProcessStatus.choices, default=ProcessStatus.EM_ANDAMENTO)
    cause_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    probability = models.CharField(max_length=10, choices=ProbabilityLevel.choices, default=ProbabilityLevel.MEDIA)
    priority = models.CharField(max_length=10, choices=ProcessPriority.choices, default=ProcessPriority.MEDIA)
    plaintiff = models.CharField(max_length=255, blank=True, null=True)
    defendant = models.CharField(max_length=255, blank=True, null=True)
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, blank=True, null=True, related_name="processes")
    responsible_lawyer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="responsible_processes",
    )
    team_members = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="created_processes")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="updated_processes")
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="deleted_process")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "status", "created_at"]),
            models.Index(fields=["tenant", "updated_at"]),
            models.Index(fields=["tenant", "cnj"]),
            models.Index(fields=["tenant", "cause"]),
        ]

    @property
    def title(self) -> str:
        return self.subject or self.cnj or str(self.id)

    def __str__(self) -> str:
        return self.cnj or str(self.id)


class PartyRole(models.TextChoices):
    """Polo/papel da parte no processo, alinhado à prática forense."""

    AUTOR = "autor", "Autor / Requerente"
    REU = "reu", "Réu / Requerido"
    TERCEIRO = "terceiro", "Terceiro interessado"
    ASSISTENTE = "assistente", "Assistente"
    TESTEMUNHA = "testemunha", "Testemunha"
    PERITO = "perito", "Perito"
    MP = "mp", "Ministério Público"
    OUTRO = "outro", "Outro"


class ProcessParty(models.Model):
    """Parte do processo (N por processo), com papel, documento e advogado.

    Substitui o modelo simplista plaintiff/defendant por uma estrutura
    equivalente à de plataformas como ProJuris e Legal One.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="process_parties")
    process = models.ForeignKey("Process", on_delete=models.CASCADE, related_name="parties")
    role = models.CharField(max_length=20, choices=PartyRole.choices, default=PartyRole.AUTOR)
    name = models.CharField(max_length=255)
    doc = models.CharField(max_length=60, blank=True, null=True, help_text="CPF/CNPJ")
    is_client = models.BooleanField(default=False, help_text="Parte representada pelo escritório")
    client = models.ForeignKey(
        Client, on_delete=models.SET_NULL, blank=True, null=True, related_name="process_parties"
    )
    lawyer_name = models.CharField(max_length=255, blank=True, default="", help_text="Advogado da parte (quando adverso)")
    lawyer_oab = models.CharField(max_length=40, blank=True, default="", help_text="Inscrição OAB (ex.: SP 123456)")
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["role", "name"]
        indexes = [
            models.Index(fields=["tenant", "process"]),
            models.Index(fields=["tenant", "name"]),
            models.Index(fields=["tenant", "doc"]),
        ]

    def __str__(self) -> str:
        return f"{self.get_role_display()}: {self.name}"


class MovementType(models.TextChoices):
    DESPACHO = "despacho", "Despacho"
    DECISAO = "decisao", "Decisao"
    SENTENCA = "sentenca", "Sentenca"
    PETICAO = "peticao", "Peticao"
    AUDIENCIA = "audiencia", "Audiencia"
    PUBLICACAO = "publicacao", "Publicacao"
    OUTRO = "outro", "Outro"


class LegalCause(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="legal_causes")
    name = models.CharField(max_length=255)
    area = models.CharField(max_length=20, choices=ProcessArea.choices, default=ProcessArea.CIVEL)
    description = models.TextField(blank=True, null=True)
    landing_icon = models.CharField(max_length=64, blank=True, default="Scale")
    landing_link = models.CharField(max_length=255, blank=True, default="")
    display_order = models.PositiveIntegerField(default=0)
    show_on_landing = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("tenant", "name"),)
        ordering = ["display_order", "name"]
        indexes = [
            models.Index(fields=["tenant", "name"]),
            models.Index(fields=["tenant", "area"]),
            models.Index(fields=["tenant", "is_active"]),
            models.Index(fields=["tenant", "show_on_landing", "display_order"]),
        ]

    def __str__(self) -> str:
        return self.name


class Movement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="movements")
    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="movements")
    type = models.CharField(max_length=20, choices=MovementType.choices, default=MovementType.OUTRO)
    description = models.TextField()
    date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="created_movements")
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="deleted_movement")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "process", "date"]),
            models.Index(fields=["tenant", "created_at"]),
        ]


class DeadlinePriority(models.TextChoices):
    BAIXA = "baixa", "Baixa"
    MEDIA = "media", "Media"
    ALTA = "alta", "Alta"
    URGENTE = "urgente", "Urgente"


class DeadlineStatus(models.TextChoices):
    PENDENTE = "pendente", "Pendente"
    CONCLUIDO = "concluido", "Concluido"
    ATRASADO = "atrasado", "Atrasado"


class Deadline(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="deadlines")
    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="deadlines")
    description = models.TextField()
    due_date = models.DateTimeField()
    priority = models.CharField(max_length=10, choices=DeadlinePriority.choices, default=DeadlinePriority.MEDIA)
    status = models.CharField(max_length=10, choices=DeadlineStatus.choices, default=DeadlineStatus.PENDENTE)
    responsible = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="deadlines")
    alert_channels = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="created_deadlines")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="updated_deadlines")
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="deleted_deadline")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "status", "due_date"]),
            models.Index(fields=["tenant", "process", "due_date"]),
            models.Index(fields=["tenant", "created_at"]),
        ]


class HearingModality(models.TextChoices):
    PRESENCIAL = "presencial", "Presencial"
    ONLINE = "online", "Online"
    HIBRIDA = "hibrida", "Hibrida"


class HearingStatus(models.TextChoices):
    AGENDADA = "agendada", "Agendada"
    CONFIRMADA = "confirmada", "Confirmada"
    REALIZADA = "realizada", "Realizada"
    REDESIGNADA = "redesignada", "Redesignada"
    CANCELADA = "cancelada", "Cancelada"


class Hearing(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="hearings")
    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="hearings")
    type = models.CharField(max_length=255, blank=True, null=True)
    hearing_date = models.DateTimeField()
    end_date = models.DateTimeField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    online_link = models.URLField(blank=True, null=True)
    modality = models.CharField(max_length=12, choices=HearingModality.choices, default=HearingModality.PRESENCIAL)
    status = models.CharField(max_length=12, choices=HearingStatus.choices, default=HearingStatus.AGENDADA)
    responsible = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="hearings")
    participants = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="created_hearings")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="updated_hearings")
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey("accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="deleted_hearing")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "status", "hearing_date"]),
            models.Index(fields=["tenant", "process", "hearing_date"]),
            models.Index(fields=["tenant", "created_at"]),
        ]


class DeadlineAlert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="deadline_alerts")
    deadline = models.ForeignKey(Deadline, on_delete=models.CASCADE, related_name="alerts")
    window_hours = models.IntegerField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("deadline", "window_hours"),)
        indexes = [
            models.Index(fields=["tenant", "sent_at"]),
            models.Index(fields=["deadline", "window_hours"]),
        ]

    def __str__(self) -> str:
        return f"{self.deadline_id} @ {self.window_hours}h"


class TaskPriority(models.TextChoices):
    BAIXA = "baixa", "Baixa"
    MEDIA = "media", "Media"
    ALTA = "alta", "Alta"
    URGENTE = "urgente", "Urgente"


class TaskStatus(models.TextChoices):
    PENDENTE = "pendente", "Pendente"
    EM_ANDAMENTO = "em_andamento", "Em andamento"
    CONCLUIDA = "concluida", "Concluida"
    CANCELADA = "cancelada", "Cancelada"


class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="tasks")
    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="tasks", blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=TaskPriority.choices, default=TaskPriority.MEDIA)
    status = models.CharField(max_length=12, choices=TaskStatus.choices, default=TaskStatus.PENDENTE)
    due_date = models.DateField(blank=True, null=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="assigned_tasks")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="created_tasks")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="updated_tasks")
    completed_at = models.DateTimeField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "status", "due_date"]),
            models.Index(fields=["tenant", "process", "status"]),
            models.Index(fields=["tenant", "created_at"]),
        ]

    def __str__(self) -> str:
        return self.title


class ActivityType(models.TextChoices):
    DILIGENCIA = "diligencia", "Diligência"
    PESQUISA = "pesquisa", "Pesquisa"
    REUNIAO = "reuniao", "Reunião"
    AUDIENCIA = "audiencia", "Audiência"
    PETICAO = "peticao", "Petição"
    CONSULTA = "consulta", "Consulta"
    OUTROS = "outros", "Outros"


class TimeEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="time_entries")
    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name="time_entries", blank=True, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="time_entries")
    description = models.TextField(blank=True, null=True)
    activity_type = models.CharField(max_length=20, choices=ActivityType.choices, default=ActivityType.OUTROS)
    date = models.DateField()
    hours = models.DecimalField(max_digits=5, decimal_places=2)
    billable = models.BooleanField(default=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "user", "date"]),
            models.Index(fields=["tenant", "process", "date"]),
            models.Index(fields=["tenant", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} — {self.hours}h em {self.date}"


class TribunalSync(models.Model):
    class Provider(models.TextChoices):
        PJE = 'pje', 'PJe'
        ESAJ = 'esaj', 'e-SAJ'
        PROJUDI = 'projudi', 'Projudi'
        MANUAL = 'manual', 'Manual'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='tribunal_syncs')
    process = models.ForeignKey(Process, on_delete=models.CASCADE, related_name='tribunal_syncs')
    provider = models.CharField(max_length=20, choices=Provider.choices)
    external_process_number = models.CharField(max_length=50)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(max_length=20, default='pending')
    error_message = models.TextField(blank=True, null=True)
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'process']),
            models.Index(fields=['tenant', 'sync_status']),
        ]
