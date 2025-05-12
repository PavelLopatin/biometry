from django.contrib import admin

from helpers.admin.model import CustomModelAdmin
from processing.models import Account


@admin.register(Account)
class AccountAdmin(CustomModelAdmin):
    exclude = ["helper"]
