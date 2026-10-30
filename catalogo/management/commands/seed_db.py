import random
from datetime import date, time, timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from faker import Faker

from catalogo.models import Categoria, Disponibilidad, Experiencia, FotoExperiencia
from usuarios.models import Recurso, Rol

Usuario = get_user_model()
fake = Faker('es_ES')


# Ejemplos de referencia para el catálogo. Las descripciones evitan prometer
# servicios, itinerarios o condiciones de operación que no estén configurados.
EXPERIENCIAS_COLOMBIA = [
    {
        'titulo': 'Cabo de la Vela y dunas de La Guajira',
        'categoria': 'Ecoturismo',
        'descripcion': 'Explora los paisajes costeros y desérticos de Cabo de la Vela, en La Guajira. Consulta con el anfitrión los detalles, las condiciones locales y los servicios incluidos antes de reservar.',
        'precio': '420000.00', 'latitud': '12.205300', 'longitud': '-72.176700',
        'imagen': 'https://images.unsplash.com/photo-1644849823235-7d3d55172383?w=1000&q=82',
    },
    {
        'titulo': 'Trekking a Ciudad Perdida',
        'categoria': 'Senderismo',
        'descripcion': 'Recorrido de trekking hacia Ciudad Perdida, en la Sierra Nevada de Santa Marta. La operación y los requisitos del recorrido deben confirmarse directamente con el anfitrión.',
        'precio': '1200000.00', 'latitud': '11.037000', 'longitud': '-73.923000',
        'imagen': 'https://images.unsplash.com/photo-1612442560597-393c75377041?w=1000&q=82',
    },
    {
        'titulo': 'Sendero y playas del Parque Nacional Natural Tayrona',
        'categoria': 'Senderismo',
        'descripcion': 'Explora senderos y playas del Parque Nacional Natural Tayrona, en el Magdalena. Verifica con el anfitrión la disponibilidad y las condiciones de ingreso vigentes.',
        'precio': '180000.00', 'latitud': '11.312000', 'longitud': '-74.036000',
        'imagen': 'https://images.unsplash.com/photo-1635079552384-dd8adecd8a7c?w=1000&q=82',
    },
    {
        'titulo': 'Ruta del Café y Valle del Cocora',
        'categoria': 'Senderismo',
        'descripcion': 'Conoce los paisajes del Valle del Cocora, en Salento, Quindío, y el entorno cafetero de la región. Confirma con el anfitrión el alcance y los servicios de la experiencia.',
        'precio': '150000.00', 'latitud': '4.637000', 'longitud': '-75.570000',
        'imagen': 'https://images.unsplash.com/photo-1737914692165-b0428cca0104?w=1000&q=82',
    },
    {
        'titulo': 'Avistamiento de ballenas en Bahía Solano',
        'categoria': 'Avistamiento de fauna',
        'descripcion': 'Experiencia de observación de fauna marina en Bahía Solano, Chocó. El avistamiento depende de la temporada y las condiciones naturales; confirma fechas y operación con el anfitrión.',
        'precio': '650000.00', 'latitud': '6.227000', 'longitud': '-77.407000',
        'imagen': 'https://commons.wikimedia.org/wiki/Special:FilePath/Humpback_whale_breaching_off_the_coast_of_Choco,_Colombia.jpg?width=1000',
    },
    {
        'titulo': 'Caño Cristales y Serranía de la Macarena',
        'categoria': 'Ecoturismo',
        'descripcion': 'Explora el entorno natural de Caño Cristales y la Serranía de la Macarena, Meta. Consulta temporadas, permisos y condiciones de visita con el anfitrión.',
        'precio': '1000000.00', 'latitud': '2.206000', 'longitud': '-73.794000',
        'imagen': 'https://commons.wikimedia.org/wiki/Special:FilePath/CA%C3%91O_CRISTALES_EL_R%C3%8DO_DE_LOS_CINCO_COLORES.jpg?width=1000',
    },
    {
        'titulo': 'Kayak en el Santuario de Fauna y Flora Los Flamencos',
        'categoria': 'Kayak',
        'descripcion': 'Recorrido en kayak en el entorno del Santuario de Fauna y Flora Los Flamencos, La Guajira. Confirma con el anfitrión las condiciones de navegación, disponibilidad y servicios incluidos.',
        'precio': '120000.00', 'latitud': '11.413000', 'longitud': '-72.454000',
        'imagen': 'https://commons.wikimedia.org/wiki/Special:FilePath/Flamencos_en_La_Guajira.jpg?width=1000',
    },
]


