from django.contrib import admin

from .models import Sale, SaleItem


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    fields = ("product", "product_name", "unit", "quantity", "cost_price", "selling_price")


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer",
        "sale_date",
        "payment_status",
        "total",
        "total_profit",
        "is_deleted",
        "created_by",
    )
    list_filter = ("payment_status", "is_deleted", "sale_date")
    search_fields = ("customer__name", "customer__code", "items__product_name")
    date_hierarchy = "sale_date"
    readonly_fields = ("created_at", "updated_at")
    inlines = [SaleItemInline]
    # Denormalized totals are written by the Stage 2 engine; keep them
    # visible-but-editable in admin only for development seeding.


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    list_display = ("id", "sale", "product_name", "quantity", "cost_price", "selling_price")
    search_fields = ("product_name", "sale__customer__name")
