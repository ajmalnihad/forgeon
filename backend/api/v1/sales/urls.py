from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SaleViewSet

app_name = "sales"

router = DefaultRouter()
router.register(r"", SaleViewSet, basename="sale")

urlpatterns = [
    path("", include(router.urls)),
]
