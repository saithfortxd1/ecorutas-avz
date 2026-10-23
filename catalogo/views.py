from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from usuarios.permissions import IsAnfitrion, IsOwnerOrReadOnly, IsAdminOrReadOnly

from .models import Categoria, Experiencia, Disponibilidad
from .serializers import (
    CategoriaSerializer,
    ExperienciaSerializer,
    DisponibilidadSerializer,
)


class CategoriaViewSet(viewsets.ModelViewSet):
    """
    Catálogo de categorías.
    - Lectura: pública.
    - Escritura: solo administradores (staff).
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAdminOrReadOnly]

    @swagger_auto_schema(
        operation_summary='Listar categorías',
        operation_description='Lectura pública del catálogo de categorías.',
        responses={200: CategoriaSerializer(many=True)},
        security=[],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Crear categoría',
        operation_description='Solo administradores (staff).',
        request_body=CategoriaSerializer,
        responses={201: CategoriaSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)


class ExperienciaViewSet(viewsets.ModelViewSet):
    """
    Catálogo de experiencias.
    - Lectura (list/retrieve): pública.
    - Creación: solo usuarios con rol 'anfitrion'.
    - Edición/Eliminación: solo el anfitrión creador del registro.
    """
    queryset = Experiencia.objects.select_related(
        'anfitrion', 'categoria'
    ).prefetch_related('traducciones', 'fotos')
    serializer_class = ExperienciaSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['titulo', 'descripcion', 'categoria__nombre']
    ordering_fields = ['precio_unitario', 'created_at']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            permission_classes = [AllowAny]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated, IsAnfitrion]
        else:  # update, partial_update, destroy
            permission_classes = [IsAuthenticated, IsAnfitrion, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(anfitrion=self.request.user)

    @swagger_auto_schema(
        operation_summary='Listar experiencias',
        operation_description=(
            'Lectura pública. Soporta búsqueda con `?search=` (título, '
            'descripción, categoría) y ordenamiento con `?ordering=`.'
        ),
        responses={200: ExperienciaSerializer(many=True)},
        security=[],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Ver experiencia',
        operation_description='Lectura pública de una experiencia por id.',
        responses={200: ExperienciaSerializer},
        security=[],
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Crear experiencia',
        operation_description='Requiere rol `anfitrion`. El anfitrión se asigna automáticamente.',
        request_body=ExperienciaSerializer,
        responses={201: ExperienciaSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Editar experiencia',
        operation_description='Solo el anfitrión creador puede editar su experiencia.',
        request_body=ExperienciaSerializer,
        responses={200: ExperienciaSerializer},
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Eliminar experiencia',
        operation_description='Solo el anfitrión creador puede eliminar su experiencia.',
        responses={204: 'Sin contenido'},
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)


class DisponibilidadViewSet(viewsets.ModelViewSet):
    """
    Disponibilidades de las experiencias.
    - Lectura: pública.
    - Creación/Edición/Eliminación: solo el anfitrión propietario de la
      experiencia asociada.
    """
    queryset = Disponibilidad.objects.select_related(
        'experiencia', 'experiencia__anfitrion'
    )
    serializer_class = DisponibilidadSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            permission_classes = [AllowAny]
        elif self.action == 'create':
            permission_classes = [IsAuthenticated, IsAnfitrion]
        else:  # update, partial_update, destroy
            permission_classes = [IsAuthenticated, IsAnfitrion, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        experiencia = serializer.validated_data.get('experiencia')
        if experiencia is not None and experiencia.anfitrion_id != self.request.user.id:
            raise PermissionDenied(
                'Solo puedes crear disponibilidades para tus propias experiencias.'
            )
        serializer.save()

    def perform_update(self, serializer):
        # Evita que un anfitrión reasigne la disponibilidad a la experiencia
        # de otro anfitrión (bypass del control de propiedad).
        experiencia = serializer.validated_data.get('experiencia')
        if experiencia is not None and experiencia.anfitrion_id != self.request.user.id:
            raise PermissionDenied(
                'Solo puedes asociar disponibilidades a tus propias experiencias.'
            )
        serializer.save()

    @swagger_auto_schema(
        operation_summary='Listar disponibilidades',
        operation_description='Lectura pública de disponibilidades.',
        responses={200: DisponibilidadSerializer(many=True)},
        security=[],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Crear disponibilidad',
        operation_description=(
            'Requiere rol `anfitrion` y que la experiencia pertenezca al usuario.'
        ),
        request_body=DisponibilidadSerializer,
        responses={201: DisponibilidadSerializer},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Editar disponibilidad',
        operation_description='Solo el anfitrión propietario de la experiencia.',
        request_body=DisponibilidadSerializer,
        responses={200: DisponibilidadSerializer},
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_summary='Eliminar disponibilidad',
        operation_description='Solo el anfitrión propietario de la experiencia.',
        responses={204: 'Sin contenido'},
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
