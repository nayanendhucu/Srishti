from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_booking),
    path('mine/', views.my_bookings),
    path('<int:pk>/status/', views.update_booking_status),
    path('<int:pk>/payment/', views.upload_payment_screenshot),
]
