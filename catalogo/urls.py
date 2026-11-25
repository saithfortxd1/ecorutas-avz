from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ExperienciaViewSet, DisponibilidadViewSet, ReservaViewSet

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'experiencias', ExperienciaViewSet)
router.register(r'disponibilidades', DisponibilidadViewSet)
router.register(r'reservas', ReservaViewSet, basename='reserva')

urlpatterns = [
    path('', include(router.urls)),
]