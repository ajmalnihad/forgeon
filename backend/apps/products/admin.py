from django.contrib import admin

from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "unit", "cost_price", "selling_price", "active")
    search_fields = ("name", "category", "description")
    list_filter = ("active", "category")
    readonly_fields = ("created_at", "updated_at")
    ordering = ("name",)
