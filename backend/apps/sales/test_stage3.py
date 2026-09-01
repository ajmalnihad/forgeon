"""
Stage 3 tests — Dashboard, Reports, Analytics and PDF export.

Runtime status: authored; execution depends on a local Python + PostgreSQL
runtime (the AI workspace has no Python runtime). Do not claim pass/fail here.
"""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.customers.models import Customer
from apps.products.models import Product
from apps.sales.models import Sale, SaleItem
from services.sale_service import create_sale
from services.report_service import (
    get_report_summary,
    get_timeseries,
    get_top_customers,
    get_top_products,
    get_loyalty_overview,
)

User = get_user_model()


class ReportServiceBase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="admin1", password="x", role=User.Role.ADMIN)
        self.customer_a = Customer.objects.create(name="Alice", phone="111", place="Kozhikode")
        self.customer_b = Customer.objects.create(name="Bob", phone="222", place="Thrissur")
        self.prod_x = Product.objects.create(
            name="Hammer", category="Tools", unit="pc",
            cost_price=Decimal("100.00"), selling_price=Decimal("150.00"),
        )
        self.prod_y = Product.objects.create(
            name="Grease", category="Consumables", unit="tin",
            cost_price=Decimal("50.00"), selling_price=Decimal("80.00"),
        )

    def _make_sale(self, customer, day_offset, product, qty=1, status=Sale.PaymentStatus.PAID):
        sale = create_sale(
            customer_id=customer.id,
            sale_date=(date.today() - timedelta(days=day_offset)).isoformat(),
            items_data=[{"product_id": product.id, "quantity": qty}],
            payment_status=status,
            created_by=self.user,
        )
        return sale


class ReportSummaryTests(ReportServiceBase):
    def test_summary_totals_and_deleted_exclusion(self):
        self._make_sale(self.customer_a, 0, self.prod_x, qty=2)   # total 300, cost 200
        self._make_sale(self.customer_b, 0, self.prod_y, qty=1, status=Sale.PaymentStatus.PENDING)  # 80

        data = get_report_summary()
        self.assertEqual(data["salesCount"], 2)
        self.assertEqual(Decimal(data["totalSales"]), Decimal("380.00"))
        self.assertEqual(Decimal(data["totalCost"]), Decimal("250.00"))
        self.assertEqual(Decimal(data["totalProfit"]), Decimal("130.00"))
        self.assertEqual(data["pendingCount"], 1)
        self.assertEqual(Decimal(data["pendingAmount"]), Decimal("80.00"))
        self.assertEqual(data["customers"], 2)

        # Soft-deleted sales must be excluded from everything.
        sale = Sale.objects.first()
        sale.is_deleted = True
        sale.delete_reason = "test"
        sale.save()
        data2 = get_report_summary()
        self.assertEqual(data2["salesCount"], 1)
        self.assertEqual(Decimal(data2["totalSales"]), Decimal("80.00"))


class ReportFilterTests(ReportServiceBase):
    def test_date_range_and_customer_filter(self):
        self._make_sale(self.customer_a, 0, self.prod_x)
        self._make_sale(self.customer_a, 10, self.prod_x)
        self._make_sale(self.customer_b, 0, self.prod_y)

        # date_from only
        d = (date.today() - timedelta(days=5)).isoformat()
        data = get_report_summary(date_from=d)
        self.assertEqual(data["salesCount"], 2)

        # customer only
        data = get_report_summary(customer=self.customer_a.id)
        self.assertEqual(data["salesCount"], 2)

        # payment filter
        self._make_sale(self.customer_a, 1, self.prod_y, status=Sale.PaymentStatus.PENDING)
        data = get_report_summary(payment_status="pending")
        self.assertEqual(data["pendingCount"], 1)

    def test_product_filter_does_not_duplicate_sale_count(self):
        # One sale containing BOTH products must count once.
        sale = create_sale(
            customer_id=self.customer_a.id,
            sale_date=date.today().isoformat(),
            items_data=[
                {"product_id": self.prod_x.id, "quantity": 1},
                {"product_id": self.prod_y.id, "quantity": 1},
            ],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.user,
        )
        self.assertEqual(sale.items.count(), 2)

        data = get_report_summary(product=self.prod_x.id)
        self.assertEqual(data["salesCount"], 1)  # NOT 2 — distinct sales
        self.assertEqual(Decimal(data["totalSales"]), Decimal("230.00"))  # 150 + 80

    def test_top_products_uses_historical_snapshots(self):
        self._make_sale(self.customer_a, 0, self.prod_x, qty=2)
        # Change product master price after the sale — analytics must not change.
        self.prod_x.cost_price = Decimal("999.00")
        self.prod_x.selling_price = Decimal("999.00")
        self.prod_x.save()

        top = get_top_products()
        self.assertEqual(len(top), 1)
        self.assertEqual(top[0]["productName"], "Hammer")
        self.assertEqual(Decimal(top[0]["revenue"]), Decimal("300.00"))  # 150 snapshot, not 999
        self.assertEqual(Decimal(top[0]["profit"]), Decimal("100.00"))   # (150-100)*2

    def test_top_customers(self):
        self._make_sale(self.customer_a, 0, self.prod_x, qty=2)   # 300
        self._make_sale(self.customer_a, 1, self.prod_y, qty=1)   # 80
        self._make_sale(self.customer_b, 0, self.prod_y, qty=1)   # 80

        top = get_top_customers()
        self.assertEqual(top[0]["customerId"], self.customer_a.id)
        self.assertEqual(Decimal(top[0]["total"]), Decimal("380.00"))
        self.assertEqual(top[0]["purchases"], 2)  # sale records, not loyalty dates


