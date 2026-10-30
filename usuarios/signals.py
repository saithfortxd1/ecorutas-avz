from django.core.cache import cache
from django.db.models.signals import m2m_changed, post_delete, post_save, pre_delete
from django.dispatch import receiver

from .models import Recurso, Rol, RolRecurso, Usuario, UsuarioRol


def invalidate_user_menu(user_ids):
    keys = []
    for user_id in set(user_ids):
        keys.extend((f'usuario-menu:{user_id}', f'usuario-permisos:{user_id}'))
    if keys:
        cache.delete_many(keys)


def users_for_role(role_id):
    return UsuarioRol.objects.filter(rol_id=role_id).values_list('usuario_id', flat=True)


def users_for_resource(resource_id):
    return UsuarioRol.objects.filter(rol__recursos__id=resource_id).values_list('usuario_id', flat=True)


@receiver([post_save, post_delete], sender=UsuarioRol)
def usuario_rol_changed(sender, instance, **kwargs):
    invalidate_user_menu([instance.usuario_id])


@receiver([post_save, post_delete], sender=RolRecurso)
def rol_recurso_changed(sender, instance, **kwargs):
    invalidate_user_menu(users_for_role(instance.rol_id))


@receiver(post_save, sender=Recurso)
def recurso_saved(sender, instance, **kwargs):
    invalidate_user_menu(users_for_resource(instance.pk))


@receiver(pre_delete, sender=Recurso)
def recurso_before_delete(sender, instance, **kwargs):
    instance._menu_users_to_invalidate = list(users_for_resource(instance.pk))


@receiver(post_delete, sender=Recurso)
def recurso_deleted(sender, instance, **kwargs):
    invalidate_user_menu(getattr(instance, '_menu_users_to_invalidate', ()))


@receiver(post_save, sender=Rol)
def rol_saved(sender, instance, **kwargs):
    invalidate_user_menu(users_for_role(instance.pk))


@receiver(pre_delete, sender=Rol)
def rol_before_delete(sender, instance, **kwargs):
    instance._menu_users_to_invalidate = list(users_for_role(instance.pk))


@receiver(post_delete, sender=Rol)
def rol_deleted(sender, instance, **kwargs):
    invalidate_user_menu(getattr(instance, '_menu_users_to_invalidate', ()))


@receiver(m2m_changed, sender=Usuario.roles.through)
def usuario_roles_changed(sender, instance, action, reverse, pk_set, **kwargs):
    if action not in ('pre_clear', 'post_add', 'post_remove', 'post_clear'):
        return
    if action == 'pre_clear':
        if reverse:
            instance._menu_users_to_invalidate = list(users_for_role(instance.pk))
        else:
            instance._menu_users_to_invalidate = [instance.pk]
    if reverse:
        user_ids = pk_set if action in ('post_add', 'post_remove') else getattr(instance, '_menu_users_to_invalidate', ())
    else:
        user_ids = [instance.pk]
    invalidate_user_menu(user_ids or ())


@receiver(m2m_changed, sender=Recurso.roles.through)
def roles_recursos_changed(sender, instance, action, reverse, pk_set, **kwargs):
    if action not in ('pre_clear', 'post_add', 'post_remove', 'post_clear'):
        return
    if action == 'pre_clear':
        if reverse:
            instance._menu_users_to_invalidate = list(users_for_role(instance.pk))
        else:
            instance._menu_users_to_invalidate = list(users_for_resource(instance.pk))
    if reverse:
        user_ids = users_for_role(instance.pk) if action in ('post_add', 'post_remove') else getattr(instance, '_menu_users_to_invalidate', ())
    else:
        user_ids = (
            UsuarioRol.objects.filter(rol_id__in=pk_set).values_list('usuario_id', flat=True)
            if action in ('post_add', 'post_remove') and pk_set
            else getattr(instance, '_menu_users_to_invalidate', ())
        )
    invalidate_user_menu(user_ids or ())
