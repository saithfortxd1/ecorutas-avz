from rest_framework import permissions


class IsAnfitrion(permissions.BasePermission):
    """
    Permite el acceso únicamente a usuarios autenticados con rol 'anfitrion'
    y cuya verificación no haya sido rechazada.

    Un anfitrión 'rechazado' pierde los permisos de escritura; 'pendiente' y
    'aprobado' conservan acceso para no romper el flujo de alta del anfitrión.
    """
    message = 'Solo los usuarios con rol anfitrión verificado pueden realizar esta acción.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'rol', None) == 'anfitrion'
            and getattr(user, 'estado_verificacion', None) != 'rechazado'
        )


class IsTurista(permissions.BasePermission):
    """
    Permite el acceso únicamente a usuarios autenticados con rol 'turista'.
    """
    message = 'Solo los usuarios con rol turista pueden realizar esta acción.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'rol', None) == 'turista'
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permite lectura a cualquiera, pero solo el anfitrión propietario del
    registro puede editarlo o eliminarlo.

    Soporta objetos con atributo directo `anfitrion` (Experiencia) y objetos
    anidados cuya propiedad se hereda de la experiencia relacionada
    (Disponibilidad -> experiencia.anfitrion).
    """
    message = 'Solo el anfitrión propietario del registro puede modificarlo o eliminarlo.'

    def has_object_permission(self, request, view, obj):
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
    Lectura para cualquier usuario; escritura solo para staff/administradores.
    Se usa para el catálogo de Categorías.
    """
    message = 'Solo los administradores pueden modificar las categorías.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.is_staff)
