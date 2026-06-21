import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0005_accountspayable_employee'),
        ('core', '0001_initial'),
        ('clients', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='NFSe',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('provider', models.CharField(default='nuvemfiscal', max_length=20)),
                ('external_id', models.CharField(blank=True, max_length=255, null=True)),
                ('numero_nota', models.CharField(blank=True, max_length=50, null=True)),
                ('serie', models.CharField(blank=True, max_length=10, null=True)),
                ('valor_servico', models.DecimalField(decimal_places=2, max_digits=15)),
                ('descricao_servico', models.TextField()),
                ('codigo_servico', models.CharField(blank=True, max_length=20, null=True)),
                ('aliquota_iss', models.DecimalField(blank=True, decimal_places=4, max_digits=5, null=True)),
                ('competencia', models.DateField()),
                ('status', models.CharField(
                    choices=[
                        ('rascunho', 'Rascunho'),
                        ('emitida', 'Emitida'),
                        ('cancelada', 'Cancelada'),
                        ('erro', 'Erro'),
                    ],
                    default='rascunho',
                    max_length=20,
                )),
                ('pdf_url', models.URLField(blank=True, null=True)),
                ('xml_url', models.URLField(blank=True, null=True)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='nfses', to='core.tenant')),
                ('invoice', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nfses', to='finance.invoice')),
                ('receivable', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nfses', to='finance.accountsreceivable')),
                ('client', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nfses', to='clients.client')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='nfses_created', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['tenant', 'status', 'created_at'], name='finance_nfs_tenant__status_idx'),
                    models.Index(fields=['tenant', 'competencia'], name='finance_nfs_tenant__competencia_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='PlanoContas',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('codigo', models.CharField(max_length=20)),
                ('nome', models.CharField(max_length=255)),
                ('tipo', models.CharField(
                    choices=[
                        ('ativo', 'Ativo'),
                        ('passivo', 'Passivo'),
                        ('receita', 'Receita'),
                        ('despesa', 'Despesa'),
                        ('patrimonio', 'Patrimônio'),
                    ],
                    max_length=20,
                )),
                ('is_synthetic', models.BooleanField(default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='plano_contas', to='core.tenant')),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='filhos', to='finance.planocontas')),
            ],
            options={
                'ordering': ['codigo'],
                'unique_together': {('tenant', 'codigo')},
            },
        ),
        migrations.CreateModel(
            name='LancamentoContabil',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('data', models.DateField()),
                ('historico', models.TextField()),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lancamentos_contabeis', to='core.tenant')),
                ('receivable', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lancamentos', to='finance.accountsreceivable')),
                ('payable', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lancamentos', to='finance.accountspayable')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='lancamentos_created', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-data', '-created_at'],
                'indexes': [
                    models.Index(fields=['tenant', 'data'], name='finance_lan_tenant__data_idx'),
                ],
            },
        ),
        migrations.CreateModel(
            name='LancamentoLinha',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('natureza', models.CharField(choices=[('debito', 'Débito'), ('credito', 'Crédito')], max_length=10)),
                ('valor', models.DecimalField(decimal_places=2, max_digits=15)),
                ('lancamento', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='linhas', to='finance.lancamentocontabil')),
                ('conta', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='linhas', to='finance.planocontas')),
            ],
        ),
    ]
