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
            username='cliente_flujo', email='cliente@test.com', password='Clave12345'
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

    def test_turista_crea_reserva_y_calcula_total(self):
        self.client.force_authenticate(user=self.cliente)
        response = self.client.post('/api/catalogo/reservas/', self._reserva_payload(), format='json')
        self.assertEqual(response.status_code, 201, msg=response.content)
        data = response.json()
        self.assertEqual(data['cliente'], self.cliente.id)
        self.assertEqual(data['estado'], 'pendiente')
        self.assertEqual(Decimal(data['precio_total']), Decimal('100000.00'))
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