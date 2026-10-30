from rest_framework import permissions
from django.core.cache import cache
from .models import Recurso


def _rule_allows_request(rule, path, method):
    """Compara una regla individual; ignora datos heredados malformados."""
    if isinstance(rule, str):
        rule = {'path': rule}
    if not isinstance(rule, dict):
        return False

    rule_path = rule.get('path')
    methods = rule.get('methods', ('get', 'post', 'put', 'patch', 'delete'))
    if not isinstance(rule_path, str) or not isinstance(methods, (list, tuple, set)):
        return False
    if not all(isinstance(allowed_method, str) for allowed_method in methods):
        return False

    normalized_path = rule_path.rstrip('/')
    return (
        method in {allowed_method.lower() for allowed_method in methods}
        and bool(normalized_path)
        and (path == normalized_path or path.startswith(normalized_path + '/'))
    )


class HasResourcePermission(permissions.BasePermission):
    """Aplica los permisos declarados en recursos para cada endpoint API."""
    message = 'Tu rol no tiene acceso al recurso solicitado.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        path = request.path
        method = request.method.lower()
        cache_key = f'usuario-permisos:{user.pk}'
        permission_lists = cache.get(cache_key)
        if permission_lists is None:
            permission_lists = list(
                Recurso.objects.filter(roles__usuarios__pk=user.pk)
                .values_list('permisos', flat=True)
                .distinct()
            )
            cache.set(cache_key, permission_lists, 60)
        # Las reglas proceden de listas JSON finitas y cada elemento se valida
        # individualmente; no se resuelven referencias recursivas ni ORM dentro
        # del recorrido.
        if any(
            _rule_allows_request(rule, path, method)
            for rules in permission_lists
            if isinstance(rules, list)
            for rule in rules
        ):
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
