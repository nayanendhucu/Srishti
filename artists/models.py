
from django.db import models
from django.conf import settings

STYLE_CHOICES = [
    ('portrait', 'Portrait'), ('abstract', 'Abstract'),
    ('watercolour', 'Watercolour'), ('oil', 'Oil Painting'),
    ('sketch', 'Sketch'), ('digital', 'Digital'),
    ('mandala', 'Mandala'), ('mural', 'Mural'),
]

LOCATION_CHOICES = [
    ('kerala', 'Kerala'), ('delhi', 'Delhi'),
    ('bengaluru', 'Bengaluru'), ('mumbai', 'Mumbai'),
    ('chennai', 'Chennai'), ('kolkata', 'Kolkata'),
    ('jaipur', 'Jaipur'), ('ahmedabad', 'Ahmedabad'), ('pune', 'Pune'),
]

class ArtistProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='artist_profile')
    bio = models.TextField(blank=True)
    portfolio_url = models.URLField(blank=True)
    location = models.CharField(max_length=50, choices=LOCATION_CHOICES)
    style = models.CharField(max_length=50, choices=STYLE_CHOICES)
    base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    rating = models.FloatField(default=0.0)
    total_bookings = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    phone = models.CharField(max_length=20, blank=True)
    experience = models.CharField(max_length=20, blank=True)
    mediums = models.CharField(max_length=255, blank=True)
    

    def __str__(self):
        return f"{self.user.email} - {self.style}"

class Portfolio(models.Model):
    artist = models.ForeignKey(ArtistProfile, on_delete=models.CASCADE, related_name='portfolio')
    image = models.ImageField(upload_to='portfolio/')
    title = models.CharField(max_length=100, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
