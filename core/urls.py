from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Page routes
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('index/', TemplateView.as_view(template_name='index.html'), name='home2'),
    path('artist/', TemplateView.as_view(template_name='artist.html'), name='artist'),
    path('artist-dashboard/', TemplateView.as_view(template_name='artist-dashboard.html'), name='artist_dashboard'),
    path('artist-profile/', TemplateView.as_view(template_name='artist-profile.html'), name='artist_profile'),
    path('booking/', TemplateView.as_view(template_name='booking.html'), name='booking'),
    path('chat/', TemplateView.as_view(template_name='chat.html'), name='chat'),
    path('contact/', TemplateView.as_view(template_name='contact.html'), name='contact'),
    path('forgot-password/', TemplateView.as_view(template_name='forgot-password.html'), name='forgot_password'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),
    path('privacy-policy/', TemplateView.as_view(template_name='privacy-policy.html'), name='privacy_policy'),
    path('terms/', TemplateView.as_view(template_name='terms.html'), name='terms'),
    path('artist-onboarding/', TemplateView.as_view(template_name='artist-onboarding.html'), name='artist_onboarding'),
    path('gallery/', TemplateView.as_view(template_name='gallery.html'), name='gallery'),

    # API routes — each has its own prefix
    path('api/users/', include('users.urls')),
    path('api/artists/', include('artists.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/messages/', include('messaging.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)