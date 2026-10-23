from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoriaViewSet, ExperienciaViewSet, DisponibilidadViewSet

router = DefaultRouter()
router.register(r'categorias', CategoriaViewSet)
router.register(r'experiencias', ExperienciaViewSet)
router.register(r'disponibilidades', DisponibilidadViewSet)

urlpatterns = [
    path('', include(router.urls)),
]