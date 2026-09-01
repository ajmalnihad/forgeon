from django.urls import path, include

app_name = "v1"

urlpatterns = [
    path("auth/", include("api.v1.auth.urls")),
    path("customers/", include("api.v1.customers.urls")),
    path("products/", include("api.v1.products.urls")),
    path("sales/", include("api.v1.sales.urls")),
    path("dashboard/", include("api.v1.dashboard.urls")),
    path("reports/", include("api.v1.reports.urls")),
]
