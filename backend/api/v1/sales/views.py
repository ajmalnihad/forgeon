from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import models
from rest_framework.exceptions import PermissionDenied, ValidationError


def _django_err(exc: DjangoValidationError) -> str:
    """Return a single user-safe string from a DjangoValidationError."""
    if hasattr(exc, "message"):
        return exc.message
    if hasattr(exc, "messages") and exc.messages:
        return exc.messages[0]
    return str(exc)

from apps.sales.models import Sale
from .serializers import SaleSerializer, SoftDeleteSerializer
from api.v1.permissions import IsAdminRole
from services.sale_service import create_sale, update_sale
from services.payment_service import mark_sale_paid
from services.trash_service import soft_delete_sale, restore_sale


class SaleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Sale and SaleItem domains.
    
    Permissions (enforced):
    - list, retrieve, create, update: IsAuthenticated.
    - mark_paid, soft_delete, restore, trash: IsAdminRole (Admin only).
    """
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ["mark_paid", "destroy", "restore", "trash"]:
            return [IsAdminRole()]
        return super().get_permissions()

    def get_queryset(self):
        # Default action: list excludes deleted sales.
        # trash action has its own queryset.
        queryset = (
            Sale.objects.all()
            .select_related("customer", "created_by", "deleted_by")
            .prefetch_related("items")
        )
        if self.action in ["list"]:
            queryset = queryset.filter(is_deleted=False)
            
        # Filters (Search & Scope parameters matching ReportsPage + SalesListPage)
        search = self.request.query_params.get("search", None)
        date_from = self.request.query_params.get("date_from", None)
        date_to = self.request.query_params.get("date_to", None)
        payment_status = self.request.query_params.get("payment_status", None)
        customer = self.request.query_params.get("customer", None)
        product = self.request.query_params.get("product", None)
        ordering_param = self.request.query_params.get("ordering", "date_desc")
        
        if search:
            search_clean = search.strip()
            queryset = queryset.filter(
                models.Q(customer__name__icontains=search_clean) |
                models.Q(customer__code__icontains=search_clean) |
                models.Q(customer__phone__icontains=search_clean) |
                models.Q(customer__whatsapp__icontains=search_clean) |
                models.Q(items__product_name__icontains=search_clean)
            ).distinct()
            
        if date_from:
            queryset = queryset.filter(sale_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(sale_date__lte=date_to)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        if customer:
            queryset = queryset.filter(customer_id=customer)
        if product:
            queryset = queryset.filter(items__product_id=product).distinct()
            
        # Standardize ordering
        order_map = {
            "date_desc": ["-sale_date", "-id"],
            "date_asc": ["sale_date", "id"],
            "total_desc": ["-total", "-id"],
            "total_asc": ["total", "id"],
            "profit_desc": ["-total_profit", "-id"]
        }
        order_by = order_map.get(ordering_param, ["-sale_date", "-id"])
        queryset = queryset.order_by(*order_by)
        
        return queryset

    def retrieve(self, request, *args, **kwargs):
        """Staff members must not be exposed to soft-deleted sales directly."""
        sale = self.get_object()
        if sale.is_deleted and not request.user.is_app_admin:
            raise PermissionDenied("You do not have permission to view this soft-deleted sale.")
        return super().retrieve(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """Transactional creation of sale & line items utilizing business services."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        v_data = serializer.validated_data
        
        # Mapping frontend payloads camelCase and items
        customer_id = v_data["customer_id"]
        sale_date = v_data["sale_date"]
        payment_status = v_data.get("payment_status", Sale.PaymentStatus.PAID)
        
        items_payload = request.data.get("items", [])
        if not items_payload:
            raise ValidationError({"items": "Add at least one product to the sale."})
            
        items_data = []
        for item in items_payload:
            if "productId" not in item or "quantity" not in item:
                raise ValidationError({"items": "Line items must contain productId and quantity."})
            item_data = {
                "product_id": item["productId"],
                "quantity": item["quantity"],
            }
            if item.get("costPrice") is not None:
                item_data["cost_price"] = item["costPrice"]
            if item.get("sellingPrice") is not None:
                item_data["selling_price"] = item["sellingPrice"]
            items_data.append(item_data)
            
        try:
            sale = create_sale(
                customer_id=customer_id,
                sale_date=sale_date,
                items_data=items_data,
                payment_status=payment_status,
                created_by=request.user
            )
        except DjangoValidationError as exc:
            raise ValidationError(detail=_django_err(exc))

        response_serializer = self.get_serializer(sale)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Transactional modification of existing sale."""
        sale = self.get_object()
        serializer = self.get_serializer(sale, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        v_data = serializer.validated_data
        customer_id = v_data.get("customer_id")
        sale_date = v_data.get("sale_date")
        payment_status = v_data.get("payment_status")
        
        # Support full replacement of items on update
        items_payload = request.data.get("items", None)
        items_data = None
        if items_payload is not None:
            if not items_payload:
                raise ValidationError({"items": "Add at least one product to the sale."})
            items_data = []
            for item in items_payload:
                if "productId" not in item or "quantity" not in item:
                    raise ValidationError({"items": "Line items must contain productId and quantity."})
                item_data = {
                    "product_id": item["productId"],
                    "quantity": item["quantity"],
                }
                if item.get("costPrice") is not None:
                    item_data["cost_price"] = item["costPrice"]
                if item.get("sellingPrice") is not None:
                    item_data["selling_price"] = item["sellingPrice"]
                items_data.append(item_data)
                
        try:
            updated_instance = update_sale(
                sale=sale,
                customer_id=customer_id,
                sale_date=sale_date,
                items_data=items_data,
                payment_status=payment_status,
                user=request.user
            )
        except DjangoValidationError as exc:
            raise ValidationError(detail=_django_err(exc))

        response_serializer = self.get_serializer(updated_instance)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        """POST /api/v1/sales/{id}/mark-paid/ (Admin only)"""
        try:
            sale = mark_sale_paid(sale_id=pk, user=request.user)
        except DjangoValidationError as exc:
            raise ValidationError(detail=_django_err(exc))

        serializer = self.get_serializer(sale)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, pk=None, *args, **kwargs):
        """
        DELETE /api/v1/sales/{id}/ (Admin only)
        Accepts a JSON payload { "reason": "..." } and triggers soft-deletion.
        """
        serializer = SoftDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            soft_delete_sale(
                sale_id=pk,
                reason=serializer.validated_data["reason"],
                user=request.user
            )
        except DjangoValidationError as exc:
            raise ValidationError(detail=_django_err(exc))

        return Response({"detail": "Sale soft-deleted successfully."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="restore")
    def restore(self, request, pk=None):
        """POST /api/v1/sales/{id}/restore/ (Admin only)"""
        try:
            sale = restore_sale(sale_id=pk, user=request.user)
        except DjangoValidationError as exc:
            raise ValidationError(detail=_django_err(exc))

        serializer = self.get_serializer(sale)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="trash")
    def trash(self, request):
        """
        GET /api/v1/sales/trash/ (Admin only)
        Retrieve soft-deleted sales.
        """
        queryset = (
            Sale.objects.filter(is_deleted=True)
            .select_related("customer", "created_by", "deleted_by")
            .prefetch_related("items")
            .order_by("-deleted_at", "-id")
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
