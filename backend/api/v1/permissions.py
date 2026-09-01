from rest_framework import permissions
from apps.accounts.models import User


class IsAdminRole(permissions.BasePermission):
    """
    Permission checking that the authenticated user possesses the 'admin' role.
    This acts as the authoritative security gate, not the frontend.
    """
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_app_admin
        )


class IsStaffRole(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_app_staff
        )
