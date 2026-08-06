from django.db import models

from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [('client', 'Client'), ('artist', 'Artist')]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='client')
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.email} ({self.role})"