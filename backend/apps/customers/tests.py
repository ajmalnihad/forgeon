"""Stage 1 foundation tests — Customer model and opaque code."""
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import Customer
from .utils import CODE_PREFIX, generate_customer_code


class CustomerModelTests(TestCase):
    def _make(self, **kwargs) -> Customer:
        defaults = {"name": "Test Customer", "phone": "9876543210", "place": "Kozhikode"}
        defaults.update(kwargs)
        return Customer.objects.create(**defaults)

    def test_code_is_generated_opaque_and_immutable(self) -> None:
        c = self._make()
        self.assertTrue(c.code.startswith(CODE_PREFIX))
        self.assertEqual(len(c.code), len(CODE_PREFIX) + 4)
        original = c.code
        c.name = "Renamed"
        c.save()
        c.refresh_from_db()
        self.assertEqual(c.code, original)  # never regenerated on edit

    def test_code_format_is_uppercase_alphanumeric(self) -> None:
        code = generate_customer_code()
        random_part = code[len(CODE_PREFIX):]
        self.assertTrue(all(ch.isupper() or ch.isdigit() for ch in random_part))

    def test_code_uniqueness_enforced_by_db(self) -> None:
        c1 = self._make()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                # Bypass save() generation by forcing a duplicate code.
                Customer.objects.create(
                    name="Dup", phone="1", place="X", code=c1.code
                )

    def test_contact_rule_requires_phone_or_whatsapp(self) -> None:
        # clean() gives the friendly error…
        c = Customer(name="No Contact", place="X")
        with self.assertRaises(ValidationError):
            c.full_clean()
        # …and the DB constraint enforces it even without full_clean().
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Customer.objects.create(name="No Contact", place="X")

    def test_whatsapp_only_is_valid(self) -> None:
        c = self._make(phone="", whatsapp="9999999999")
        self.assertTrue(c.pk)
