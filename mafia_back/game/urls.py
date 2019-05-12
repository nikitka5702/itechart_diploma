from django.urls import path

from . import views

urlpatterns = [
    path('activation/', views.Activation.as_view())
]
