# Initial migration for Customer.
#
# NOTE: authored by hand (no Python runtime in this workspace).
# Verify locally with:  python manage.py makemigrations --check
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Customer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(editable=False, max_length=12, unique=True)),
                ("name", models.CharField(max_length=150)),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("whatsapp", models.CharField(blank=True, max_length=20)),
                ("place", models.CharField(max_length=100)),
                ("address", models.CharField(blank=True, max_length=255)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.AddIndex(
            model_name="customer",
            index=models.Index(fields=["name"], name="customer_name_idx"),
        ),
        migrations.AddConstraint(
            model_name="customer",
            constraint=models.CheckConstraint(
                condition=models.Q(("phone__gt", "")) | models.Q(("whatsapp__gt", "")),
                name="customer_requires_contact",
            ),
        ),
    ]
