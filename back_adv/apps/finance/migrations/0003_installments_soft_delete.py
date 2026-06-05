import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('finance', '0002_add_actor_fields_pr13'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0003_audit_event'),
    ]

    operations = [
        migrations.AddField(
            model_name='accountsreceivable',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True, db_index=True),
        ),
        migrations.AddField(
            model_name='accountsreceivable',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deleted_accountsreceivable', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='accountspayable',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True, db_index=True),
        ),
        migrations.AddField(
            model_name='accountspayable',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deleted_accountspayable', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='invoice',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True, db_index=True),
        ),
        migrations.AddField(
            model_name='invoice',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deleted_invoice', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='payment',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True, db_index=True),
        ),
        migrations.AddField(
            model_name='payment',
            name='deleted_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deleted_payment', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='accountsreceivable',
            name='installments_count',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='accountsreceivable',
            name='installment_interval_days',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='accountsreceivable',
            name='penalty_rate',
            field=models.DecimalField(decimal_places=2, default=2.0, max_digits=6),
        ),
        migrations.AddField(
            model_name='accountsreceivable',
            name='interest_rate_daily',
            field=models.DecimalField(decimal_places=4, default=0.0333, max_digits=6),
        ),
        migrations.CreateModel(
            name='ReceivableInstallment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('number', models.IntegerField()),
                ('due_date', models.DateField()),
                ('amount', models.DecimalField(decimal_places=2, max_digits=15)),
                ('status', models.CharField(choices=[('ABERTA', 'Aberta'), ('PAGA', 'Paga'), ('VENCIDA', 'Vencida'), ('CANCELADA', 'Cancelada')], default='ABERTA', max_length=12)),
                ('paid_date', models.DateField(blank=True, null=True)),
                ('paid_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=15, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deleted_receivable_installment', to=settings.AUTH_USER_MODEL)),
                ('receivable', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='installments', to='finance.accountsreceivable')),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='receivable_installments', to='core.tenant')),
            ],
            options={
                'unique_together': {('receivable', 'number')},
            },
        ),
        migrations.AddIndex(
            model_name='receivableinstallment',
            index=models.Index(fields=['tenant', 'receivable', 'due_date'], name='finance_rece_tenant__7c2b0e_idx'),
        ),
        migrations.AddIndex(
            model_name='receivableinstallment',
            index=models.Index(fields=['tenant', 'status', 'due_date'], name='finance_rece_tenant__2d2b6d_idx'),
        ),
        migrations.AddField(
            model_name='payment',
            name='installment',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='payments', to='finance.receivableinstallment'),
        ),
    ]