class TimeseriesTests(ReportServiceBase):
    def test_week_buckets(self):
        for i in range(7):
            self._make_sale(self.customer_a, i, self.prod_x, qty=1)
        data = get_timeseries(period="week")
        self.assertEqual(len(data), 7)
        self.assertEqual(sum(item["value"] for item in data), 7 * 150.00)

    def test_timeseries_excludes_deleted(self):
        sale = self._make_sale(self.customer_a, 0, self.prod_x)
        sale.is_deleted = True
        sale.delete_reason = "x"
        sale.save()
        data = get_timeseries(period="today")
        self.assertEqual(sum(item["value"] for item in data), 0.0)


class LoyaltyOverviewTests(ReportServiceBase):
    def test_approaching_and_recent(self):
        # 9 paid dates for Alice → approaching milestone 10
        for i in range(9):
            self._make_sale(self.customer_a, i, self.prod_x)
        # 10th paid date → milestone reached, appears in recent
        self._make_sale(self.customer_a, 9, self.prod_x)

        overview = get_loyalty_overview()
        alice_approaching = next(
            (c for c in overview["approaching"] if c["id"] == self.customer_a.id), None
        )
        self.assertIsNotNone(alice_approaching)
        self.assertEqual(alice_approaching["paidPurchases"], 9)

        # The 10th distinct date is a milestone → recent contains it.
        self.assertTrue(any(r["purchaseNumber"] == 10 for r in overview["recent"]))


class DashboardApiTests(ReportServiceBase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_dashboard_summary_and_pending_and_timeseries(self):
        self._make_sale(self.customer_a, 0, self.prod_x, status=Sale.PaymentStatus.PENDING)
        self._make_sale(self.customer_a, 0, self.prod_y, status=Sale.PaymentStatus.PAID)

        r = self.client.get("/api/v1/dashboard/summary/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["salesCount"], 2)
        self.assertEqual(r.data["pendingCount"], 1)

        r = self.client.get("/api/v1/dashboard/pending/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 1)
        self.assertEqual(r.data[0]["paymentStatus"], "pending")

        r = self.client.get("/api/v1/dashboard/timeseries/?period=today")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.data, list)


class ReportApiTests(ReportServiceBase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_report_endpoints_require_auth(self):
        anon = APIClient()
        for url in [
            "/api/v1/reports/summary/",
            "/api/v1/reports/top-products/",
            "/api/v1/reports/top-customers/",
            "/api/v1/reports/loyalty/",
            "/api/v1/reports/export/pdf/",
        ]:
            self.assertEqual(anon.get(url).status_code, 401)

    def test_report_summary_and_lists(self):
        self._make_sale(self.customer_a, 0, self.prod_x)
        self.assertEqual(self.client.get("/api/v1/reports/summary/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/reports/top-products/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/reports/top-customers/").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/reports/loyalty/").status_code, 200)

    def test_pdf_export_returns_pdf(self):
        self._make_sale(self.customer_a, 0, self.prod_x)
        r = self.client.get("/api/v1/reports/export/pdf/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Type"], "application/pdf")
        self.assertTrue(r.content.startswith(b"%PDF"))
