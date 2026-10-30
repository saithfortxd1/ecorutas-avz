from django.core.cache import cache
from django.db.models.signals import m2m_changed, post_delete, post_save
from django.dispatch import receiver
from .models import Recurso, Rol, RolRecurso, Usuario, UsuarioRol


def invalidate_user_menu(user_ids):
    for user_id in user_ids:
        cache.delete(f'usuario-menu:{user_id}')


@receiver([post_save, post_delete], sender=UsuarioRol)
def usuario_rol_changed(sender, instance, **kwargs):
    invalidate_user_menu([instance.usuario_id])


@receiver([post_save, post_delete], sender=RolRecurso)
def rol_recurso_changed(sender, instance, **kwargs):
    invalidate_user_menu(UsuarioRol.objects.filter(rol_id=instance.rol_id).values_list('usuario_id', flat=True))


@receiver([post_save, post_delete], sender=Recurso)
def recurso_changed(sender, instance, **kwargs):
    invalidate_user_menu(UsuarioRol.objects.filter(rol__recursos=instance).values_list('usuario_id', flat=True))


@receiver([post_save, post_delete], sender=Rol)
def rol_changed(sender, instance, **kwargs):
    invalidate_user_menu(UsuarioRol.objects.filter(rol=instance).values_list('usuario_id', flat=True))


@receiver(m2m_changed, sender=Usuario.roles.through)
def usuario_roles_changed(sender, instance, action, pk_set, **kwargs):
    if action in ('post_add', 'post_remove', 'post_clear'):
        invalidate_user_menu([instance.pk])


@receiver(m2m_changed, sender=Recurso.roles.through)
def roles_recursos_changed(sender, instance, action, pk_set, **kwargs):
    if action not in ('post_add', 'post_remove', 'post_clear'):
        return
    if isinstance(instance, Rol):
        user_ids = UsuarioRol.objects.filter(rol=instance).values_list('usuario_id', flat=True)
    else:
        user_ids = UsuarioRol.objects.filter(rol__recursos=instance).values_list('usuario_id', flat=True)
    invalidate_user_menu(user_ids)
