import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0007_alter_document_file'),
        ('core', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SignatureRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('provider', models.CharField(default='internal', max_length=30)),
                ('deadline', models.DateField(blank=True, null=True)),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('sent', 'Sent'),
                        ('completed', 'Completed'),
                        ('cancelled', 'Cancelled'),
                    ],
                    default='pending',
                    max_length=20,
                )),
                ('signing_url', models.URLField(blank=True, null=True)),
                ('external_id', models.CharField(blank=True, max_length=255, null=True)),
                ('signers', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='signature_requests',
                    to='core.tenant',
                )),
                ('document', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='signature_requests',
                    to='documents.processrichdocument',
                )),
                ('created_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='created_signature_requests',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
