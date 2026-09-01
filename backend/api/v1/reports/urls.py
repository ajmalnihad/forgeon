from django.urls import path

from .views import (
    LoyaltyOverviewView,
    ReportPdfExportView,
    ReportSummaryView,
    ReportTimeseriesView,
    TopCustomersView,
    TopProductsView,
)

app_name = "reports"

urlpatterns = [
    path("summary/", ReportSummaryView.as_view(), name="report-summary"),
    path("timeseries/", ReportTimeseriesView.as_view(), name="report-timeseries"),
    path("top-products/", TopProductsView.as_view(), name="report-top-products"),
    path("top-customers/", TopCustomersView.as_view(), name="report-top-customers"),
    path("loyalty/", LoyaltyOverviewView.as_view(), name="report-loyalty"),
    path("export/pdf/", ReportPdfExportView.as_view(), name="report-export-pdf"),
]