class Command(BaseCommand):
    help = 'Poblar EcoRutas con experiencias colombianas y datos opcionales de prueba.'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Permitir ejecución con DEBUG=False.')
        parser.add_argument('--clean', action='store_true', help='Eliminar todos los datos de prueba antes de poblar (incluye usuarios no superusuario).')
        parser.add_argument('--reemplazar-experiencias', action='store_true', help='Reemplazar únicamente las experiencias y sus fotos, traducciones y disponibilidades. Conserva usuarios, roles y categorías.')
        parser.add_argument('--categorias', type=int, default=10, help='Número de categorías generales opcionales a crear.')
        parser.add_argument('--usuarios', type=int, default=0, help='Número de usuarios de prueba opcionales a crear (por defecto: ninguno).')
        parser.add_argument('--experiencias', type=int, default=7, help='Número de experiencias colombianas (máximo 7).')
        parser.add_argument('--disponibilidades', type=int, default=0, help='Número de disponibilidades de prueba opcionales a crear (por defecto: ninguna).')

    def handle(self, *args, **options):
        if not settings.DEBUG and not options['force']:
            raise CommandError('seed_db está deshabilitado cuando DEBUG=False. Usa --force solo si es intencional.')
        if options['experiencias'] < 0 or options['usuarios'] < 0 or options['disponibilidades'] < 0:
            raise CommandError('Las cantidades no pueden ser negativas.')

        self.crear_rbac()
        if options['clean']:
            self.stdout.write(self.style.WARNING('Eliminando datos existentes, incluidos usuarios no superusuario...'))
            Disponibilidad.objects.all().delete()
            FotoExperiencia.objects.all().delete()
            Experiencia.objects.all().delete()
            Categoria.objects.all().delete()
            Usuario.objects.filter(is_superuser=False).delete()

        categorias = self.crear_categorias(options['categorias'])
        usuarios = self.crear_usuarios(options['usuarios'])
        host = Usuario.objects.filter(roles__nombre='Anfitrión').order_by('id').first()
        if not host:
            host, _ = Usuario.objects.get_or_create(
                username='anfitrion_test',
                defaults={
                    'email': 'anfitrion@test.com', 'first_name': 'Anfitrión',
                    'last_name': 'EcoRutas', 'documento_identidad': '12345678A',
                    'estado_verificacion': 'aprobado',
                },
            )
            if not host.password or not host.has_usable_password():
                host.set_password('testpass123')
                host.save(update_fields=['password'])
            host.roles.add(Rol.objects.get(nombre='Anfitrión'))

        catalogo = EXPERIENCIAS_COLOMBIA[:options['experiencias']]
        if options['reemplazar_experiencias']:
            self.stdout.write(self.style.WARNING('Reemplazando experiencias y dependencias; usuarios, roles y categorías se conservan.'))
            with transaction.atomic():
                Experiencia.objects.all().delete()
                experiencias = self.crear_experiencias(catalogo, categorias, host)
                self.crear_fotos(experiencias, catalogo)
        else:
            experiencias = self.crear_experiencias(catalogo, categorias, host)
            self.crear_fotos(experiencias, catalogo)

        if options['disponibilidades'] and experiencias:
            self.crear_disponibilidades(options['disponibilidades'], experiencias)

        self.stdout.write(self.style.SUCCESS(
            f'Catálogo colombiano listo: {len(experiencias)} experiencias, '
            f'{len(categorias)} categorías disponibles, {len(usuarios)} usuarios de prueba.'
        ))

    def crear_rbac(self):
        roles = {name: Rol.objects.get_or_create(nombre=name)[0] for name in ('Administrador', 'Anfitrión', 'Turista')}
        recurso, _ = Recurso.objects.update_or_create(nombre='Catálogo', defaults={
            'path': '/experiencias', 'icono': 'map', 'permisos': [
                {'path': '/api/catalogo/experiencias/', 'methods': ['get', 'post', 'put', 'patch', 'delete']},
                {'path': '/api/catalogo/categorias/', 'methods': ['get', 'post', 'put', 'patch', 'delete']},
                {'path': '/api/catalogo/disponibilidades/', 'methods': ['get', 'post', 'put', 'patch', 'delete']},
            ],
        })
        admin_resources = []
        for name, path, icon in (
            ('Gestión de Usuarios', '/admin/usuarios', 'users'),
            ('Gestión de Roles', '/admin/roles', 'shield'),
            ('Gestión de Recursos', '/admin/recursos', 'grid'),
        ):
            resource, _ = Recurso.objects.update_or_create(nombre=name, defaults={
                'path': path, 'icono': icon,
                'permisos': [{'path': path.replace('/admin', '/api/usuarios') + '/', 'methods': ['get', 'post', 'put', 'patch', 'delete']}],
            })
            admin_resources.append(resource)
        roles['Administrador'].recursos.add(recurso, *admin_resources)
        roles['Anfitrión'].recursos.add(recurso)
        roles['Turista'].recursos.add(recurso)
        for user in Usuario.objects.all().iterator():
            role_name = 'Administrador' if user.is_staff else ('Anfitrión' if user.roles.filter(nombre='Anfitrión').exists() else 'Turista')
            user.roles.add(roles[role_name])

    def crear_categorias(self, n):
        names = ['Senderismo', 'Ciclismo', 'Observación de aves', 'Avistamiento de fauna', 'Kayak', 'Escalada', 'Rutas a caballo', 'Fotografía de naturaleza', 'Camping', 'Rafting', 'Pesca deportiva']
        result = {name: Categoria.objects.get_or_create(nombre=name)[0] for name in names[:min(n, len(names))]}
        for name in {experience['categoria'] for experience in EXPERIENCIAS_COLOMBIA}:
            result[name] = Categoria.objects.get_or_create(nombre=name)[0]
        return result

    def crear_usuarios(self, n):
        users = []
        for _ in range(n):
            rol = random.choice(['turista', 'anfitrion'])
            user = Usuario.objects.create_user(username=fake.unique.user_name(), email=fake.unique.email(), password='testpass123', first_name=fake.first_name(), last_name=fake.last_name())
            user.roles.add(Rol.objects.get(nombre='Anfitrión' if rol == 'anfitrion' else 'Turista'))
            if rol == 'anfitrion':
                user.documento_identidad = fake.unique.bothify(text='??########')
                user.estado_verificacion = random.choice(['aprobado', 'pendiente', 'aprobado'])
                user.save()
            users.append(user)
        return users

    def crear_experiencias(self, catalogo, categorias, anfitrion):
        experiencias = []
        for item in catalogo:
            categoria = categorias.get(item['categoria']) or Categoria.objects.get(nombre=item['categoria'])
            experiencia, _ = Experiencia.objects.update_or_create(
                titulo=item['titulo'],
                defaults={
                    'anfitrion': anfitrion, 'categoria': categoria,
                    'descripcion': item['descripcion'], 'precio_unitario': Decimal(item['precio']),
                    'latitud': Decimal(item['latitud']), 'longitud': Decimal(item['longitud']), 'estado': 'Activa',
                },
            )
            experiencias.append(experiencia)
        return experiencias

    def crear_fotos(self, experiencias, catalogo):
        details = {item['titulo']: item for item in catalogo}
        for exp in experiencias:
            item = details[exp.titulo]
            photo, _ = FotoExperiencia.objects.get_or_create(experiencia=exp, es_principal=True, defaults={'url_foto': item['imagen']})
            if photo.url_foto != item['imagen']:
                photo.url_foto = item['imagen']
                photo.save(update_fields=['url_foto'])

    def crear_disponibilidades(self, n, experiencias):
        hoy = date.today()
        for _ in range(n):
            exp = random.choice(experiencias)
            start = time(random.randint(8, 14), 0)
            Disponibilidad.objects.create(experiencia=exp, fecha=hoy + timedelta(days=random.randint(1, 180)), hora_inicio=start, hora_fin=time(min(23, start.hour + random.randint(2, 8)), 0), cupos_totales=random.randint(5, 30))
