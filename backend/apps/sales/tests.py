"""Stage 1 foundation tests — Sale and SaleItem models."""
from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from django.test import TestCase

from apps.customers.models import Customer
from apps.products.models import Product

from .models import Sale, SaleItem

User = get_user_model()


class SaleModelTests(TestCase):
    def setUp(self) -> None:
        self.user = User.objects.create_user(username="staff1", password="x")
        self.customer = Customer.objects.create(
            name="Ajmal", phone="9876543210", place="Kozhikode"
        )
        self.product = Product.objects.create(
            name="Hammer", category="Tools", unit="pc",
            cost_price=Decimal("420.00"), selling_price=Decimal("640.00"),
        )

    def _sale(self, **kwargs) -> Sale:
        defaults = {
            "customer": self.customer,
            "sale_date": date(2026, 8, 28),
            "created_by": self.user,
        }
        defaults.update(kwargs)
        return Sale.objects.create(**defaults)

    # --- payment status ---
    def test_payment_status_defaults_to_paid(self) -> None:
        self.assertEqual(self._sale().payment_status, Sale.PaymentStatus.PAID)

    def test_pending_is_valid(self) -> None:
        s = self._sale(payment_status=Sale.PaymentStatus.PENDING)
        self.assertEqual(s.payment_status, "pending")

    def test_invalid_status_rejected_by_db(self) -> None:
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._sale(payment_status="refunded")

    # --- CRITICAL: same-day multiple sales are valid ---
    def test_multiple_sales_same_customer_same_date_allowed(self) -> None:
        s1 = self._sale()
        s2 = self._sale()
        s3 = self._sale()
        self.assertEqual(
            Sale.objects.filter(
                customer=self.customer, sale_date=date(2026, 8, 28)
            ).count(),
            3,
        )
        self.assertNotEqual(s1.pk, s2.pk)
        self.assertNotEqual(s2.pk, s3.pk)

    # --- soft delete metadata ---
    def test_soft_delete_fields(self) -> None:
        s = self._sale()
        self.assertFalse(s.is_deleted)
        s.is_deleted = True
        s.delete_reason = "Duplicate entry."
        s.deleted_by = self.user
        s.save()
        s.refresh_from_db()
        self.assertTrue(s.is_deleted)
        self.assertEqual(s.deleted_by, self.user)

    def test_deleted_sale_requires_reason_at_db_level(self) -> None:
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._sale(is_deleted=True, delete_reason="")

    # --- relationships ---
    def test_relationships(self) -> None:
        s = self._sale()
        item = SaleItem.objects.create(
            sale=s, product=self.product,
            product_name=self.product.name, unit=self.product.unit,
            quantity=2, cost_price=Decimal("420.00"), selling_price=Decimal("640.00"),
        )
        self.assertEqual(s.customer, self.customer)
        self.assertEqual(s.created_by, self.user)
        self.assertIn(item, s.items.all())
        self.assertIn(s, self.customer.sales.all())
        self.assertEqual(item.product, self.product)

    def test_customer_with_sales_cannot_be_hard_deleted(self) -> None:
        self._sale()
        with self.assertRaises(ProtectedError):
            self.customer.delete()

    def test_deleting_user_preserves_sale(self) -> None:
        s = self._sale()
        self.user.delete()
        s.refresh_from_db()
        self.assertIsNone(s.created_by)  # SET_NULL, history preserved


class SaleItemModelTests(TestCase):
    def setUp(self) -> None:
        self.customer = Customer.objects.create(
            name="Sneha", phone="9846001122", place="Thrissur"
        )
        self.product = Product.objects.create(
            name="Grease", category="Consumables", unit="tin",
            cost_price=Decimal("180.00"), selling_price=Decimal("260.00"),
        )
        self.sale = Sale.objects.create(customer=self.customer, sale_date=date(2026, 8, 29))

    def _item(self, **kwargs) -> SaleItem:
        defaults = {
            "sale": self.sale,
            "product": self.product,
            "product_name": self.product.name,
            "unit": self.product.unit,
            "quantity": 1,
            "cost_price": Decimal("180.00"),
            "selling_price": Decimal("260.00"),
        }
        defaults.update(kwargs)
        return SaleItem.objects.create(**defaults)

    def test_zero_quantity_rejected(self) -> None:
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._item(quantity=0)

    def test_selling_below_cost_rejected(self) -> None:
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._item(selling_price=Decimal("100.00"))

    def test_snapshot_survives_product_price_change(self) -> None:
        item = self._item()
        # Product price changes AFTER the sale…
        self.product.cost_price = Decimal("200.00")
        self.product.selling_price = Decimal("300.00")
        self.product.save()
        item.refresh_from_db()
        # …but the historical snapshot is untouched. Non-negotiable.
        self.assertEqual(item.cost_price, Decimal("180.00"))
        self.assertEqual(item.selling_price, Decimal("260.00"))

    def test_snapshot_survives_product_inactivation(self) -> None:
        item = self._item()
        self.product.active = False
        self.product.save()
        item.refresh_from_db()
        self.assertEqual(item.product_name, "Grease")

    def test_product_referenced_by_sales_cannot_be_hard_deleted(self) -> None:
        self._item()
        with self.assertRaises(ProtectedError):
            self.product.delete()

    def test_line_totals(self) -> None:
        item = self._item(quantity=3)
        self.assertEqual(item.line_total, Decimal("780.00"))
        self.assertEqual(item.line_profit, Decimal("240.00"))
