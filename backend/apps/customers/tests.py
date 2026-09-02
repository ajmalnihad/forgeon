"""Stage 1 foundation tests — Customer model and opaque code."""
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from .models import Customer
from .utils import CODE_PREFIX, generate_customer_code

User = get_user_model()


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


class CustomerApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin", password="pwd", role=User.Role.ADMIN)
        self.staff = User.objects.create_user(username="staff", password="pwd", role=User.Role.STAFF)
        self.client = APIClient()
        self.customer = Customer.objects.create(name="Ajmal Nihad", phone="9846977619", place="Olavanna")

    def test_customer_search_supports_name_phone_and_code(self):
        for query in ("Ajmal", "9846977619", self.customer.code.lower(), self.customer.code[2:]):
            response = self.client.get(f"/api/v1/customers/?search={query}")
            self.assertEqual(response.status_code, 401)

        self.client.force_authenticate(self.staff)
        for query in ("Ajmal", "9846977619", self.customer.code.lower(), self.customer.code[2:]):
            response = self.client.get(f"/api/v1/customers/?search={query}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual([row["id"] for row in response.data], [self.customer.id])

    def test_bulk_import_is_atomic_and_reuses_customer_codes(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/customers/bulk-import/",
            {"text": "1.Nihad,9846977892,Nallalam\n2.Rahul,9876543210,Kozhikode"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["created_count"], 2)
        self.assertTrue(all(row["code"].startswith(CODE_PREFIX) for row in response.data["customers"]))

        before = Customer.objects.count()
        response = self.client.post(
            "/api/v1/customers/bulk-import/",
            {"text": "Valid,9123456789,Kozhikode\nMalformed Customer Only"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Customer.objects.count(), before)

    def test_bulk_import_rejects_database_and_input_duplicates(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/customers/bulk-import/",
            {"text": "New,9846977619,Olavanna\nOther,9123456789,Nallalam"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Customer.objects.filter(phone="9123456789").count(), 0)

        response = self.client.post(
            "/api/v1/customers/bulk-import/",
            {"text": "One,9123456788,Olavanna\nTwo,9123456788,Nallalam"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Customer.objects.filter(phone="9123456788").count(), 0)

    def test_bulk_import_is_admin_only(self):
        self.client.force_authenticate(self.staff)
        response = self.client.post(
            "/api/v1/customers/bulk-import/",
            {"text": "Blocked,9123456787,Kozhikode"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
