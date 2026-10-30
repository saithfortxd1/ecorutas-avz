from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UsuarioRegistroView, UsuarioMeView, MenuUsuarioView, UsuarioAdminViewSet, RolViewSet, RecursoViewSet

router = DefaultRouter()
router.register('admin', UsuarioAdminViewSet, basename='usuario-admin')
router.register('roles', RolViewSet, basename='rol')
router.register('recursos', RecursoViewSet, basename='recurso')

urlpatterns = [
    path('registro/', UsuarioRegistroView.as_view(), name='usuario-registro'),
    path('me/', UsuarioMeView.as_view(), name='usuario-me'),
    path('menu/', MenuUsuarioView.as_view(), name='usuario-menu'),
    path('', include(router.urls)),
]
