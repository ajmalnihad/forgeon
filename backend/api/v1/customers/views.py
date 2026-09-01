from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models

from apps.customers.models import Customer
from .serializers import CustomerSerializer, LoyaltyPreviewInputSerializer
from api.v1.permissions import IsAdminRole
from services.loyalty_service import get_loyalty_preview


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Customer domain.
    
    Permissions (enforced):
    - list, retrieve, create: IsAuthenticated (Admin + Staff can create customer).
    - update, partial_update (PATCH): IsAdminRole (Admin only).
    - destroy (DELETE): Blocked (not implemented per scope).
    """
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [IsAdminRole()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Customer.objects.all()
        search = self.request.query_params.get("search", None)
        limit = self.request.query_params.get("limit", None)
        
        if search:
            search_clean = search.strip()
            queryset = queryset.filter(
                models.Q(name__icontains=search_clean) |
                models.Q(phone__icontains=search_clean) |
                models.Q(whatsapp__icontains=search_clean) |
                models.Q(place__icontains=search_clean) |
                models.Q(code__iexact=search_clean)
            )
            
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass
                
        return queryset

    @action(detail=True, methods=["post"], url_path="loyalty-preview")
    def loyalty_preview(self, request, pk=None):
        """
        POST /api/v1/customers/{id}/loyalty-preview/
        Generates dry-run loyalty calculations to prevent frontend drift.
        """
        customer = self.get_object()
        serializer = LoyaltyPreviewInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        preview_data = get_loyalty_preview(
            customer_id=customer.id,
            sale_date=serializer.validated_data["date"],
            payment_done=serializer.validated_data["paymentDone"],
            exclude_sale_id=serializer.validated_data.get("excludeSaleId")
        )
        
        return Response(preview_data, status=status.HTTP_200_OK)
