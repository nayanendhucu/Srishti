from django.urls import path
from . import views

urlpatterns = [
    path('', views.artist_list),
    path('portfolio/', views.portfolio_list),
    path('<int:pk>/', views.artist_detail),
    path('profile/update/', views.update_artist_profile),
    path('profile/onboarding/', views.complete_artist_profile),
]
