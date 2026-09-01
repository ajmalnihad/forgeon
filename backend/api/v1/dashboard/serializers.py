"""
Dashboard serializers.

The dashboard reuses the existing SaleSerializer output for pending cards so
the frontend `PendingPaymentCard` / `SaleDetailSheet` contracts stay identical.
The summary and timeseries payloads are plain service-produced dictionaries
(no extra serialization needed).
"""
from rest_framework import serializers

from api.v1.sales.serializers import SaleSerializer


class DashboardPendingSerializer(SaleSerializer):
    """Explicit wrapper documenting that pending cards reuse SaleSerializer."""

    class Meta(SaleSerializer.Meta):
        pass


class DashboardSummarySerializer(serializers.Serializer):
    salesCount = serializers.IntegerField()
    totalSales = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalCost = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalProfit = serializers.DecimalField(max_digits=12, decimal_places=2)
    paidAmount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pendingAmount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pendingCount = serializers.IntegerField()
    customers = serializers.IntegerField()


class DashboardTimeseriesItemSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.FloatField()
