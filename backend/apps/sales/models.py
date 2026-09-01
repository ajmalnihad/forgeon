"""
Sales domain models: Sale + SaleItem.

Approved rules encoded in this data model (business workflows are Stage 2):

1. BUSINESS DATE — `sale_date` is an explicit DateField. It is NEVER derived
   from created_at, so the loyalty calendar-date rule is immune to UTC /
   midnight timezone conversion issues (project timezone: Asia/Kolkata).

2. SAME-DAY SALES — multiple sales for the same customer on the same date
   are VALID separate records. There is deliberately NO unique constraint on
   (customer, sale_date).

3. LOYALTY FOUNDATION — loyalty = distinct calendar dates having at least one
   paid, non-deleted sale. It is DERIVED, so no mutable purchase counter is
   stored anywhere. The composite (customer, sale_date) index supports that
   Stage 2 aggregation.

4. PAYMENT — only `paid` / `pending`. A pending sale is valid but does not
   count toward loyalty until paid; when marked paid later (Stage 2), the
   ORIGINAL sale_date remains the purchase date.

5. SOFT DELETE — sales are never physically deleted in normal operation.
   `is_deleted` + metadata support the Stage 3 Trash/Restore workflows.
   deleted_by/created_by use SET_NULL so removing a user account never
   destroys historical sale records or deletion metadata.

6. SNAPSHOTS — every SaleItem stores the product name, unit and both prices
   AS USED IN THAT SALE. Product price changes never touch historical sales.

7. STORED TOTALS (deliberate choice — Option A) — `total`, `total_cost` and
   `total_profit` are denormalized onto Sale. Rationale: list screens and
   reports read totals constantly while writes are rare and will go through
   a single Stage 2 service inside a transaction that recomputes them from
   the items. This gives fast lists/reports without aggregation queries at
   MVP scale, while item snapshots remain the ground truth for auditing.
   Stage 1 stores them defaulting to 0; ONLY the Stage 2 engine may write
   them — they are never trusted from clients.
"""
from decimal import Decimal

from django.conf import settings
from django.db import models


class Sale(models.Model):
    class PaymentStatus(models.TextChoices):
        PAID = "paid", "Paid"
        PENDING = "pending", "Payment Pending"

    # PROTECT: a customer with historical sales cannot be hard-deleted.
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="sales",
    )

    # Business calendar date of the purchase (see module docstring, rule 1).
    sale_date = models.DateField()

    payment_status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PAID,
    )

    # Denormalized totals — written ONLY by the Stage 2 sale engine.
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_profit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    # SET_NULL: deleting a user account must not destroy sale history.
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_created",
    )

    # ---- Soft delete metadata (operations arrive in Stage 2/3) ----
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_deleted",
    )
    delete_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-sale_date", "-id"]
        indexes = [
            # Customer purchase history AND the loyalty distinct-date
            # aggregation both group by customer within date ranges.
            models.Index(fields=["customer", "sale_date"], name="sale_customer_date_idx"),
            # Date-range filtering for lists, dashboard and reports.
            models.Index(fields=["sale_date"], name="sale_date_idx"),
            # Partial index: the pending-payments list is a hot query and
            # only ever looks at non-deleted rows.
            models.Index(
                fields=["payment_status"],
                name="sale_status_active_idx",
                condition=models.Q(is_deleted=False),
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(payment_status__in=["paid", "pending"]),
                name="sale_payment_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(total__gte=0)
                & models.Q(total_cost__gte=0),
                name="sale_totals_gte_0",
            ),
            # Invariant: a deleted sale must carry a reason (approved
            # delete workflow: confirm → required reason → soft delete).
            models.CheckConstraint(
                condition=models.Q(is_deleted=False) | ~models.Q(delete_reason=""),
                name="sale_deleted_requires_reason",
            ),
            # NOTE (deliberate): NO unique constraint on (customer, sale_date)
            # — multiple same-day sales are valid business records.
        ]

    def __str__(self) -> str:
        return f"Sale #{self.pk} — {self.customer} on {self.sale_date}"


class SaleItem(models.Model):
    """One product line inside a sale, with immutable historical snapshots."""

    # CASCADE: items have no meaning without their sale. Sales themselves are
    # soft-deleted in normal operation, so this cascade only ever fires on
    # exceptional hard cleanup.
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name="items",
    )

    # PROTECT: a product referenced by any historical sale cannot be
    # hard-deleted; products become inactive instead.
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
        related_name="sale_items",
    )

    # ---- Historical snapshots (rule 6) — the prices USED IN THIS SALE ----
    product_name = models.CharField(max_length=150)
    unit = models.CharField(max_length=20)
    quantity = models.PositiveIntegerField()
    cost_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gte=1),
                name="saleitem_quantity_gte_1",
            ),
            models.CheckConstraint(
                condition=models.Q(cost_price__gte=0),
                name="saleitem_cost_price_gte_0",
            ),
            models.CheckConstraint(
                condition=models.Q(selling_price__gte=models.F("cost_price")),
                name="saleitem_selling_gte_cost",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.product_name} ×{self.quantity}"

    @property
    def line_total(self) -> Decimal:
        return self.selling_price * self.quantity

    @property
    def line_profit(self) -> Decimal:
        return (self.selling_price - self.cost_price) * self.quantity
