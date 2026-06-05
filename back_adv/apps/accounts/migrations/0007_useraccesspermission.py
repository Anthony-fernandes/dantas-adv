import uuid

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_rename_accounts_tenant_email_idx_accounts_te_tenant__11dded_idx_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserAccessPermission",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("code", models.CharField(max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "tenant",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="user_access_permissions", to="core.tenant"),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="access_permissions", to="accounts.user"),
                ),
            ],
            options={
                "unique_together": {("user", "tenant", "code")},
            },
        ),
        migrations.AddIndex(
            model_name="useraccesspermission",
            index=models.Index(fields=["tenant", "user"], name="accounts_us_tenant__94b3e7_idx"),
        ),
        migrations.AddIndex(
            model_name="useraccesspermission",
            index=models.Index(fields=["tenant", "code"], name="accounts_us_tenant__caa9bb_idx"),
        ),
    ]
