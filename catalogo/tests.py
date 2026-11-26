from datetime import date, time
from decimal import Decimal

from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from catalogo.models import Categoria, Disponibilidad, Experiencia, Reserva
from usuarios.models import Recurso, Rol, Usuario

CATALOGO_PERMISOS = [
    {'path': '/api/catalogo/experiencias/', 'methods': ['get']},
    {'path': '/api/catalogo/categorias/', 'methods': ['get']},
    {'path': '/api/catalogo/disponibilidades/', 'methods': ['get']},
]


@override_settings(ALLOWED_HOSTS=['testserver', 'localhost', '127.0.0.1'])
class FlujoClienteReservasTest(APITestCase):
    """Cubre el flujo del cliente/turista: ver planes, detalle y reservar."""

    def setUp(self):
        cache.clear()

        # Rol Turista con acceso de lectura al catalogo.
        self.rol_turista, _ = Rol.objects.get_or_create(nombre='Turista')
        self.recurso_catalogo, _ = Recurso.objects.get_or_create(
            nombre='Test Catalogo Cliente',
            defaults={'path': '/experiencias', 'icono': 'map', 'permisos': CATALOGO_PERMISOS},
        )
        self.rol_turista.recursos.set([self.recurso_catalogo])

        self.anfitrion = Usuario.objects.create_user(
            username='host_flujo', email='host@test.com', password='Clave12345'
        )
        self.cliente = Usuario.objects.create_user(
            username='cliente_flujo', email='cliente@test.com', password='Clave12345',
            first_name='Lina', last_name='Turista', telefono='3001234567',
        )
        self.cliente.roles.set([self.rol_turista])
        self.otro_cliente = Usuario.objects.create_user(
            username='otro_cliente', email='otro@test.com', password='Clave12345'
        )
        self.otro_cliente.roles.set([self.rol_turista])

        self.categoria = Categoria.objects.create(nombre='Test Senderismo')
        self.experiencia = Experiencia.objects.create(
            anfitrion=self.anfitrion,
            categoria=self.categoria,
            titulo='Ruta de prueba',
            descripcion='Una experiencia de prueba para el flujo del cliente.',
            precio_unitario=Decimal('50000.00'),
            latitud=Decimal('11.544444'),
            longitud=Decimal('-72.907222'),
            estado='Activa',
            incluye='Guía local\nParadas fotográficas',
            recomendaciones='Lleva agua y calzado cómodo.',
        )
        self.disponibilidad = Disponibilidad.objects.create(
            experiencia=self.experiencia,
            fecha=date(2026, 12, 20),
            hora_inicio=time(8, 0),
            hora_fin=time(12, 0),
            cupos_totales=10,
        )

    def _reserva_payload(self, **overrides):
        payload = {
            'experiencia': self.experiencia.id,
            'disponibilidad': self.disponibilidad.id,
            'fecha': '2026-12-20',
            'personas': 2,
            'telefono_contacto': '3019876543',
            'notas': 'Llegada temprano',
        }
        payload.update(overrides)
        return payload

    def test_turista_lista_experiencias(self):
        self.client.force_authenticate(user=self.cliente)
        response = self.client.get('/api/catalogo/experiencias/')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()['count'] if isinstance(response.json(), dict) else len(response.json()), 1)

    def test_turista_ve_detalle_de_plan(self):
        self.client.force_authenticate(user=self.cliente)
        response = self.client.get(f'/api/catalogo/experiencias/{self.experiencia.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['titulo'], 'Ruta de prueba')
        self.assertEqual(response.json()['incluye'], 'Guía local\nParadas fotográficas')
        self.assertEqual(response.json()['recomendaciones'], 'Lleva agua y calzado cómodo.')

    def test_turista_crea_reserva_y_calcula_total(self):
        self.client.force_authenticate(user=self.cliente)
        response = self.client.post('/api/catalogo/reservas/', self._reserva_payload(), format='json')
        self.assertEqual(response.status_code, 201, msg=response.content)
        data = response.json()
        self.assertEqual(data['cliente'], self.cliente.id)
        self.assertEqual(data['estado'], 'pendiente')
        self.assertEqual(Decimal(data['precio_total']), Decimal('100000.00'))
        self.assertEqual(data['experiencia_titulo'], self.experiencia.titulo)
        self.assertEqual(data['cliente_nombre'], 'Lina Turista')
        self.assertEqual(data['cliente_email'], self.cliente.email)
        self.assertEqual(data['cliente_telefono'], self.cliente.telefono)
        self.assertEqual(data['telefono_contacto'], '3019876543')
        self.assertEqual(Reserva.objects.filter(cliente=self.cliente).count(), 1)

    def test_reserva_ignora_cliente_enviado(self):
        self.client.force_authenticate(user=self.cliente)
        response = self.client.post(
            '/api/catalogo/reservas/',
            self._reserva_payload(cliente=self.otro_cliente.id),
            format='json',
        )
        self.assertEqual(response.status_code, 201, msg=response.content)
        self.assertEqual(Reserva.objects.get(id=response.json()['id']).cliente_id, self.cliente.id)

    def test_reserva_personas_invalidas_devuelve_400(self):
        self.client.force_authenticate(user=self.cliente)
        response = self.client.post('/api/catalogo/reservas/', self._reserva_payload(personas=0), format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('personas', response.json())

    def test_reserva_excede_cupos_devuelve_400(self):
        self.client.force_authenticate(user=self.cliente)
        response = self.client.post('/api/catalogo/reservas/', self._reserva_payload(personas=99), format='json')
        self.assertEqual(response.status_code, 400)

    def test_disponibilidad_muestra_cupos_restantes_y_los_libera_al_cancelar(self):
        self.client.force_authenticate(user=self.cliente)
        creada = self.client.post('/api/catalogo/reservas/', self._reserva_payload(), format='json')
        self.assertEqual(creada.status_code, 201, msg=creada.content)

        disponibilidad = self.client.get(
            '/api/catalogo/disponibilidades/',
            {'experiencia': self.experiencia.id},
        )
        self.assertEqual(disponibilidad.status_code, 200)
        self.assertEqual(disponibilidad.json()[0]['cupos_disponibles'], 8)

        cancelada = self.client.patch(
            f"/api/catalogo/reservas/{creada.json()['id']}/",
            {'estado': 'cancelada'},
            format='json',
        )
        self.assertEqual(cancelada.status_code, 200, msg=cancelada.content)
        disponibilidad = self.client.get(
            '/api/catalogo/disponibilidades/',
            {'experiencia': self.experiencia.id},
        )
        self.assertEqual(disponibilidad.json()[0]['cupos_disponibles'], 10)

    def test_turista_solo_ve_sus_reservas(self):
        mis = Reserva.objects.create(
            experiencia=self.experiencia, cliente=self.cliente, disponibilidad=self.disponibilidad,
            fecha=date(2026, 12, 20), personas=1, precio_total=Decimal('50000.00'),
        )
        otra = Reserva.objects.create(
            experiencia=self.experiencia, cliente=self.otro_cliente, disponibilidad=self.disponibilidad,
            fecha=date(2026, 12, 21), personas=1, precio_total=Decimal('50000.00'),
        )
        self.client.force_authenticate(user=self.cliente)
        response = self.client.get('/api/catalogo/reservas/')
        self.assertEqual(response.status_code, 200)
        ids = [item['id'] for item in response.json()]
        self.assertIn(mis.id, ids)
        self.assertNotIn(otra.id, ids)

    def test_cliente_puede_cancelar_su_reserva(self):
        reserva = Reserva.objects.create(
            experiencia=self.experiencia, cliente=self.cliente, disponibilidad=self.disponibilidad,
            fecha=date(2026, 12, 20), personas=1, precio_total=Decimal('50000.00'),
        )
        self.client.force_authenticate(user=self.cliente)
        response = self.client.delete(f'/api/catalogo/reservas/{reserva.id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Reserva.objects.filter(id=reserva.id).exists())

    def test_cliente_no_puede_ver_reserva_ajena(self):
        ajena = Reserva.objects.create(
            experiencia=self.experiencia, cliente=self.otro_cliente, disponibilidad=self.disponibilidad,
            fecha=date(2026, 12, 20), personas=1, precio_total=Decimal('50000.00'),
        )
        self.client.force_authenticate(user=self.cliente)
        response = self.client.get(f'/api/catalogo/reservas/{ajena.id}/')
        self.assertEqual(response.status_code, 404)

    def test_anfitrion_y_administrador_gestionan_reserva_y_turista_ve_estado(self):
        rol_anfitrion, _ = Rol.objects.get_or_create(nombre='Anfitrión')
        rol_admin, _ = Rol.objects.get_or_create(nombre='Administrador')
        self.anfitrion.roles.add(rol_anfitrion)
        self.disponibilidad.cupos_totales = 2
        self.disponibilidad.save(update_fields=['cupos_totales'])
        administrador = Usuario.objects.create_user(
            username='admin_reservas', email='admin@test.com', password='Clave12345',
        )
        administrador.roles.add(rol_admin)
        reserva = Reserva.objects.create(
            experiencia=self.experiencia,
            cliente=self.cliente,
            disponibilidad=self.disponibilidad,
            fecha=date(2026, 12, 20),
            personas=2,
            precio_total=Decimal('100000.00'),
            notas='Llegada temprano',
        )

        self.client.force_authenticate(user=self.anfitrion)
        recibidas = self.client.get('/api/catalogo/reservas/')
        self.assertEqual(recibidas.status_code, 200)
        self.assertEqual([item['id'] for item in recibidas.json()], [reserva.id])
        self.assertEqual(recibidas.json()[0]['cliente_email'], self.cliente.email)
        confirmada = self.client.patch(
            f'/api/catalogo/reservas/{reserva.id}/',
            {'estado': 'confirmada', 'notas': 'Encuentro confirmado a las 8:00'},
            format='json',
        )
        self.assertEqual(confirmada.status_code, 200, msg=confirmada.content)
        self.assertEqual(confirmada.json()['estado'], 'confirmada')

        self.client.force_authenticate(user=administrador)
        visibles_admin = self.client.get('/api/catalogo/reservas/')
        self.assertEqual(visibles_admin.status_code, 200)
        self.assertEqual([item['id'] for item in visibles_admin.json()], [reserva.id])
        completada = self.client.patch(
            f'/api/catalogo/reservas/{reserva.id}/',
            {'estado': 'completada'},
            format='json',
        )
        self.assertEqual(completada.status_code, 200, msg=completada.content)
        self.assertEqual(completada.json()['estado'], 'completada')

        self.client.force_authenticate(user=self.cliente)
        propia = self.client.get('/api/catalogo/reservas/')
        self.assertEqual(propia.status_code, 200)
        self.assertEqual(propia.json()[0]['estado'], 'completada')
        self.assertEqual(propia.json()[0]['notas'], 'Encuentro confirmado a las 8:00')

    def test_turista_solo_puede_cancelar_su_reserva_y_no_accede_a_admin(self):
        reserva = Reserva.objects.create(
            experiencia=self.experiencia,
            cliente=self.cliente,
            disponibilidad=self.disponibilidad,
            fecha=date(2026, 12, 20),
            personas=1,
            precio_total=Decimal('50000.00'),
        )
        self.client.force_authenticate(user=self.cliente)
        cancelada = self.client.patch(
            f'/api/catalogo/reservas/{reserva.id}/',
            {'estado': 'cancelada'},
            format='json',
        )
        self.assertEqual(cancelada.status_code, 200, msg=cancelada.content)
        self.assertEqual(cancelada.json()['estado'], 'cancelada')

        admin_response = self.client.get('/api/usuarios/admin/')
        self.assertEqual(admin_response.status_code, 403)
        self.assertIn('detail', admin_response.json())

    def test_turista_no_puede_editar_notas_de_reserva(self):
        reserva = Reserva.objects.create(
            experiencia=self.experiencia,
            cliente=self.cliente,
            disponibilidad=self.disponibilidad,
            fecha=date(2026, 12, 20),
            personas=1,
            precio_total=Decimal('50000.00'),
        )
        self.client.force_authenticate(user=self.cliente)
        response = self.client.patch(
            f'/api/catalogo/reservas/{reserva.id}/',
            {'notas': 'cambio no autorizado'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)
        reserva.refresh_from_db()
        self.assertEqual(reserva.notas, '')

    def test_anfitrion_no_ve_reservas_de_experiencias_ajenas(self):
        otro_anfitrion = Usuario.objects.create_user(
            username='otro_host_flujo', email='otro-host@test.com', password='Clave12345',
        )
        otra_experiencia = Experiencia.objects.create(
            anfitrion=otro_anfitrion,
            categoria=self.categoria,
            titulo='Otra ruta de prueba',
            descripcion='Plan de otro anfitrion.',
            precio_unitario=Decimal('30000.00'),
            latitud=Decimal('11.500000'),
            longitud=Decimal('-72.900000'),
        )
        reserva_ajena = Reserva.objects.create(
            experiencia=otra_experiencia,
            cliente=self.cliente,
            fecha=date(2026, 12, 20),
            personas=1,
            precio_total=Decimal('30000.00'),
        )
        rol_anfitrion, _ = Rol.objects.get_or_create(nombre='Anfitrión')
        self.anfitrion.roles.add(rol_anfitrion)
        self.client.force_authenticate(user=self.anfitrion)
        self.assertEqual(self.client.get('/api/catalogo/reservas/').json(), [])
        self.assertEqual(
            self.client.patch(
                f'/api/catalogo/reservas/{reserva_ajena.id}/',
                {'estado': 'confirmada'},
                format='json',
            ).status_code,
            404,
        )