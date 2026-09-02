import re

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.db import models, transaction

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
                models.Q(code__icontains=search_clean)
            )
            
        if limit:
            try:
                queryset = queryset[:int(limit)]
            except ValueError:
                pass
                
        return queryset

    @action(detail=False, methods=["post"], url_path="bulk-import")
    def bulk_import(self, request):
        """Validate and atomically create customers from one record per line."""
        if not request.user.is_app_admin:
            raise PermissionDenied("Only an Admin can bulk import customers.")

        raw_text = request.data.get("text", "")
        if not isinstance(raw_text, str) or not raw_text.strip():
            return Response(
                {"success": False, "errors": [{"line": 1, "message": "Paste at least one customer record."}]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        errors = []
        validated_rows = []
        seen_phones = {}
        for line_number, raw_line in enumerate(raw_text.splitlines(), start=1):
            line = raw_line.strip()
            if not line:
                continue
            line = re.sub(r"^\s*\d+\.\s*", "", line)
            parts = [part.strip() for part in line.split(",")]
            if len(parts) not in (2, 3):
                errors.append({"line": line_number, "message": "Expected Name,Phone,Address."})
                continue

            name, phone = parts[:2]
            place = parts[2] if len(parts) == 3 else ""
            if not name:
                errors.append({"line": line_number, "message": "Name is required."})
            if not phone:
                errors.append({"line": line_number, "message": "Phone is required."})
            if not place:
                errors.append({"line": line_number, "message": "Address/place is required by the customer model."})
            if not name or not phone or not place:
                continue

            phone_key = phone.casefold()
            if phone_key in seen_phones:
                errors.append({"line": line_number, "message": f"Phone number duplicates line {seen_phones[phone_key]}."})
                continue
            seen_phones[phone_key] = line_number
            if Customer.objects.filter(phone__iexact=phone).exists():
                errors.append({"line": line_number, "message": "Phone number already exists."})
                continue

            serializer = CustomerSerializer(data={"name": name, "phone": phone, "place": place})
            if not serializer.is_valid():
                for message in sum(serializer.errors.values(), []):
                    errors.append({"line": line_number, "message": str(message)})
                continue
            validated_rows.append((line_number, serializer.validated_data))

        if errors or not validated_rows:
            if not errors:
                errors.append({"line": 1, "message": "No customer records found."})
            return Response({"success": False, "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            created = [Customer.objects.create(**data) for _, data in validated_rows]

        return Response(
            {
                "success": True,
                "created_count": len(created),
                "customers": [{"id": c.id, "name": c.name, "code": c.code} for c in created],
            },
            status=status.HTTP_201_CREATED,
        )

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
