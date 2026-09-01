from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.accounts.models import User
from apps.sales.models import Sale


@transaction.atomic
def mark_sale_paid(sale_id: int, user: User) -> Sale:
    """
    Transition a sale from pending to paid.
    
    Rules (approved):
    - Admin only (views must enforce this, service confirms it).
    - Sale must exist and not be deleted.
    - Preserve original sale date completely.
    - Re-run loyalty calculations dynamically on read.
    """
    if not user.is_app_admin:
        raise ValidationError("Only an Admin can mark a pending sale as Paid.")
        
    try:
        sale = Sale.objects.get(id=sale_id)
    except Sale.DoesNotExist:
        raise ValidationError("Sale does not exist.")
        
    if sale.is_deleted:
        raise ValidationError("Cannot change payment status of a deleted sale.")
        
    if sale.payment_status == Sale.PaymentStatus.PAID:
        # Already paid, return early and safely
        return sale
        
    sale.payment_status = Sale.PaymentStatus.PAID
    # Note: Sale has no paid_at field; updated_at (auto_now) records the change.
    # A paid_at DateTimeField can be added in a future migration if required.
    sale.save()
    
    return sale
