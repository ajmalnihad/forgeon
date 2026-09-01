"""
Report & dashboard aggregation service.

This module is the SINGLE place that interprets report/dashboard filters so
that summary, timeseries, top products, top customers and the PDF export all
apply identical semantics. It operates purely on authoritative Sale/SaleItem
database rows (never on frontend-computed values).

Filter semantics (sale-level vs line-item-level):

- date_from / date_to / payment_status / customer  → applied at SALE level.
- product                                           → applied at LINE-ITEM level,
  then the affected sale rows are DISTINCTed so a sale containing the product
  is counted once for sale-level metrics (salesCount, pendingCount, totals,
  customer count).
- Sale-level metrics use Sale.total / Sale.total_cost / Sale.total_profit
  (persisted server-side by the Stage 2 engine).
- Line-item metrics (top products) use the historical SaleItem snapshots.
- Soft-deleted sales are excluded EVERYWHERE.
"""
from collections import OrderedDict
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, List, Optional

from django.db.models import Count, F, Q, Sum

from apps.customers.models import Customer
from apps.sales.models import Sale, SaleItem


def _parse_date(value: Optional[str]) -> Optional[date]:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value))
    except ValueError:
        return None


def build_sale_filters(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    customer: Optional[str] = None,
    payment_status: Optional[str] = None,
    product: Optional[str] = None,
) -> Q:
    """
    Return the base Q filter applied to Sale rows.

    NOTE: `product` is intentionally NOT included here because it must join
    through SaleItem and requires DISTINCT handling at query level. Callers
    that need product scoping must call `apply_product_scope()`.
    """
    filters = Q(is_deleted=False)
    d_from = _parse_date(date_from)
    d_to = _parse_date(date_to)
    if d_from:
        filters &= Q(sale_date__gte=d_from)
    if d_to:
        filters &= Q(sale_date__lte=d_to)
    if customer:
        filters &= Q(customer_id=customer)
    if payment_status and payment_status in ("paid", "pending"):
        filters &= Q(payment_status=payment_status)
    return filters


def apply_product_scope(queryset, product: Optional[str]):
    """Scope a Sale queryset to sales containing the given product."""
    if product:
        queryset = queryset.filter(items__product_id=product).distinct()
    return queryset


def get_filtered_sales(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    customer: Optional[str] = None,
    payment_status: Optional[str] = None,
    product: Optional[str] = None,
):
    """
    Return the active, filtered Sale queryset (sale-level, distinct).
    Uses select_related(customer) for efficient list/report rendering.
    """
    qs = Sale.objects.filter(
        build_sale_filters(date_from, date_to, customer, payment_status, product)
    ).select_related("customer")
    return apply_product_scope(qs, product)


def get_report_summary(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    customer: Optional[str] = None,
    payment_status: Optional[str] = None,
    product: Optional[str] = None,
) -> Dict:
    """
    Report/dashboard summary for the given scope.

    All sale-level numbers are aggregated from persisted Sale fields using
    database aggregation (single pass; no Python loops).
    """
    qs = get_filtered_sales(date_from, date_to, customer, payment_status, product)

    agg = qs.aggregate(
        sales_count=Count("id"),
        total_sales=Sum("total"),
        total_cost=Sum("total_cost"),
        total_profit=Sum("total_profit"),
        paid_amount=Sum("total", filter=Q(payment_status=Sale.PaymentStatus.PAID)),
        pending_amount=Sum("total", filter=Q(payment_status=Sale.PaymentStatus.PENDING)),
        pending_count=Count("id", filter=Q(payment_status=Sale.PaymentStatus.PENDING)),
        customers=Count("customer_id", distinct=True),
    )

    def money(value) -> str:
        return str(value if value is not None else Decimal("0.00"))

    return {
        "salesCount": agg["sales_count"] or 0,
        "totalSales": money(agg["total_sales"]),
        "totalCost": money(agg["total_cost"]),
        "totalProfit": money(agg["total_profit"]),
        "paidAmount": money(agg["paid_amount"]),
        "pendingAmount": money(agg["pending_amount"]),
        "pendingCount": agg["pending_count"] or 0,
        "customers": agg["customers"] or 0,
    }


