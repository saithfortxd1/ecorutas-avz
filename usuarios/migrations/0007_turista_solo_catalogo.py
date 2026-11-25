from django.db import migrations

ADMIN_PATH_PREFIX = '/admin/'
CATALOGO_PATH = '/experiencias'


def turista_solo_catalogo(apps, schema_editor):
    """El rol Turista es cliente final: solo accede al catalogo, no a la administracion."""
    Rol = apps.get_model('usuarios', 'Rol')
    Recurso = apps.get_model('usuarios', 'Recurso')
    database = schema_editor.connection.alias

    turista = Rol.objects.using(database).filter(nombre='Turista').first()
    if turista is None:
        return

    # Quita cualquier recurso administrativo (rutas /admin/...) asignado al Turista.
    admin_resources = Recurso.objects.using(database).filter(path__startswith=ADMIN_PATH_PREFIX)
    if admin_resources.exists():
        turista.recursos.remove(*admin_resources)

    # Garantiza el acceso al catalogo de planes.
    catalogo = Recurso.objects.using(database).filter(path=CATALOGO_PATH).first()
    if catalogo is not None:
        turista.recursos.add(catalogo)


def reverse_noop(apps, schema_editor):
    # No se reintroducen recursos administrativos al rol Turista de forma automatica.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0006_add_recurso_gestion_recursos_a_turista'),
    ]

    operations = [
        migrations.RunPython(turista_solo_catalogo, reverse_noop),
    ]
