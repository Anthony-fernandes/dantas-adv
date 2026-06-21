import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('processes', '0010_time_entry_model'),
        ('core', '0010_task_model'),
    ]

    operations = [
        migrations.CreateModel(
            name='TribunalSync',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('provider', models.CharField(
                    choices=[
                        ('pje', 'PJe'),
                        ('esaj', 'e-SAJ'),
                        ('projudi', 'Projudi'),
                        ('manual', 'Manual'),
                    ],
                    max_length=20,
                )),
                ('external_process_number', models.CharField(max_length=50)),
                ('last_synced_at', models.DateTimeField(blank=True, null=True)),
                ('sync_status', models.CharField(default='pending', max_length=20)),
                ('error_message', models.TextField(blank=True, null=True)),
                ('raw_response', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tribunal_syncs', to='core.tenant')),
                ('process', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tribunal_syncs', to='processes.process')),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['tenant', 'process'], name='processes_tr_tenant_process_idx'),
                    models.Index(fields=['tenant', 'sync_status'], name='processes_tr_tenant_syncstatus_idx'),
                ],
            },
        ),
    ]
