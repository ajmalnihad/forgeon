from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from services.report_service import (
    get_loyalty_overview,
    get_report_summary,
    get_timeseries,
    get_top_customers,
    get_top_products,
)


def _scope_params(request):
    """Extract the shared report filter params from a request."""
    q = request.query_params
    return {
        "date_from": q.get("date_from"),
        "date_to": q.get("date_to"),
        "customer": q.get("customer"),
        "payment_status": q.get("payment_status"),
        "product": q.get("product"),
    }


class ReportSummaryView(APIView):
    """GET /api/v1/reports/summary/ — aggregate summary for filters."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(get_report_summary(**_scope_params(request)))


class ReportTimeseriesView(APIView):
    """GET /api/v1/reports/timeseries/ — chart buckets for filters."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        params = _scope_params(request)
        params["period"] = request.query_params.get("period")
        return Response(get_timeseries(**params))


class TopProductsView(APIView):
    """GET /api/v1/reports/top-products/ — top products by historical revenue."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        params = _scope_params(request)
        try:
            params["limit"] = int(request.query_params.get("limit", 5))
        except (TypeError, ValueError):
            params["limit"] = 5
        return Response(get_top_products(**params))


class TopCustomersView(APIView):
    """GET /api/v1/reports/top-customers/ — top customers by sales total."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        params = _scope_params(request)
        try:
            params["limit"] = int(request.query_params.get("limit", 5))
        except (TypeError, ValueError):
            params["limit"] = 5
        return Response(get_top_customers(**params))


class LoyaltyOverviewView(APIView):
    """GET /api/v1/reports/loyalty/ — approaching + recent milestones."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(get_loyalty_overview())


class ReportPdfExportView(APIView):
    """
    GET /api/v1/reports/export/pdf/
    Server-generated PDF report (ReportLab) honoring the same report filters.
    Returns application/pdf.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from services.pdf_service import build_sales_report_pdf
        params = _scope_params(request)
        pdf_bytes = build_sales_report_pdf(**params)
        response = Response(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="forgeon-sales-report.pdf"'
        return response
