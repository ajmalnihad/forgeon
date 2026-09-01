"""
Product domain model.

Approved rules:
- Products are never hard-deleted in normal operation; `active=False` is the
  soft-delete/inactive mechanism.
- These prices are the CURRENT catalogue prices only. Historical sales keep
  their own snapshots on SaleItem — changing a product price must never
  change a historical sale (enforced by the SaleItem snapshot design, not by
  extra history tables).
- Money uses DecimalField, never float.
"""
from django.core.exceptions import ValidationError
from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True)
    unit = models.CharField(max_length=20, default="pc")

    cost_price = models.DecimalField(max_digits=12, decimal_places=2)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2)

    active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(cost_price__gte=0),
                name="product_cost_price_gte_0",
            ),
            models.CheckConstraint(
                condition=models.Q(selling_price__gte=models.F("cost_price")),
                name="product_selling_gte_cost",
            ),
        ]

    def __str__(self) -> str:
        return self.name

    def clean(self) -> None:
        """Friendly form-level mirror of the DB price constraints."""
        if self.cost_price is not None and self.cost_price < 0:
            raise ValidationError({"cost_price": "Cost price cannot be negative."})
        if (
            self.cost_price is not None
            and self.selling_price is not None
            and self.selling_price < self.cost_price
        ):
            raise ValidationError(
                {"selling_price": "Selling price cannot be below cost price."}
            )
