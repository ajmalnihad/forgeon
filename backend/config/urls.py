"""
ForgeON backend URL configuration.

Routes all admin paths and the version 1 API namespaces:
    /api/v1/ -> api.v1.urls
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("api.v1.urls")),
]
