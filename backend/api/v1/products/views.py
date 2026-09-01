from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models

from apps.products.models import Product
from .serializers import ProductSerializer
from api.v1.permissions import IsAdminRole


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product domain.
    
    Permissions (enforced):
    - list, retrieve, categories: IsAuthenticated.
    - create, update, partial_update (PATCH): IsAdminRole (Admin only).
    - destroy (DELETE): Blocked (soft-delete is handled via PATCH {active: false}).
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdminRole()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = Product.objects.all()
        user = self.request.user
        
        # Admin can view inactive products if explicitly requested,
        # but Staff can only ever read active products.
        if not (user and user.is_authenticated and user.is_app_admin):
            queryset = queryset.filter(active=True)
        else:
            include_inactive = self.request.query_params.get("include_inactive", "false")
            if include_inactive != "true" and include_inactive != "1":
                queryset = queryset.filter(active=True)
                
        search = self.request.query_params.get("search", None)
        category = self.request.query_params.get("category", None)
        
        if search:
            search_clean = search.strip()
            queryset = queryset.filter(
                models.Q(name__icontains=search_clean) |
                models.Q(category__icontains=search_clean) |
                models.Q(description__icontains=search_clean)
            )
            
        if category and category != "all":
            queryset = queryset.filter(category=category)
            
        return queryset

    @action(detail=False, methods=["get"], url_path="categories")
    def categories(self, request):
        """
        GET /api/v1/products/categories/
        Returns a flat list of unique active categories in use.
        """
        # Expose only categories of active products to Staff,
        # but include inactive products for Admin if they can view them.
        queryset = Product.objects.all()
        if not (request.user and request.user.is_authenticated and request.user.is_app_admin):
            queryset = queryset.filter(active=True)
            
        cats = queryset.values_list("category", flat=True).distinct().order_by("category")
        return Response(list(cats), status=status.HTTP_200_OK)
