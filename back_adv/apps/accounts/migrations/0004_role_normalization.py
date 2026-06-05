from django.db import migrations


def forwards(apps, schema_editor):
    UserRole = apps.get_model('accounts', 'UserRole')
    TenantInvite = apps.get_model('accounts', 'TenantInvite')

    role_map = {
        'socio': 'OWNER',
        'admin': 'ADMIN',
        'advogado': 'LAWYER',
        'assistente': 'ASSISTANT',
        'financeiro': 'FINANCE',
        'cliente': 'CLIENT',
        # Already normalized:
        'OWNER': 'OWNER',
        'ADMIN': 'ADMIN',
        'LAWYER': 'LAWYER',
        'ASSISTANT': 'ASSISTANT',
        'FINANCE': 'FINANCE',
        'CLIENT': 'CLIENT',
    }

    for Model in (UserRole, TenantInvite):
        for old, new in role_map.items():
            Model.objects.filter(role=old).update(role=new)


def backwards(apps, schema_editor):
    # Non-destructive: keep normalized roles.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_tenantinvite'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
