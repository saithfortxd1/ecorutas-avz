from rest_framework import permissions
from .models import Recurso


class HasResourcePermission(permissions.BasePermission):
    """Aplica los permisos declarados en recursos para cada endpoint API."""
    message = 'Tu rol no tiene acceso al recurso solicitado.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        path = request.path
        method = request.method.lower()
        permission_lists = Recurso.objects.filter(roles__usuarios=user).values_list('permisos', flat=True).distinct()
        for permission_list in permission_lists:
            for rule in permission_list or []:
                if isinstance(rule, str):
                    rule = {'path': rule, 'methods': ['get', 'post', 'put', 'patch', 'delete']}
                rule_path = rule.get('path', '')
                methods = [m.lower() for m in rule.get('methods', ['get', 'post', 'put', 'patch', 'delete'])]
                if method in methods and (path == rule_path or path.startswith(rule_path.rstrip('/') + '/')):
                    return True
        # Los recursos son opt-in solo para endpoints que declaran esta
        # política. Los endpoints públicos y heredados conservan su política propia.
        return not getattr(view, 'requires_resource_permission', False)


class IsAnfitrion(permissions.BasePermission):
    """
    Permite anfitriones relacionales aprobados/en revisión y administradores
    que tengan el recurso correspondiente asignado.

    Un anfitrión 'rechazado' pierde los permisos de escritura; 'pendiente' y
    'aprobado' conservan acceso para no romper el flujo de alta del anfitrión.
    """
    message = 'Solo los usuarios con rol anfitrión verificado pueden realizar esta acción.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role_names = set(
            user.roles.filter(nombre__in=('Administrador', 'Anfitrión')).values_list('nombre', flat=True)
        )
        if 'Administrador' in role_names:
            return True
        return 'Anfitrión' in role_names and user.estado_verificacion != 'rechazado'


class IsTurista(permissions.BasePermission):
    """
    Permite el acceso únicamente a usuarios autenticados con rol 'turista'.
    """
    message = 'Solo los usuarios con rol turista pueden realizar esta acción.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.roles.filter(nombre='Turista').exists())


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Solo el anfitrión propietario puede editar/eliminar; el rol Administrador
    puede gestionar cualquier registro que su recurso autorice.

    Soporta objetos con atributo directo `anfitrion` (Experiencia) y objetos
    anidados cuya propiedad se hereda de la experiencia relacionada
    (Disponibilidad -> experiencia.anfitrion).
    """
    message = 'Solo el anfitrión propietario del registro puede modificarlo o eliminarlo.'

    def has_object_permission(self, request, view, obj):
        if request.user.roles.filter(nombre='Administrador').exists():
            return True
        if request.method in permissions.SAFE_METHODS:
            return True

        propietario = self._get_propietario(obj)
        return bool(propietario) and propietario == request.user

    @staticmethod
    def _get_propietario(obj):
        propietario = getattr(obj, 'anfitrion', None)
        if propietario is not None:
            return propietario

        experiencia = getattr(obj, 'experiencia', None)
        if experiencia is not None:
            return getattr(experiencia, 'anfitrion', None)

        return None


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Escritura solo para el rol Administrador asignado mediante la relación M:N.
    """
    message = 'Solo los administradores pueden modificar las categorías.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.roles.filter(nombre='Administrador').exists())
