from django.urls import path
from .views import UsuarioRegistroView, UsuarioMeView

urlpatterns = [
    path('registro/', UsuarioRegistroView.as_view(), name='usuario-registro'),
    path('me/', UsuarioMeView.as_view(), name='usuario-me'),
]
