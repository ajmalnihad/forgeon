from datetime import date
from typing import Optional, Dict, Any
from apps.sales.models import Sale


def get_paid_dates(customer_id: int, exclude_sale_id: Optional[int] = None) -> list:
    """
    Return sorted list of distinct calendar dates with paid, active (non-deleted) sales.
    This is the authoritative single source of loyalty distinct-date logic.
    """
    queryset = Sale.objects.filter(
        customer_id=customer_id,
        payment_status=Sale.PaymentStatus.PAID,
        is_deleted=False
    )
    if exclude_sale_id is not None:
        queryset = queryset.exclude(id=exclude_sale_id)
        
    dates = queryset.values_list("sale_date", flat=True).distinct().order_by("sale_date")
    return list(dates)


def get_customer_loyalty_data(customer_id: int) -> Dict[str, Any]:
    """
    Compute derived loyalty counters for a customer.
    No loyalty points or mutable counts are stored; everything is dynamically
    aggregated from raw sales data.
    """
    dates = get_paid_dates(customer_id)
    paid_purchases = len(dates)
    next_milestone = ((paid_purchases // 10) + 1) * 10
    
    return {
        "paid_purchases": paid_purchases,
        "next_milestone": next_milestone,
        "upcoming_purchase_number": paid_purchases + 1
    }


def get_sale_loyalty_info(sale: Sale) -> Dict[str, Any]:
    """
    Determine the purchaseNumber and isMilestone status of a given sale.
    
    Deterministic behavior for multiple sales on the same calendar date:
    - If multiple paid sales occur on the same date, they belong to separate
      records, but represent the same loyalty purchase day. They share the same
      purchaseNumber (position of that date in chronologically sorted dates).
    """
    if sale.is_deleted or sale.payment_status != Sale.PaymentStatus.PAID:
        return {
            "purchase_number": None,
            "is_milestone": False
        }
        
    dates = get_paid_dates(sale.customer_id)
    try:
        # 1-based index of this date in the sorted list of distinct paid dates
        idx = dates.index(sale.sale_date)
        purchase_number = idx + 1
        is_milestone = (purchase_number > 0) and (purchase_number % 10 == 0)
    except ValueError:
        purchase_number = None
        is_milestone = False
        
    return {
        "purchase_number": purchase_number,
        "is_milestone": is_milestone
    }


def get_loyalty_preview(
    customer_id: int,
    sale_date: date,
    payment_done: bool,
    exclude_sale_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Authoritative distinct-date preview calculation for a draft/editing sale.
    Used by /api/v1/customers/{id}/loyalty-preview/ to prevent UI-calculation drift.
    """
    # Distinct dates, excluding the sale itself if editing.
    existing_dates = get_paid_dates(customer_id, exclude_sale_id=exclude_sale_id)
    current_count = len(existing_dates)
    
    date_already_counted = sale_date in existing_dates
    potential_increment = 1 if (payment_done and not date_already_counted) else 0
    projected_count = current_count + potential_increment
    
    upcoming_number = projected_count if potential_increment == 1 else None
    next_milestone = ((current_count // 10) + 1) * 10
    
    return {
        "currentCount": current_count,
        "potentialIncrement": potential_increment,
        "projectedCount": projected_count,
        "dateAlreadyCounted": date_already_counted,
        "upcomingNumber": upcoming_number,
        "nextMilestone": next_milestone
    }
