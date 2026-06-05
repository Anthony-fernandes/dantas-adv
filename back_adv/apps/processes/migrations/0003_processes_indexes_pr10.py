from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('processes', '0002_deadline_alert'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='process',
            index=models.Index(fields=['tenant', 'status', 'created_at'], name='proc_tenant_status_created'),
        ),
        migrations.AddIndex(
            model_name='process',
            index=models.Index(fields=['tenant', 'updated_at'], name='proc_tenant_updated'),
        ),
        migrations.AddIndex(
            model_name='process',
            index=models.Index(fields=['tenant', 'cnj'], name='proc_tenant_cnj'),
        ),
        migrations.AddIndex(
            model_name='movement',
            index=models.Index(fields=['tenant', 'process', 'date'], name='mov_tenant_process_date'),
        ),
        migrations.AddIndex(
            model_name='movement',
            index=models.Index(fields=['tenant', 'created_at'], name='mov_tenant_created'),
        ),
        migrations.AddIndex(
            model_name='deadline',
            index=models.Index(fields=['tenant', 'status', 'due_date'], name='dl_tenant_status_due'),
        ),
        migrations.AddIndex(
            model_name='deadline',
            index=models.Index(fields=['tenant', 'process', 'due_date'], name='dl_tenant_process_due'),
        ),
        migrations.AddIndex(
            model_name='deadline',
            index=models.Index(fields=['tenant', 'created_at'], name='dl_tenant_created'),
        ),
        migrations.AddIndex(
            model_name='hearing',
            index=models.Index(fields=['tenant', 'status', 'hearing_date'], name='hear_tenant_status_date'),
        ),
        migrations.AddIndex(
            model_name='hearing',
            index=models.Index(fields=['tenant', 'process', 'hearing_date'], name='hear_tenant_process_date'),
        ),
        migrations.AddIndex(
            model_name='hearing',
            index=models.Index(fields=['tenant', 'created_at'], name='hear_tenant_created'),
        ),
    ]
