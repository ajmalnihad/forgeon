from django.contrib import admin

from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "phone", "whatsapp", "place", "created_at")
    search_fields = ("name", "code", "phone", "whatsapp", "place")
    list_filter = ("place",)
    readonly_fields = ("code", "created_at", "updated_at")
    ordering = ("name",)
