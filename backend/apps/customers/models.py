"""
Customer domain model.

Identity design (approved):
- The database primary key (BigAutoField `id`) is the ONLY internal identity.
- `code` (e.g. FO-A901) is a display/search identifier: opaque, non-sequential,
  unique, immutable, and NOT the primary key. It is generated server-side and
  must never be accepted from clients.

Loyalty design (approved):
- Loyalty is DERIVED (distinct paid non-deleted sale dates), never stored as
  a mutable counter. Therefore this model intentionally has NO loyalty_points,
  reward_balance or purchase_count fields.
"""
from django.core.exceptions import ValidationError
from django.db import models

from .utils import generate_unique_customer_code


class Customer(models.Model):
    # Opaque display code — see module docstring. editable=False keeps it out
    # of admin forms so it can never be changed after creation.
    code = models.CharField(max_length=12, unique=True, editable=False)

    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    whatsapp = models.CharField(max_length=20, blank=True)
    place = models.CharField(max_length=100)
    address = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            # Name is the primary human search key on the customers screen.
            models.Index(fields=["name"], name="customer_name_idx"),
        ]
        constraints = [
            # Business rule: at least one of phone / whatsapp is required.
            # Enforced at DB level; the friendly error message lives in
            # clean() and will be finalized in Stage 2 serializers.
            models.CheckConstraint(
                condition=models.Q(phone__gt="") | models.Q(whatsapp__gt=""),
                name="customer_requires_contact",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"

    def clean(self) -> None:
        """Friendly form-level mirror of the DB contact constraint."""
        if not (self.phone or "").strip() and not (self.whatsapp or "").strip():
            raise ValidationError("Provide at least a phone or WhatsApp number.")

    def save(self, *args, **kwargs) -> None:
        # Generate the opaque code exactly once, at creation. It is never
        # regenerated when the customer is edited.
        if not self.code:
            self.code = generate_unique_customer_code()
        super().save(*args, **kwargs)
