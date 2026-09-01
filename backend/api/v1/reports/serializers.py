"""
Report serializers.

Aggregations are computed in `services/report_service.py` and returned as
plain dictionaries; these serializers only declare the stable response
contract for documentation and validation.
"""
from rest_framework import serializers


class ReportSummarySerializer(serializers.Serializer):
    salesCount = serializers.IntegerField()
    totalSales = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalCost = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalProfit = serializers.DecimalField(max_digits=12, decimal_places=2)
    paidAmount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pendingAmount = serializers.DecimalField(max_digits=12, decimal_places=2)
    pendingCount = serializers.IntegerField()
    customers = serializers.IntegerField()


class TimeseriesItemSerializer(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.FloatField()


class TopProductSerializer(serializers.Serializer):
    productId = serializers.IntegerField()
    productName = serializers.CharField()
    quantity = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    profit = serializers.DecimalField(max_digits=12, decimal_places=2)


class TopCustomerSerializer(serializers.Serializer):
    customerId = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField()
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    purchases = serializers.IntegerField()


class LoyaltyApproachingItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    paidPurchases = serializers.IntegerField()
    nextMilestone = serializers.IntegerField()


class LoyaltyRecentItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    date = serializers.DateField()
    purchaseNumber = serializers.IntegerField()


class LoyaltyOverviewSerializer(serializers.Serializer):
    approaching = LoyaltyApproachingItemSerializer(many=True)
    recent = LoyaltyRecentItemSerializer(many=True)
