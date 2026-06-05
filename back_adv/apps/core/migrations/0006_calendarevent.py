from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):
    dependencies = [
        ('core', '0005_landingpage_landinglead'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CalendarEvent',
            fields=[
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('deleted_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('start_at', models.DateTimeField()),
                ('end_at', models.DateTimeField(blank=True, null=True)),
                ('all_day', models.BooleanField(default=False)),
                ('location', models.CharField(blank=True, default='', max_length=255)),
                ('color', models.CharField(blank=True, default='', max_length=20)),
                ('kind', models.CharField(choices=[('EVENT', 'Evento'), ('HEARING', 'Audiência')], default='EVENT', max_length=16)),
                ('process_id_ref', models.UUIDField(blank=True, null=True)),
                ('hearing_id_ref', models.UUIDField(blank=True, null=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_calendar_events', to=settings.AUTH_USER_MODEL)),
                ('deleted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deleted_calendarevent_set', to=settings.AUTH_USER_MODEL)),
                ('tenant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='calendar_events', to='core.tenant')),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='updated_calendar_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['start_at']},
        ),
        migrations.AddIndex(
            model_name='calendarevent',
            index=models.Index(fields=['tenant', 'start_at'], name='core_calend_tenant__start_a_4b2286_idx'),
        ),
        migrations.AddIndex(
            model_name='calendarevent',
            index=models.Index(fields=['tenant', 'kind', 'start_at'], name='core_calend_tenant__kind_74072b_idx'),
        ),
    ]
