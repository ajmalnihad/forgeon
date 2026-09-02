from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APIClient

from apps.customers.models import Customer
from apps.products.models import Product
from apps.sales.models import Sale, SaleItem

from services.sale_service import create_sale, update_sale
from services.payment_service import mark_sale_paid
from services.trash_service import soft_delete_sale, restore_sale
from services.loyalty_service import get_customer_loyalty_data, get_loyalty_preview, get_sale_loyalty_info

User = get_user_model()


class Stage2BusinessServiceTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin_user", password="pwd", role=User.Role.ADMIN)
        self.staff = User.objects.create_user(username="staff_user", password="pwd", role=User.Role.STAFF)
        
        self.customer = Customer.objects.create(name="Ajmal Nihad", phone="9876543210", place="Kozhikode")
        self.product_1 = Product.objects.create(
            name="Hammer", category="Tools", unit="pc",
            cost_price=Decimal("420.00"), selling_price=Decimal("640.00")
        )
        self.product_2 = Product.objects.create(
            name="Grease", category="Consumables", unit="tin",
            cost_price=Decimal("180.00"), selling_price=Decimal("260.00")
        )

    def test_create_sale_calculates_correct_totals_and_profit(self):
        items_payload = [
            {"product_id": self.product_1.id, "quantity": 2}, # cost=840, sell=1280
            {"product_id": self.product_2.id, "quantity": 1}  # cost=180, sell=260
        ]
        sale = create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=items_payload,
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.staff
        )
        
        # Verify derived totals are denormalized correctly
        self.assertEqual(sale.total, Decimal("1540.00"))  # 1280 + 260
        self.assertEqual(sale.total_cost, Decimal("1020.00"))  # 840 + 180
        self.assertEqual(sale.total_profit, Decimal("520.00"))  # 1540 - 1020
        self.assertEqual(sale.items.count(), 2)

    def test_create_sale_with_custom_price_overrides(self):
        items_payload = [
            {
                "product_id": self.product_1.id,
                "quantity": 1,
                "cost_price": Decimal("400.00"),  # overridden cost
                "selling_price": Decimal("650.00")  # overridden sell
            }
        ]
        sale = create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=items_payload,
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.staff
        )
        
        item = sale.items.first()
        self.assertEqual(item.cost_price, Decimal("400.00"))
        self.assertEqual(item.selling_price, Decimal("650.00"))
        self.assertEqual(sale.total, Decimal("650.00"))
        self.assertEqual(sale.total_cost, Decimal("400.00"))

    def test_selling_below_cost_raises_validation_error(self):
        items_payload = [
            {
                "product_id": self.product_1.id,
                "quantity": 1,
                "cost_price": Decimal("420.00"),
                "selling_price": Decimal("400.00")  # below cost
            }
        ]
        with self.assertRaises(ValidationError):
            create_sale(
                customer_id=self.customer.id,
                sale_date="2026-08-28",
                items_data=items_payload,
                payment_status=Sale.PaymentStatus.PAID,
                created_by=self.staff
            )

    def test_same_day_multiple_sales_distinct_date_loyalty(self):
        # August 28 Sale 1
        create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=[{"product_id": self.product_1.id, "quantity": 1}],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.staff
        )
        
        # Verify loyalty count is 1
        self.assertEqual(get_customer_loyalty_data(self.customer.id)["paid_purchases"], 1)
        
        # August 28 Sale 2 (Same customer, same date - valid separate record)
        create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=[{"product_id": self.product_2.id, "quantity": 2}],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.staff
        )
        
        # Total sales is 2, but loyalty distinct paid dates count remains 1!
        self.assertEqual(Sale.objects.filter(customer=self.customer).count(), 2)
        self.assertEqual(get_customer_loyalty_data(self.customer.id)["paid_purchases"], 1)
        
        # August 29 Sale 3 (Next calendar date - increments loyalty)
        create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-29",
            items_data=[{"product_id": self.product_1.id, "quantity": 1}],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.staff
        )
        self.assertEqual(get_customer_loyalty_data(self.customer.id)["paid_purchases"], 2)

    def test_pending_sale_does_not_count_toward_loyalty(self):
        # August 28 Pending Sale
        sale = create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=[{"product_id": self.product_1.id, "quantity": 1}],
            payment_status=Sale.PaymentStatus.PENDING,
            created_by=self.staff
        )
        # Loyalty is 0
        self.assertEqual(get_customer_loyalty_data(self.customer.id)["paid_purchases"], 0)
        
        # Admin marks it paid
        mark_sale_paid(sale_id=sale.id, user=self.admin)
        
        # Loyalty increments to 1 (preserves original date)
        self.assertEqual(get_customer_loyalty_data(self.customer.id)["paid_purchases"], 1)

    def test_staff_cannot_edit_payment_status(self):
        sale = create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=[{"product_id": self.product_1.id, "quantity": 1}],
            payment_status=Sale.PaymentStatus.PENDING,
            created_by=self.staff
        )
        
        with self.assertRaises(ValidationError):
            update_sale(
                sale=sale,
                payment_status=Sale.PaymentStatus.PAID,
                user=self.staff  # staff attempt should raise ValidationError
            )

    def test_soft_delete_and_restore_workflow(self):
        sale = create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=[{"product_id": self.product_1.id, "quantity": 1}],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.staff
        )
        self.assertEqual(get_customer_loyalty_data(self.customer.id)["paid_purchases"], 1)
        
        # Soft delete (reason required)
        soft_delete_sale(sale_id=sale.id, reason="Customer canceled order", user=self.admin)
        
        # Loyalty drops to 0 (excluded from counting)
        self.assertEqual(get_customer_loyalty_data(self.customer.id)["paid_purchases"], 0)
        
        # Restore
        restore_sale(sale_id=sale.id, user=self.admin)
        
        # Loyalty returns to 1
        self.assertEqual(get_customer_loyalty_data(self.customer.id)["paid_purchases"], 1)

    def test_loyalty_preview_logic(self):
        # Create a paid sale on August 28
        create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=[{"product_id": self.product_1.id, "quantity": 1}],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.staff
        )
        
        # Preview creating another PAID sale today (August 28) - dateAlreadyCounted=True, potentialIncrement=0
        preview_same_day = get_loyalty_preview(
            customer_id=self.customer.id,
            sale_date=date(2026, 8, 28),
            payment_done=True
        )
        self.assertEqual(preview_same_day["currentCount"], 1)
        self.assertEqual(preview_same_day["potentialIncrement"], 0)
        self.assertTrue(preview_same_day["dateAlreadyCounted"])
        
        # Preview creating a PAID sale tomorrow (August 29) - potentialIncrement=1
        preview_new_day = get_loyalty_preview(
            customer_id=self.customer.id,
            sale_date=date(2026, 8, 29),
            payment_done=True
        )
        self.assertEqual(preview_new_day["currentCount"], 1)
        self.assertEqual(preview_new_day["potentialIncrement"], 1)
        self.assertFalse(preview_new_day["dateAlreadyCounted"])
        self.assertEqual(preview_new_day["projectedCount"], 2)


class TargetedSalesApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="target-admin", password="pwd", role=User.Role.ADMIN)
        self.customer = Customer.objects.create(name="Ajmal", phone="9000000001", place="Olavanna")
        self.product = Product.objects.create(
            name="Hammer", category="Tools", unit="pc",
            cost_price=Decimal("100.00"), selling_price=Decimal("150.00"),
        )
        self.client = APIClient()
        self.client.force_authenticate(self.admin)

    def test_new_sale_uses_latest_product_price_and_keeps_old_snapshot(self):
        first = self.client.post(
            "/api/v1/sales/",
            {"customerId": self.customer.id, "date": "2026-08-28", "items": [{"productId": self.product.id, "quantity": 1}]},
            format="json",
        )
        self.assertEqual(first.status_code, 201)
        old_item = SaleItem.objects.get(sale_id=first.data["id"])
        self.product.cost_price = Decimal("120.00")
        self.product.selling_price = Decimal("175.00")
        self.product.save()
        second = self.client.post(
            "/api/v1/sales/",
            {"customerId": self.customer.id, "date": "2026-08-29", "items": [{"productId": self.product.id, "quantity": 1}]},
            format="json",
        )
        self.assertEqual(second.status_code, 201)
        self.assertEqual(SaleItem.objects.get(sale_id=second.data["id"]).selling_price, Decimal("175.00"))
        old_item.refresh_from_db()
        self.assertEqual(old_item.selling_price, Decimal("150.00"))

    def test_edited_sale_price_becomes_next_default_without_changing_history(self):
        first = create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=[{
                "product_id": self.product.id,
                "quantity": 1,
                "cost_price": Decimal("250.00"),
                "selling_price": Decimal("300.00"),
            }],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.admin,
        )
        first_item = first.items.get()
        self.product.refresh_from_db()
        self.assertEqual((self.product.cost_price, self.product.selling_price), (Decimal("250.00"), Decimal("300.00")))
        self.assertEqual((first_item.cost_price, first_item.selling_price), (Decimal("250.00"), Decimal("300.00")))

        second = create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-29",
            items_data=[{"product_id": self.product.id, "quantity": 1}],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.admin,
        )
        self.assertEqual((second.items.get().cost_price, second.items.get().selling_price), (Decimal("250.00"), Decimal("300.00")))

        third = create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-30",
            items_data=[{
                "product_id": self.product.id,
                "quantity": 1,
                "cost_price": Decimal("270.00"),
                "selling_price": Decimal("330.00"),
            }],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.admin,
        )
        self.assertEqual((third.items.get().cost_price, third.items.get().selling_price), (Decimal("270.00"), Decimal("330.00")))
        self.product.refresh_from_db()
        self.assertEqual((self.product.cost_price, self.product.selling_price), (Decimal("270.00"), Decimal("330.00")))
        first_item.refresh_from_db()
        self.assertEqual((first_item.cost_price, first_item.selling_price), (Decimal("250.00"), Decimal("300.00")))

    def test_failed_sale_does_not_update_product_default(self):
        with self.assertRaises(ValidationError):
            create_sale(
                customer_id=self.customer.id,
                sale_date="2026-08-28",
                items_data=[{
                    "product_id": self.product.id,
                    "quantity": 0,
                    "cost_price": Decimal("250.00"),
                    "selling_price": Decimal("300.00"),
                }],
                payment_status=Sale.PaymentStatus.PAID,
                created_by=self.admin,
            )
        self.product.refresh_from_db()
        self.assertEqual((self.product.cost_price, self.product.selling_price), (Decimal("100.00"), Decimal("150.00")))

    def test_sales_search_supports_customer_code_without_duplicates(self):
        create_sale(
            customer_id=self.customer.id,
            sale_date="2026-08-28",
            items_data=[{"product_id": self.product.id, "quantity": 1}],
            payment_status=Sale.PaymentStatus.PAID,
            created_by=self.admin,
        )
        response = self.client.get(f"/api/v1/sales/?search={self.customer.code[2:]}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
