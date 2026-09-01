# Initial migration for Product.
#
# NOTE: authored by hand (no Python runtime in this workspace).
# Verify locally with:  python manage.py makemigrations --check
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150)),
                ("category", models.CharField(max_length=100)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("unit", models.CharField(default="pc", max_length=20)),
                ("cost_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("selling_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(
                condition=models.Q(("cost_price__gte", 0)),
                name="product_cost_price_gte_0",
            ),
        ),
        migrations.AddConstraint(
            model_name="product",
            constraint=models.CheckConstraint(
                condition=models.Q(("selling_price__gte", models.F("cost_price"))),
                name="product_selling_gte_cost",
            ),
        ),
    ]
