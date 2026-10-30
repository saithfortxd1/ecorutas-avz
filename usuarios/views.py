from django.core.cache import cache
from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from django.db.models import Prefetch, prefetch_related_objects
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import Recurso, Rol, Usuario
from .serializers import UsuarioRegistroSerializer, UsuarioMeSerializer, UsuarioAdminSerializer, RolSerializer, RecursoSerializer
from .permissions import HasResourcePermission


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [LoginRateThrottle]


class UsuarioRegistroView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioRegistroSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    @swagger_auto_schema(operation_summary='Registrar usuario', request_body=UsuarioRegistroSerializer, security=[])
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({'mensaje': 'Usuario registrado correctamente.', 'usuario': {'id': user.id, 'username': user.username, 'email': user.email, 'first_name': user.first_name, 'last_name': user.last_name, 'rol': user.rol}}, status=status.HTTP_201_CREATED)


class UsuarioMeView(generics.RetrieveAPIView):
    serializer_class = UsuarioMeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        prefetch_related_objects(
            [user],
            Prefetch('roles', queryset=Rol.objects.only('id', 'nombre')),
        )
        return user


class MenuUsuarioView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cache_key = f'usuario-menu:{request.user.pk}'
        menu = cache.get(cache_key)
        if menu is None:
            # Un único SELECT con JOINs resuelve roles + recursos para el menú.
            menu = list(
                Recurso.objects.filter(roles__usuarios__pk=request.user.pk)
                .exclude(path='')
                .values('id', 'nombre', 'path', 'icono')
                .distinct()
                .order_by('nombre')
            )
            cache.set(cache_key, menu, 60)
        return Response({'version': request.user.date_joined.timestamp(), 'items': menu})


class UsuarioAdminViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.prefetch_related(
        Prefetch('roles', queryset=Rol.objects.only('id', 'nombre')),
    )
    serializer_class = UsuarioAdminSerializer
    permission_classes = [HasResourcePermission]
    requires_resource_permission = True


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.prefetch_related(
        Prefetch('recursos', queryset=Recurso.objects.only('id', 'nombre', 'path', 'icono')),
    )
    serializer_class = RolSerializer
    permission_classes = [HasResourcePermission]
    requires_resource_permission = True


class RecursoViewSet(viewsets.ModelViewSet):
    queryset = Recurso.objects.all()
    serializer_class = RecursoSerializer
    permission_classes = [HasResourcePermission]
    requires_resource_permission = True
