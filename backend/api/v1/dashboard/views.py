from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.sales.models import Sale
from api.v1.sales.serializers import SaleSerializer
from services.report_service import (
    get_report_summary,
    get_timeseries,
)


class DashboardSummaryView(APIView):
    """
    GET /api/v1/dashboard/summary/
    Operational summary for the dashboard's Today card and Sales Overview.
    Accepts the same filter params as reports.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_report_summary(
            date_from=request.query_params.get("date_from"),
            date_to=request.query_params.get("date_to"),
            customer=request.query_params.get("customer"),
            payment_status=request.query_params.get("payment_status"),
            product=request.query_params.get("product"),
        )
        return Response(data)


class DashboardPendingView(APIView):
    """
    GET /api/v1/dashboard/pending/
    Active non-deleted pending sales for the Payment Pending cards.
    Reuses the SaleSerializer so cards + bottom sheet keep the exact
    frontend contract (customerName, total, date, items, …).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sales = (
            Sale.objects.filter(is_deleted=False, payment_status=Sale.PaymentStatus.PENDING)
            .select_related("customer", "created_by", "deleted_by")
            .prefetch_related("items")
            .order_by("-sale_date", "-id")
        )
        return Response(SaleSerializer(sales, many=True).data)


class DashboardTimeseriesView(APIView):
    """
    GET /api/v1/dashboard/timeseries/
    Chart buckets for the Sales Overview stepper.
    Params: period=today|week|month|year (or explicit date_from/date_to),
    plus optional customer / product / payment_status filters.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        data = get_timeseries(
            period=request.query_params.get("period"),
            date_from=request.query_params.get("date_from"),
            date_to=request.query_params.get("date_to"),
            customer=request.query_params.get("customer"),
            payment_status=request.query_params.get("payment_status"),
            product=request.query_params.get("product"),
        )
        return Response(data)
