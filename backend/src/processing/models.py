from django.db import models


class Account(models.Model):
    contract_address = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(unique=True)
    signer = models.CharField(max_length=255)
    recovery_signer = models.CharField(max_length=255)
    helper = models.TextField()
