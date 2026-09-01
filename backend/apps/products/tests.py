"""Stage 1 foundation tests — Product model price rules."""
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import Product


class ProductModelTests(TestCase):
    def test_valid_product(self) -> None:
        p = Product.objects.create(
            name="Hammer", category="Tools", unit="pc",
            cost_price=Decimal("420.00"), selling_price=Decimal("640.00"),
        )
        self.assertTrue(p.active)

    def test_selling_below_cost_rejected_by_clean(self) -> None:
        p = Product(
            name="Bad", category="Tools", unit="pc",
            cost_price=Decimal("100.00"), selling_price=Decimal("90.00"),
        )
        with self.assertRaises(ValidationError):
            p.full_clean()

    def test_selling_below_cost_rejected_by_db(self) -> None:
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Product.objects.create(
                    name="Bad", category="Tools", unit="pc",
                    cost_price=Decimal("100.00"), selling_price=Decimal("90.00"),
                )

    def test_negative_cost_rejected_by_db(self) -> None:
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Product.objects.create(
                    name="Bad", category="Tools", unit="pc",
                    cost_price=Decimal("-1.00"), selling_price=Decimal("10.00"),
                )
