from typing import Optional

from rest_framework import serializers

from apps.sales.models import Sale, SaleItem
from services.loyalty_service import get_sale_loyalty_info


class SaleItemSerializer(serializers.ModelSerializer):
    productId = serializers.IntegerField(source="product_id")
    productName = serializers.CharField(source="product_name", read_only=True)
    unit = serializers.CharField(read_only=True)
    quantity = serializers.IntegerField()
    # Snapshotted prices: read-only or customizable on write
    costPrice = serializers.DecimalField(
        source="cost_price",
        max_digits=12,
        decimal_places=2,
        required=False
    )
    sellingPrice = serializers.DecimalField(
        source="selling_price",
        max_digits=12,
        decimal_places=2,
        required=False
    )

    class Meta:
        model = SaleItem
        fields = (
            "productId",
            "productName",
            "unit",
            "quantity",
            "costPrice",
            "sellingPrice",
        )


class SaleSerializer(serializers.ModelSerializer):
    date = serializers.DateField(source="sale_date")
    paymentStatus = serializers.CharField(source="payment_status", required=False)
    
    # Customer details (derived for the read-only contract)
    customerId = serializers.IntegerField(source="customer_id")
    customerName = serializers.SerializerMethodField()
    customerCode = serializers.SerializerMethodField()
    customerPhone = serializers.SerializerMethodField()
    
    items = SaleItemSerializer(many=True)
    
    # Server-side totals
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    cost = serializers.DecimalField(source="total_cost", max_digits=12, decimal_places=2, read_only=True)
    profit = serializers.DecimalField(source="total_profit", max_digits=12, decimal_places=2, read_only=True)
    
    # Derived loyalty metrics
    purchaseNumber = serializers.SerializerMethodField()
    isMilestone = serializers.SerializerMethodField()
    
    createdBy = serializers.SerializerMethodField()
    
    # Soft delete metadata
    deleted = serializers.BooleanField(source="is_deleted", read_only=True)
    deleteReason = serializers.CharField(source="delete_reason", read_only=True)
    deletedBy = serializers.SerializerMethodField()
    deletedAt = serializers.DateTimeField(source="deleted_at", read_only=True)

    class Meta:
        model = Sale
        fields = (
            "id",
            "date",
            "paymentStatus",
            "customerId",
            "customerName",
            "customerCode",
            "customerPhone",
            "items",
            "total",
            "cost",
            "profit",
            "purchaseNumber",
            "isMilestone",
            "createdBy",
            "deleted",
            "deleteReason",
            "deletedBy",
            "deletedAt",
        )
        read_only_fields = ("id", "total", "cost", "profit", "createdBy")

    def get_customerName(self, obj) -> str:
        return obj.customer.name

    def get_customerCode(self, obj) -> str:
        return obj.customer.code

    def get_customerPhone(self, obj) -> str:
        return obj.customer.phone or obj.customer.whatsapp

    def get_createdBy(self, obj) -> Optional[str]:
        return obj.created_by.display_name if obj.created_by else None

    def get_deletedBy(self, obj) -> Optional[str]:
        return obj.deleted_by.display_name if obj.deleted_by else None

    def get_purchaseNumber(self, obj) -> Optional[int]:
        return get_sale_loyalty_info(obj)["purchase_number"]

    def get_isMilestone(self, obj) -> bool:
        return get_sale_loyalty_info(obj)["is_milestone"]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Add at least one product to the sale.")
        return value


class SoftDeleteSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=1)