def _period_bounds(period: str) -> tuple:
    """Return (start, end) for frontend period keys. Rolling windows end today."""
    today = date.today()
    if period == "today":
        return today, today
    if period == "week":
        return today - timedelta(days=6), today
    if period == "year":
        return today - timedelta(days=364), today
    # month and custom/unknown → rolling 30 days
    return today - timedelta(days=29), today


def get_timeseries(
    period: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    customer: Optional[str] = None,
    payment_status: Optional[str] = None,
    product: Optional[str] = None,
) -> List[Dict]:
    """
    Return [{label, value}] buckets for the chart.

    Bucket granularity is derived from the requested range:
      today -> 6 two-hour slots (real totals per slot from created_at)
      week  -> 7 daily buckets
      month -> 4 weekly buckets
      year  -> 6 ~60-day buckets

    Only real persisted sale totals are aggregated — never fabricated.
    """
    # Resolve date bounds
    if date_from and date_to:
        d_from = _parse_date(date_from) or date.today()
        d_to = _parse_date(date_to) or date.today()
    else:
        d_from, d_to = _period_bounds(period or "month")

    qs = get_filtered_sales(
        date_from=d_from.isoformat(),
        date_to=d_to.isoformat(),
        customer=customer,
        payment_status=payment_status,
        product=product,
    )

    span = (d_to - d_from).days
    buckets: List[Dict] = []

    if span <= 1:
        # Today: 6 slots across the business day. Slot sums from created_at.
        slot_labels = ["9-11", "11-13", "13-15", "15-17", "17-19", "19-21"]
        slots = []
        for i in range(6):
            start_hour = 9 + i * 2
            end_hour = start_hour + 2
            slot_qs = qs.filter(
                created_at__hour__gte=start_hour,
                created_at__hour__lt=end_hour,
            )
            total = slot_qs.aggregate(t=Sum("total"))["t"] or Decimal("0.00")
            slots.append(total)
        buckets = [
            {"label": label, "value": float(slots[i])}
            for i, label in enumerate(slot_labels)
        ]
    elif span <= 7:
        # Week: one bucket per calendar day.
        day_totals = {
            d: Decimal("0.00")
            for d in (d_from + timedelta(days=i) for i in range((d_to - d_from).days + 1))
        }
        rows = (
            qs.values("sale_date")
            .annotate(total=Sum("total"))
            .order_by("sale_date")
        )
        for row in rows:
            day_totals[row["sale_date"]] = row["total"] or Decimal("0.00")
        for day, total in day_totals.items():
            buckets.append({
                "label": day.strftime("%a"),
                "value": float(total),
            })
    elif span <= 31:
        # Month: 4 weekly buckets.
        bucket_size = max(1, (span + 1) // 4)
        rows = list(
            qs.values("sale_date")
            .annotate(total=Sum("total"))
            .order_by("sale_date")
        )
        grouped: OrderedDict = OrderedDict()
        for row in rows:
            idx = min((row["sale_date"] - d_from).days // bucket_size, 3)
            key = f"W{idx + 1}"
            grouped.setdefault(key, Decimal("0.00"))
            grouped[key] += row["total"] or Decimal("0.00")
        buckets = [{"label": k, "value": float(v)} for k, v in grouped.items()]
    else:
        # Year: 6 ~60-day buckets.
        rows = list(
            qs.values("sale_date")
            .annotate(total=Sum("total"))
            .order_by("sale_date")
        )
        bucket_size = max(1, (span + 1) // 6)
        grouped: OrderedDict = OrderedDict()
        for row in rows:
            idx = min((row["sale_date"] - d_from).days // bucket_size, 5)
            key = f"P{idx + 1}"
            grouped.setdefault(key, Decimal("0.00"))
            grouped[key] += row["total"] or Decimal("0.00")
        buckets = [{"label": k, "value": float(v)} for k, v in grouped.items()]

    return buckets


def get_top_products(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    customer: Optional[str] = None,
    payment_status: Optional[str] = None,
    product: Optional[str] = None,
    limit: int = 5,
) -> List[Dict]:
    """
    Top products by revenue, computed from HISTORICAL SaleItem snapshots.
    Never depends on current Product master prices.
    """
    qs = SaleItem.objects.filter(
        sale__is_deleted=False,
    ).select_related("sale", "sale__customer")

    if date_from:
        qs = qs.filter(sale__sale_date__gte=_parse_date(date_from))
    if date_to:
        qs = qs.filter(sale__sale_date__lte=_parse_date(date_to))
    if customer:
        qs = qs.filter(sale__customer_id=customer)
    if payment_status and payment_status in ("paid", "pending"):
        qs = qs.filter(sale__payment_status=payment_status)
    if product:
        qs = qs.filter(product_id=product)

    rows = (
        qs.values("product_id", "product_name")
        .annotate(
            quantity=Sum("quantity"),
            revenue=Sum(F("selling_price") * F("quantity")),
            profit=Sum(F("selling_price") * F("quantity") - F("cost_price") * F("quantity")),
        )
        .order_by("-revenue")[:limit]
    )
    return [
        {
            "productId": row["product_id"],
            "productName": row["product_name"],
            "quantity": row["quantity"] or 0,
            "revenue": str(row["revenue"] or Decimal("0.00")),
            "profit": str(row["profit"] or Decimal("0.00")),
        }
        for row in rows
    ]


def get_top_customers(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    customer: Optional[str] = None,
    payment_status: Optional[str] = None,
    product: Optional[str] = None,
    limit: int = 5,
) -> List[Dict]:
    """
    Top customers by total sales value within scope.

    purchaseCount here is the number of SALE RECORDS (not loyalty purchases) —
    matching the frontend "N sales" label. Loyalty distinct-date counts are a
    separate concept (see loyalty_service) and are NOT mixed in here.
    """
    qs = get_filtered_sales(date_from, date_to, customer, payment_status, product)
    rows = (
        qs.values("customer_id", "customer__name", "customer__code")
        .annotate(total=Sum("total"), purchases=Count("id"))
        .order_by("-total")[:limit]
    )
    return [
        {
            "customerId": row["customer_id"],
            "name": row["customer__name"],
            "code": row["customer__code"],
            "total": str(row["total"] or Decimal("0.00")),
            "purchases": row["purchases"] or 0,
        }
        for row in rows
    ]


def get_loyalty_overview(limit: int = 6) -> Dict:
    """
    Dashboard loyalty section.

    approaching: customers within 3 purchases of their next milestone.
    recent:      the most recent milestone purchase dates, per the SAME
                 distinct-date loyalty rule (reuses loyalty_service data per
                 sale via get_sale_loyalty_info on paid active sales).
    """
    from services.loyalty_service import get_customer_loyalty_data, get_sale_loyalty_info

    customers = Customer.objects.all()
    approaching = []
    for customer in customers:
        data = get_customer_loyalty_data(customer.id)
        if data["paid_purchases"] > 0 and data["next_milestone"] - data["paid_purchases"] <= 3:
            approaching.append({
                "id": customer.id,
                "name": customer.name,
                "paidPurchases": data["paid_purchases"],
                "nextMilestone": data["next_milestone"],
            })
            if len(approaching) >= limit:
                break
    approaching.sort(key=lambda c: c["nextMilestone"] - c["paidPurchases"])

    recent_sales = (
        Sale.objects.filter(is_deleted=False, payment_status=Sale.PaymentStatus.PAID)
        .select_related("customer")
        .order_by("-sale_date", "-id")
    )
    recent = []
    for sale in recent_sales:
        info = get_sale_loyalty_info(sale)
        if info["purchase_number"] and info["is_milestone"]:
            recent.append({
                "id": sale.id,
                "name": sale.customer.name,
                "date": sale.sale_date.isoformat(),
                "purchaseNumber": info["purchase_number"],
            })
            if len(recent) >= 4:
                break

    return {"approaching": approaching, "recent": recent}
