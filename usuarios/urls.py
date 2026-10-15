from django.urls import path
from .views import UsuarioRegistroView

urlpatterns = [
    path('registro/', UsuarioRegistroView.as_view(), name='usuario-registro'),
]