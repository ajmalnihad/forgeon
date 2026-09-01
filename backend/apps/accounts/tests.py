"""Stage 1 foundation tests — custom User model."""
from django.contrib.auth import get_user_model
from django.test import TestCase

User = get_user_model()


class UserModelTests(TestCase):
    def test_custom_user_model_is_configured(self) -> None:
        self.assertEqual(User._meta.app_label, "accounts")
        self.assertEqual(User._meta.model_name, "user")

    def test_role_choices(self) -> None:
        admin = User.objects.create_user(username="a1", password="x", role=User.Role.ADMIN)
        staff = User.objects.create_user(username="s1", password="x")  # default role
        self.assertTrue(admin.is_app_admin)
        self.assertFalse(admin.is_app_staff)
        self.assertTrue(staff.is_app_staff)
        self.assertEqual(staff.role, User.Role.STAFF)

    def test_app_role_is_separate_from_superuser(self) -> None:
        su = User.objects.create_superuser(username="root", password="x")
        # Django superuser does NOT imply application Admin role.
        self.assertTrue(su.is_superuser)
        self.assertEqual(su.role, User.Role.STAFF)

    def test_display_name_falls_back_to_username(self) -> None:
        u = User.objects.create_user(username="u1", password="x")
        self.assertEqual(u.display_name, "u1")
        u.name = "Ajmal Nihad"
        self.assertEqual(u.display_name, "Ajmal Nihad")
