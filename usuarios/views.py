from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import Usuario
from .serializers import UsuarioRegistroSerializer, UsuarioMeSerializer


class LoginRateThrottle(AnonRateThrottle):
    """Limita los intentos de login/refresh para mitigar fuerza bruta."""
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

    @swagger_auto_schema(
        operation_summary='Registrar usuario',
        operation_description=(
            'Registro público de un nuevo usuario. Permite seleccionar el rol '
            '(`turista` o `anfitrion`). Si el rol es `anfitrion` el '
            '`documento_identidad` es obligatorio.'
        ),
        request_body=UsuarioRegistroSerializer,
        responses={
            201: openapi.Response(
                description='Usuario registrado correctamente',
                schema=UsuarioRegistroSerializer,
            ),
            400: 'Error de validación',
        },
        security=[],
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'mensaje': 'Usuario registrado correctamente.',
            'usuario': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': user.rol,
            }
        }, status=status.HTTP_201_CREATED)


class UsuarioMeView(generics.RetrieveAPIView):
    """
    Devuelve la información del usuario autenticado actual para que el
    frontend reconozca inmediatamente su rol tras iniciar sesión.
    """
    serializer_class = UsuarioMeSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    @swagger_auto_schema(
        operation_summary='Perfil del usuario autenticado (Me)',
        operation_description=(
            'Retorna id, username, email y rol del usuario autenticado. '
            'Si el rol es `anfitrion`, incluye `perfil_anfitrion` con '
            '`documento_identidad` y `estado_verificacion`.'
        ),
        responses={200: UsuarioMeSerializer},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
