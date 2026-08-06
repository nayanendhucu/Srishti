from django.urls import path
from . import views

urlpatterns = [
    path('', views.inbox),
    path('<int:user_id>/', views.conversation),
]
