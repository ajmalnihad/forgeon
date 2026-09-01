from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.accounts.models import User
from apps.sales.models import Sale


@transaction.atomic
def soft_delete_sale(sale_id: int, reason: str, user: User) -> Sale:
    """
    Soft-delete a sale.
    
    Rules (approved):
    - Admin only (views enforce, service confirms).
    - Required reason (raises ValidationError if empty).
    - Set is_deleted=True, record delete_reason, deleted_by, and deleted_at.
    """
    if not user.is_app_admin:
        raise ValidationError("Only an Admin can delete a sale.")
        
    if not reason or not reason.strip():
        raise ValidationError("A reason is required to delete a sale.")
        
    try:
        sale = Sale.objects.get(id=sale_id)
    except Sale.DoesNotExist:
        raise ValidationError("Sale does not exist.")
        
    if sale.is_deleted:
        return sale  # Already soft-deleted
        
    sale.is_deleted = True
    sale.delete_reason = reason.strip()
    sale.deleted_by = user
    sale.deleted_at = timezone.now()
    sale.save()
    
    return sale


@transaction.atomic
def restore_sale(sale_id: int, user: User) -> Sale:
    """
    Restore a soft-deleted sale.
    
    Rules (approved):
    - Admin only (views enforce, service confirms).
    - Only a deleted sale can be restored.
    - Clear deletion metadata: is_deleted, delete_reason, deleted_by, and deleted_at.
    """
    if not user.is_app_admin:
        raise ValidationError("Only an Admin can restore a deleted sale.")
        
    try:
        sale = Sale.objects.get(id=sale_id)
    except Sale.DoesNotExist:
        raise ValidationError("Sale does not exist.")
        
    if not sale.is_deleted:
        raise ValidationError("Only a deleted sale can be restored.")
        
    sale.is_deleted = False
    sale.delete_reason = ""
    sale.deleted_by = None
    sale.deleted_at = None
    sale.save()
    
    return sale
