# Initial migration for Sale + SaleItem.
#
# NOTE: authored by hand (no Python runtime in this workspace).
# Verify locally with:  python manage.py makemigrations --check
from decimal import Decimal

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("customers", "0001_initial"),
        ("products", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Sale",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sale_date", models.DateField()),
                (
                    "payment_status",
                    models.CharField(
                        choices=[("paid", "Paid"), ("pending", "Payment Pending")],
                        default="paid",
                        max_length=10,
                    ),
                ),
                ("total", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                ("total_cost", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                ("total_profit", models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("delete_reason", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sales_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "customer",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="sales",
                        to="customers.customer",
                    ),
                ),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="sales_deleted",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-sale_date", "-id"],
            },
        ),
        migrations.CreateModel(
            name="SaleItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("product_name", models.CharField(max_length=150)),
                ("unit", models.CharField(max_length=20)),
                ("quantity", models.PositiveIntegerField()),
                ("cost_price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("selling_price", models.DecimalField(decimal_places=2, max_digits=12)),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="sale_items",
                        to="products.product",
                    ),
                ),
                (
                    "sale",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="items",
                        to="sales.sale",
                    ),
                ),
            ],
            options={
                "ordering": ["id"],
            },
        ),
        migrations.AddIndex(
            model_name="sale",
            index=models.Index(fields=["customer", "sale_date"], name="sale_customer_date_idx"),
        ),
        migrations.AddIndex(
            model_name="sale",
            index=models.Index(fields=["sale_date"], name="sale_date_idx"),
        ),
        migrations.AddIndex(
            model_name="sale",
            index=models.Index(
                condition=models.Q(("is_deleted", False)),
                fields=["payment_status"],
                name="sale_status_active_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="sale",
            constraint=models.CheckConstraint(
                condition=models.Q(("payment_status__in", ["paid", "pending"])),
                name="sale_payment_status_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="sale",
            constraint=models.CheckConstraint(
                condition=models.Q(("total__gte", 0)) & models.Q(("total_cost__gte", 0)),
                name="sale_totals_gte_0",
            ),
        ),
        migrations.AddConstraint(
            model_name="sale",
            constraint=models.CheckConstraint(
                condition=models.Q(("is_deleted", False)) | ~models.Q(("delete_reason", "")),
                name="sale_deleted_requires_reason",
            ),
        ),
        migrations.AddConstraint(
            model_name="saleitem",
            constraint=models.CheckConstraint(
                condition=models.Q(("quantity__gte", 1)),
                name="saleitem_quantity_gte_1",
            ),
        ),
        migrations.AddConstraint(
            model_name="saleitem",
            constraint=models.CheckConstraint(
                condition=models.Q(("cost_price__gte", 0)),
                name="saleitem_cost_price_gte_0",
            ),
        ),
        migrations.AddConstraint(
            model_name="saleitem",
            constraint=models.CheckConstraint(
                condition=models.Q(("selling_price__gte", models.F("cost_price"))),
                name="saleitem_selling_gte_cost",
            ),
        ),
    ]
