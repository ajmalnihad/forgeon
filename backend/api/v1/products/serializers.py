from rest_framework import serializers
from apps.products.models import Product


class ProductSerializer(serializers.ModelSerializer):
    costPrice = serializers.DecimalField(
        source="cost_price",
        max_digits=12,
        decimal_places=2,
    )
    sellingPrice = serializers.DecimalField(
        source="selling_price",
        max_digits=12,
        decimal_places=2,
    )

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "category",
            "description",
            "unit",
            "costPrice",
            "sellingPrice",
            "active",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        # Selling price >= cost price validation
        cost = attrs.get("cost_price")
        sell = attrs.get("selling_price")
        
        # On partial updates, cost or sell might not be supplied. Fallback to model values.
        if cost is None and self.instance:
            cost = self.instance.cost_price
        if sell is None and self.instance:
            sell = self.instance.selling_price
            
        if cost is not None and sell is not None and sell < cost:
            raise serializers.ValidationError(
                {"sellingPrice": "Selling price cannot be below cost price."}
            )
        return attrs
