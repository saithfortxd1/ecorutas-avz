from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from usuarios.models import Recurso, Rol, Usuario

ALL_METHODS = ['get', 'post', 'put', 'patch', 'delete']


def crear_recurso(nombre, path, api_path, methods=ALL_METHODS):
    """Crea un recurso de prueba con una regla de API unica."""
    return Recurso.objects.create(
        nombre=nombre,
        path=path,
        icono='grid',
        permisos=[{'path': api_path, 'methods': list(methods)}],
    )


@override_settings(ALLOWED_HOSTS=['testserver', 'localhost', '127.0.0.1'])
class RBACControlAccesoTest(APITestCase):
    """El rol Turista es cliente final: catalogo si, administracion no."""

    def setUp(self):
        # La cache de permisos es por usuario; se limpia para aislar pruebas.
        cache.clear()

        # Las migraciones ya crean los roles base; se reutilizan.
        self.rol_turista, _ = Rol.objects.get_or_create(nombre='Turista')
        self.rol_admin, _ = Rol.objects.get_or_create(nombre='Administrador')

        # Recursos de prueba (nombres unicos para no chocar con los de migracion).
        rec_catalogo = crear_recurso('Test Catalogo', '/experiencias', '/api/catalogo/experiencias/')
        rec_recursos = crear_recurso('Test Gestion de Recursos', '/admin/recursos', '/api/usuarios/recursos/')
        rec_usuarios = crear_recurso('Test Gestion de Usuarios', '/admin/usuarios', '/api/usuarios/admin/')
        rec_roles = crear_recurso('Test Gestion de Roles', '/admin/roles', '/api/usuarios/roles/')

        # Turista = cliente final: solo catalogo. Administrador: todo.
        self.rol_turista.recursos.set([rec_catalogo])
        self.rol_admin.recursos.set([rec_catalogo, rec_recursos, rec_usuarios, rec_roles])

        self.turista = Usuario.objects.create_user(
            username='turista_test', email='turista@test.com', password='Clave12345'
        )
        self.turista.roles.set([self.rol_turista])

        self.admin = Usuario.objects.create_user(
            username='admin_test', email='admin@test.com', password='Clave12345', is_staff=True
        )
        self.admin.roles.set([self.rol_admin])

        self.sin_rol = Usuario.objects.create_user(
            username='sin_rol_test', email='sinrol@test.com', password='Clave12345'
        )

    def test_turista_puede_listar_catalogo(self):
        self.client.force_authenticate(user=self.turista)
        self.assertEqual(self.client.get('/api/catalogo/experiencias/').status_code, 200)

    def test_turista_no_puede_listar_recursos(self):
        self.client.force_authenticate(user=self.turista)
        self.assertEqual(self.client.get('/api/usuarios/recursos/').status_code, 403)

    def test_turista_no_puede_listar_usuarios_admin(self):
        self.client.force_authenticate(user=self.turista)
        self.assertEqual(self.client.get('/api/usuarios/admin/').status_code, 403)

    def test_turista_no_puede_listar_roles(self):
        self.client.force_authenticate(user=self.turista)
        self.assertEqual(self.client.get('/api/usuarios/roles/').status_code, 403)

    def test_admin_puede_listar_todas_las_secciones(self):
        self.client.force_authenticate(user=self.admin)
        for url in ('/api/usuarios/admin/', '/api/usuarios/roles/', '/api/usuarios/recursos/'):
            self.assertEqual(self.client.get(url).status_code, 200, msg=url)

    def test_usuario_sin_rol_no_accede_a_recursos(self):
        self.client.force_authenticate(user=self.sin_rol)
        self.assertEqual(self.client.get('/api/usuarios/recursos/').status_code, 403)

    def test_me_no_expone_recursos_administrativos_para_turista(self):
        self.client.force_authenticate(user=self.turista)
        response = self.client.get('/api/usuarios/me/')
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data['rol'], 'turista')

        paths = {recurso['path'] for recurso in data['recursos']}
        self.assertIn('/experiencias', paths)
        self.assertFalse(any(path.startswith('/admin/') for path in paths),
                         msg=f'El Turista no debe ver rutas administrativas: {paths}')
