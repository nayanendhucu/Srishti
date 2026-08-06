from django.db import models
from django.conf import settings
from artists.models import ArtistProfile

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('declined', 'Declined'),
    ]
    DELIVERY_CHOICES = [('digital', 'Digital'), ('physical', 'Physical'), ('both', 'Both')]
    SERVICE_CHOICES = [('standard', 'Standard'), ('express', 'Express'), ('premium', 'Premium')]
    PAYMENT_CHOICES = [
        ('not_requested', 'Not Requested'),
        ('pending_upload', 'Pending Upload'),
        ('submitted', 'Submitted'),
        ('verified', 'Verified'),
    ]

    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    artist = models.ForeignKey(ArtistProfile, on_delete=models.CASCADE, related_name='bookings')
    description = models.TextField()
    service_type = models.CharField(max_length=20, choices=SERVICE_CHOICES, default='standard')
    artwork_size = models.CharField(max_length=50, blank=True)
    delivery = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='digital')
    delivery_address = models.TextField(blank=True)
    preferred_date = models.DateField()
    reference_image = models.ImageField(upload_to='references/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    advance_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='not_requested')
    payment_screenshot = models.ImageField(upload_to='payment_screenshots/', blank=True, null=True)
    payment_uploaded_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking #{self.id} - {self.client.email} → {self.artist}"
