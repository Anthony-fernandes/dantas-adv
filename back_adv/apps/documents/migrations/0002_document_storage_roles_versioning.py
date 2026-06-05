import uuid

from django.db import migrations, models


def _document_upload_to(instance, filename):
    # Keep migration self-contained; model will use the real callable.
    return ''


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='group_id',
            field=models.UUIDField(db_index=True, default=uuid.uuid4),
        ),
        migrations.AddField(
            model_name='document',
            name='title',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='file',
            field=models.FileField(blank=True, null=True, upload_to=_document_upload_to),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='document',
            name='is_latest',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='document',
            name='access_level',
            field=models.CharField(choices=[('TENANT', 'Tenant'), ('ROLES', 'Roles')], default='TENANT', max_length=16),
        ),
        migrations.AddField(
            model_name='document',
            name='allowed_roles',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['tenant', 'created_at'], name='documents_do_tenant__53f0f0_idx'),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['tenant', 'group_id'], name='documents_do_tenant__0d5f3c_idx'),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['tenant', 'process', 'created_at'], name='documents_do_tenant__f0b4f4_idx'),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(fields=['tenant', 'client', 'created_at'], name='documents_do_tenant__f1a365_idx'),
        ),
    ]
