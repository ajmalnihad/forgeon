from django.apps import AppConfig


class ReportsConfig(AppConfig):
    """
    Domain preparation only (Stage 1).

    Reports are derived from Sale/SaleItem data, so this app currently has no
    models of its own. Report calculations/services arrive in Stage 3.
    """

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.reports"
    label = "reports"
    verbose_name = "Reports"
