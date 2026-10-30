from django.db import migrations


def create_default_rbac_resources(apps, schema_editor):
    Rol = apps.get_model('usuarios', 'Rol')
    Recurso = apps.get_model('usuarios', 'Recurso')
    database = schema_editor.connection.alias
    roles = {
        name: Rol.objects.using(database).get_or_create(nombre=name)[0]
        for name in ('Administrador', 'Anfitrión', 'Turista')
    }
    catalogo, _ = Recurso.objects.using(database).update_or_create(
        nombre='Catálogo',
        defaults={
            'path': '/experiencias',
            'icono': 'map',
            'permisos': [
                {'path': '/api/catalogo/experiencias/', 'methods': ['get', 'post', 'put', 'patch', 'delete']},
                {'path': '/api/catalogo/categorias/', 'methods': ['get', 'post', 'put', 'patch', 'delete']},
                {'path': '/api/catalogo/disponibilidades/', 'methods': ['get', 'post', 'put', 'patch', 'delete']},
            ],
        },
    )
    usuarios, _ = Recurso.objects.using(database).update_or_create(
        nombre='Gestión de Usuarios',
        defaults={'path': '/admin/usuarios', 'icono': 'users', 'permisos': [{'path': '/api/usuarios/admin/', 'methods': ['get', 'post', 'put', 'patch', 'delete']}]},
    )
    roles_recurso, _ = Recurso.objects.using(database).update_or_create(
        nombre='Gestión de Roles',
        defaults={'path': '/admin/roles', 'icono': 'shield', 'permisos': [{'path': '/api/usuarios/roles/', 'methods': ['get', 'post', 'put', 'patch', 'delete']}]},
    )
    recursos, _ = Recurso.objects.using(database).update_or_create(
        nombre='Gestión de Recursos',
        defaults={'path': '/admin/recursos', 'icono': 'grid', 'permisos': [{'path': '/api/usuarios/recursos/', 'methods': ['get', 'post', 'put', 'patch', 'delete']}]},
    )
    roles['Administrador'].recursos.add(catalogo, usuarios, roles_recurso, recursos)
    roles['Anfitrión'].recursos.add(catalogo)
    roles['Turista'].recursos.add(catalogo)


class Migration(migrations.Migration):
    dependencies = [('usuarios', '0004_remove_usuario_rol')]

    operations = [migrations.RunPython(create_default_rbac_resources, migrations.RunPython.noop)]
