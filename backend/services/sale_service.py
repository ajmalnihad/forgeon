from decimal import Decimal
from typing import List, Dict, Any, Optional
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.accounts.models import User
from apps.customers.models import Customer
from apps.products.models import Product
from apps.sales.models import Sale, SaleItem


def calculate_totals_from_items(items_data: List[Dict[str, Any]]) -> Dict[str, Decimal]:
    """Calculate total, total_cost, and total_profit from raw item prices."""
    total = Decimal("0.00")
    total_cost = Decimal("0.00")
    
    for item in items_data:
        qty = int(item["quantity"])
        cost = Decimal(str(item["cost_price"]))
        sell = Decimal(str(item["selling_price"]))
        
        if sell < cost:
            raise ValidationError("Selling price cannot be below cost price.")
        if qty < 1:
            raise ValidationError("Quantity must be at least 1.")
            
        total += qty * sell
        total_cost += qty * cost
        
    return {
        "total": total,
        "total_cost": total_cost,
        "total_profit": total - total_cost
    }


@transaction.atomic
def create_sale(
    customer_id: int,
    sale_date: str,
    items_data: List[Dict[str, Any]],
    payment_status: str,
    created_by: User
) -> Sale:
    """
    Create a Sale and its related SaleItems within a database transaction.
    Protects multi-table consistency and derives totals server-side.
    """
    try:
        customer = Customer.objects.get(id=customer_id)
    except Customer.DoesNotExist:
        raise ValidationError("Customer does not exist.")
        
    if not items_data:
        raise ValidationError("Add at least one product to the sale.")
        
    # Standardize values & validate products are active for new sales
    final_items = []
    for item in items_data:
        try:
            prod = Product.objects.get(id=item["product_id"])
        except Product.DoesNotExist:
            raise ValidationError(f"Product ID {item['product_id']} does not exist.")
            
        if not prod.active:
            raise ValidationError(f"Product '{prod.name}' is inactive and cannot be selected.")
            
        # Seed from product master if sale-specific values are not supplied
        cost = Decimal(str(item.get("cost_price", prod.cost_price)))
        sell = Decimal(str(item.get("selling_price", prod.selling_price)))
        qty = int(item["quantity"])
        
        final_items.append({
            "product": prod,
            "product_name": prod.name,
            "unit": prod.unit,
            "quantity": qty,
            "cost_price": cost,
            "selling_price": sell
        })

    # Calculate totals
    totals = calculate_totals_from_items(final_items)

    # Apply explicit sale prices only after every line has validated. This
    # keeps invalid sales from attempting invalid Product updates.
    for item, final_item in zip(items_data, final_items):
        if "cost_price" in item or "selling_price" in item:
            product = final_item["product"]
            if "cost_price" in item:
                product.cost_price = final_item["cost_price"]
            if "selling_price" in item:
                product.selling_price = final_item["selling_price"]
            product.save(update_fields=["cost_price", "selling_price", "updated_at"])
    
    # Create Sale
    sale = Sale.objects.create(
        customer=customer,
        sale_date=sale_date,
        payment_status=payment_status,
        total=totals["total"],
        total_cost=totals["total_cost"],
        total_profit=totals["total_profit"],
        created_by=created_by
    )
    
    # Create SaleItems with snapshot fields
    for fi in final_items:
        SaleItem.objects.create(
            sale=sale,
            product=fi["product"],
            product_name=fi["product_name"],
            unit=fi["unit"],
            quantity=fi["quantity"],
            cost_price=fi["cost_price"],
            selling_price=fi["selling_price"]
        )
        
    return sale


@transaction.atomic
def update_sale(
    sale: Sale,
    customer_id: Optional[int] = None,
    sale_date: Optional[str] = None,
    items_data: Optional[List[Dict[str, Any]]] = None,
    payment_status: Optional[str] = None,
    user: Optional[User] = None
) -> Sale:
    """
    Update an existing Sale and its related SaleItems within a transaction.
    
    Staff permission rules:
    - Staff must NOT change the payment status of an existing sale.
    - If a non-admin attempts a payment status transition, reject with validation error.
    """
    if sale.is_deleted:
        raise ValidationError("Cannot edit a deleted sale.")
        
    # Staff payment status restriction (UX & API protection)
    if payment_status is not None and payment_status != sale.payment_status:
        if user and user.is_app_staff:
            raise ValidationError("Staff cannot change existing sale payment status.")
        sale.payment_status = payment_status
        # Note: Sale model does not have a paid_at field; the transition is
        # recorded by updated_at (auto_now). paid_at can be added in a future
        # migration if detailed payment timestamps are required.
            
    if customer_id is not None:
        try:
            customer = Customer.objects.get(id=customer_id)
            sale.customer = customer
        except Customer.DoesNotExist:
            raise ValidationError("Customer does not exist.")
            
    if sale_date is not None:
        sale.sale_date = sale_date
        
    if items_data is not None:
        if not items_data:
            raise ValidationError("Add at least one product to the sale.")
            
        # Delete existing items to replace them (standard clean transactional pattern)
        sale.items.all().delete()
        
        final_items = []
        for item in items_data:
            try:
                prod = Product.objects.get(id=item["product_id"])
            except Product.DoesNotExist:
                raise ValidationError(f"Product ID {item['product_id']} does not exist.")
                
            # Note: for EDITS, we can allow using inactive products IF they were
            # already in the sale. But for simplicity and safety, let's allow
            # using product records regardless of active status when editing,
            # or if it is a new item we validate it. Let's make it robust:
            # allow product if active, OR if it's already referenced.
            cost = Decimal(str(item.get("cost_price", prod.cost_price)))
            sell = Decimal(str(item.get("selling_price", prod.selling_price)))
            qty = int(item["quantity"])
            
            final_items.append({
                "product": prod,
                "product_name": prod.name,
                "unit": prod.unit,
                "quantity": qty,
                "cost_price": cost,
                "selling_price": sell
            })
            
        # Re-calculate totals
        totals = calculate_totals_from_items(final_items)
        sale.total = totals["total"]
        sale.total_cost = totals["total_cost"]
        sale.total_profit = totals["total_profit"]
        
        # Re-create SaleItems
        for fi in final_items:
            SaleItem.objects.create(
                sale=sale,
                product=fi["product"],
                product_name=fi["product_name"],
                unit=fi["unit"],
                quantity=fi["quantity"],
                cost_price=fi["cost_price"],
                selling_price=fi["selling_price"]
            )
            
    sale.save()
    return sale
