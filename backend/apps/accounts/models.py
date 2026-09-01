"""
ForgeON user model.

CRITICAL: this custom model exists BEFORE the first migration so the project
never has to swap user models later.

Application roles are deliberately separate from Django's `is_superuser` /
`is_staff` flags:

- `is_superuser` / `is_staff`  → Django admin site access (framework concern)
- `role`                       → ForgeON application role (business concern)

The only application roles are ADMIN and STAFF. Backend authorization in
Stage 2+ must check `role`, never the frontend's claims.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        STAFF = "staff", "Staff"

    # Display name used across the app (e.g. "Ajmal Nihad"). Kept optional so
    # `createsuperuser` works without friction; falls back to username.
    name = models.CharField(max_length=150, blank=True)

    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STAFF,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"

    def __str__(self) -> str:
        return self.display_name

    @property
    def display_name(self) -> str:
        return self.name or self.username

    @property
    def is_app_admin(self) -> bool:
        """Application-level Admin role (NOT Django is_superuser)."""
        return self.role == self.Role.ADMIN

    @property
    def is_app_staff(self) -> bool:
        return self.role == self.Role.STAFF
