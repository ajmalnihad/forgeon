from django.urls import path

from .views import DashboardPendingView, DashboardSummaryView, DashboardTimeseriesView

app_name = "dashboard"

urlpatterns = [
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("pending/", DashboardPendingView.as_view(), name="dashboard-pending"),
    path("timeseries/", DashboardTimeseriesView.as_view(), name="dashboard-timeseries"),
]
