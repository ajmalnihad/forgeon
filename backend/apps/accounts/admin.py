from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Standard Django user admin extended with ForgeON name + role."""

    fieldsets = DjangoUserAdmin.fieldsets + (
        ("ForgeON", {"fields": ("name", "role")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("ForgeON", {"fields": ("name", "role")}),
    )
    list_display = ("username", "name", "role", "email", "is_active", "is_superuser")
    list_filter = ("role", "is_active", "is_superuser")
    search_fields = ("username", "name", "email")
    ordering = ("username",)
