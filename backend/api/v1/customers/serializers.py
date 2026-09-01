from django.db.models import Sum
from rest_framework import serializers

from apps.customers.models import Customer
from apps.sales.models import Sale
from services.loyalty_service import get_customer_loyalty_data


class CustomerSerializer(serializers.ModelSerializer):
    """
    Customer serializer exposing camelCase fields to match the frontend contract.

    Derived fields (paidPurchases, nextMilestone) call the SAME authoritative
    loyalty service as the rest of the backend — never independently computed.

    N+1 note: _loyalty_data is computed once per object instance via a simple
    cache on the serializer method context. For list endpoints at MVP scale
    this is acceptable; a future annotation-based approach can replace it.
    """

    paidPurchases = serializers.SerializerMethodField()
    nextMilestone = serializers.SerializerMethodField()
    totalPurchases = serializers.SerializerMethodField()
    totalSpent = serializers.SerializerMethodField()
    pendingAmount = serializers.SerializerMethodField()
    lastPurchaseDate = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = (
            "id",
            "code",
            "name",
            "phone",
            "whatsapp",
            "place",
            "address",
            "email",
            "paidPurchases",
            "nextMilestone",
            "totalPurchases",
            "totalSpent",
            "pendingAmount",
            "lastPurchaseDate",
        )
        read_only_fields = ("id", "code")

    def _loyalty(self, obj):
        """Cache loyalty data per object so we call the service exactly once."""
        if not hasattr(obj, "_loyalty_cache"):
            obj._loyalty_cache = get_customer_loyalty_data(obj.id)
        return obj._loyalty_cache

    def get_paidPurchases(self, obj) -> int:
        return self._loyalty(obj)["paid_purchases"]

    def get_nextMilestone(self, obj) -> int:
        return self._loyalty(obj)["next_milestone"]

    def get_totalPurchases(self, obj) -> int:
        return Sale.objects.filter(customer=obj, is_deleted=False).count()

    def get_totalSpent(self, obj) -> float:
        val = Sale.objects.filter(
            customer=obj,
            payment_status=Sale.PaymentStatus.PAID,
            is_deleted=False,
        ).aggregate(s=Sum("total"))["s"]
        return float(val) if val else 0.0

    def get_pendingAmount(self, obj) -> float:
        val = Sale.objects.filter(
            customer=obj,
            payment_status=Sale.PaymentStatus.PENDING,
            is_deleted=False,
        ).aggregate(s=Sum("total"))["s"]
        return float(val) if val else 0.0

    def get_lastPurchaseDate(self, obj):
        sale_date = (
            Sale.objects.filter(customer=obj, is_deleted=False)
            .order_by("-sale_date")
            .values_list("sale_date", flat=True)
            .first()
        )
        return str(sale_date) if sale_date else None


class LoyaltyPreviewInputSerializer(serializers.Serializer):
    date = serializers.DateField(required=True)
    paymentDone = serializers.BooleanField(required=True)
    excludeSaleId = serializers.IntegerField(required=False, allow_null=True)
