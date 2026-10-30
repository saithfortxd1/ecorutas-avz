import random
from datetime import date, time, timedelta
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Prefetch, Q
from faker import Faker

from catalogo.models import Categoria, Disponibilidad, Experiencia, FotoExperiencia
from usuarios.models import Recurso, Rol

Usuario = get_user_model()
fake = Faker('es_ES')


# Base geográfica para los registros de demostración. Se crean diez variantes
# por destino para formar un catálogo reproducible en tamaño sin salir de Colombia.
DESTINOS_COLOMBIA = [
    {
        'titulo': 'Cabo de la Vela y dunas de La Guajira',
        'categoria': 'Ecoturismo',
        'descripcion': 'Paisajes costeros y desérticos de Cabo de la Vela, en La Guajira.',
        'latitud': '12.205300', 'longitud': '-72.176700',
        'imagen': 'https://images.unsplash.com/photo-1644849823235-7d3d55172383?w=1000&q=82',
    },
    {
        'titulo': 'Trekking a Ciudad Perdida, Sierra Nevada de Santa Marta',
        'categoria': 'Senderismo',
        'descripcion': 'Paisajes de montaña en el entorno de Ciudad Perdida, Sierra Nevada de Santa Marta.',
        'latitud': '11.037000', 'longitud': '-73.923000',
        'imagen': 'https://images.unsplash.com/photo-1612442560597-393c75377041?w=1000&q=82',
    },
    {
        'titulo': 'Senderos y playas del Parque Nacional Natural Tayrona',
        'categoria': 'Senderismo',
        'descripcion': 'Senderos y litoral del Parque Nacional Natural Tayrona, en el Magdalena.',
        'latitud': '11.312000', 'longitud': '-74.036000',
        'imagen': 'https://images.unsplash.com/photo-1635079552384-dd8adecd8a7c?w=1000&q=82',
    },
    {
        'titulo': 'Valle del Cocora, Salento, Quindío',
        'categoria': 'Senderismo',
        'descripcion': 'Paisajes de montaña y bosque de niebla del Valle del Cocora, en Salento, Quindío.',
        'latitud': '4.637000', 'longitud': '-75.570000',
        'imagen': 'https://images.unsplash.com/photo-1737914692165-b0428cca0104?w=1000&q=82',
    },
    {
        'titulo': 'Avistamiento de ballenas en Bahía Solano, Chocó',
        'categoria': 'Avistamiento de fauna',
        'descripcion': 'Fauna marina y costa del Pacífico colombiano en Bahía Solano, Chocó.',
        'latitud': '6.227000', 'longitud': '-77.407000',
        'imagen': 'https://commons.wikimedia.org/wiki/Special:FilePath/Humpback_whale_breaching_off_the_coast_of_Choco,_Colombia.jpg?width=1000',
    },
    {
        'titulo': 'Caño Cristales, Serranía de la Macarena, Meta',
        'categoria': 'Ecoturismo',
        'descripcion': 'Entorno natural de Caño Cristales y la Serranía de la Macarena, Meta.',
        'latitud': '2.206000', 'longitud': '-73.794000',
        'imagen': 'https://commons.wikimedia.org/wiki/Special:FilePath/CA%C3%91O_CRISTALES_EL_R%C3%8DO_DE_LOS_CINCO_COLORES.jpg?width=1000',
    },
    {
        'titulo': 'Santuario de Fauna y Flora Los Flamencos, La Guajira',
        'categoria': 'Kayak',
        'descripcion': 'Humedales y paisaje costero del Santuario de Fauna y Flora Los Flamencos, La Guajira.',
        'latitud': '11.413000', 'longitud': '-72.454000',
        'imagen': 'https://commons.wikimedia.org/wiki/Special:FilePath/Flamencos_en_La_Guajira.jpg?width=1000',
    },
    {
        'titulo': 'Parque Nacional Natural Macuira, La Guajira',
        'categoria': 'Senderismo',
        'descripcion': 'Bosques y montañas del Parque Nacional Natural Macuira, en la Alta Guajira.',
        'latitud': '12.002000', 'longitud': '-71.345000',
        'imagen': 'https://images.unsplash.com/photo-1644849823235-7d3d55172383?w=1000&q=82',
    },
    {
        'titulo': 'Paisaje Cultural Cafetero, Salento, Quindío',
        'categoria': 'Gastronomía',
        'descripcion': 'Paisaje rural y tradición cafetera de Salento, en el departamento del Quindío.',
        'latitud': '4.637000', 'longitud': '-75.570000',
        'imagen': 'https://images.unsplash.com/photo-1737914692165-b0428cca0104?w=1000&q=82',
    },
    {
        'titulo': 'Parque Nacional Natural Los Nevados, Región Andina',
        'categoria': 'Senderismo',
        'descripcion': 'Paisajes de alta montaña del Parque Nacional Natural Los Nevados, en la Región Andina.',
        'latitud': '4.810000', 'longitud': '-75.370000',
        'imagen': 'https://images.unsplash.com/photo-1737914692165-b0428cca0104?w=1000&q=82',
    },
    {
        'titulo': 'Reserva Natural Tanimboca, Amazonas',
        'categoria': 'Ecoturismo',
        'descripcion': 'Bosque húmedo tropical y biodiversidad del entorno de Leticia, Amazonas.',
        'latitud': '4.105000', 'longitud': '-69.938000',
        'imagen': 'https://images.unsplash.com/photo-1612442560597-393c75377041?w=1000&q=82',
    },
]

VARIANTES_EXPERIENCIA = (
    'Caminata de naturaleza', 'Recorrido interpretativo', 'Observación de biodiversidad',
    'Ruta fotográfica', 'Exploración de paisaje', 'Avistamiento responsable',
    'Circuito ecoturístico', 'Visita de naturaleza', 'Jornada de conservación',
    'Ruta de exploración local',
)


def generar_experiencias_colombia(cantidad):
    combinaciones = [
        (destino, variante, numero)
        for destino in DESTINOS_COLOMBIA
        for numero, variante in enumerate(VARIANTES_EXPERIENCIA, start=1)
    ]
    random.SystemRandom().shuffle(combinaciones)
    experiencias = []
    for destino, variante, numero in combinaciones[:cantidad]:
        experiencias.append({
            **destino,
            'titulo': f"{destino['titulo']} · {variante} {numero:02d}",
            'descripcion': (
                f"{destino['descripcion']} Modalidad de demostración: {variante.lower()}. "
                'Confirma con el anfitrión la disponibilidad, condiciones locales, permisos y servicios incluidos.'
            ),
            'precio': f"{random.SystemRandom().randrange(80000, 1200001, 1000)}.00",
        })
    return experiencias


class Command(BaseCommand):
    help = 'Poblar EcoRutas con experiencias colombianas y datos opcionales de prueba.'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true', help='Permitir ejecución con DEBUG=False.')
        parser.add_argument('--clean', action='store_true', help='Eliminar todos los datos de prueba antes de poblar (incluye usuarios no superusuario).')
        parser.add_argument('--reemplazar-experiencias', action='store_true', help='Reemplazar únicamente las experiencias y sus fotos, traducciones y disponibilidades. Conserva usuarios, roles y categorías.')
        parser.add_argument('--categorias', type=int, default=10, help='Número de categorías generales opcionales a crear.')
        parser.add_argument('--usuarios', type=int, default=0, help='Número de usuarios de prueba opcionales a crear (por defecto: ninguno).')
        parser.add_argument('--experiencias', type=int, default=100, help='Número de experiencias colombianas a generar (máximo 100).')
        parser.add_argument('--disponibilidades', type=int, default=0, help='Número de disponibilidades de prueba opcionales a crear (por defecto: ninguna).')

    def handle(self, *args, **options):
        if not settings.DEBUG and not options['force']:
            raise CommandError('seed_db está deshabilitado cuando DEBUG=False. Usa --force solo si es intencional.')
        if options['experiencias'] < 0 or options['experiencias'] > 100 or options['usuarios'] < 0 or options['disponibilidades'] < 0:
            raise CommandError('Las experiencias deben estar entre 0 y 100; las demás cantidades no pueden ser negativas.')

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

        catalogo = generar_experiencias_colombia(options['experiencias'])
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
        for name, path, icon, api_path in (
            ('Gestión de Usuarios', '/admin/usuarios', 'users', '/api/usuarios/admin/'),
            ('Gestión de Roles', '/admin/roles', 'shield', '/api/usuarios/roles/'),
            ('Gestión de Recursos', '/admin/recursos', 'grid', '/api/usuarios/recursos/'),
        ):
            resource, _ = Recurso.objects.update_or_create(nombre=name, defaults={
                'path': path, 'icono': icon,
                'permisos': [{'path': api_path, 'methods': ['get', 'post', 'put', 'patch', 'delete']}],
            })
        roles['Administrador'].recursos.set(Recurso.objects.all())
        roles['Anfitrión'].recursos.add(recurso)
        roles['Turista'].recursos.add(recurso)
        admin_users = Usuario.objects.filter(
            Q(is_staff=True) | Q(is_superuser=True) | Q(username__iexact='admin') | Q(email__iexact='admin@ecorutas.com')
        )
        for user in admin_users.iterator():
            user.roles.add(roles['Administrador'])

        users = Usuario.objects.exclude(pk__in=admin_users.values('pk')).prefetch_related(
            Prefetch('roles', queryset=Rol.objects.only('id', 'nombre')),
        )
        for user in users.iterator(chunk_size=500):
            assigned_role_names = {role.nombre for role in user.roles.all()}
            role_name = 'Anfitrión' if 'Anfitrión' in assigned_role_names else 'Turista'
            user.roles.add(roles[role_name])

    def crear_categorias(self, n):
        names = ['Senderismo', 'Ciclismo', 'Observación de aves', 'Avistamiento de fauna', 'Kayak', 'Escalada', 'Rutas a caballo', 'Fotografía de naturaleza', 'Camping', 'Rafting', 'Pesca deportiva', 'Ecoturismo', 'Gastronomía']
        result = {name: Categoria.objects.get_or_create(nombre=name)[0] for name in names[:min(n, len(names))]}
        for name in {destination['categoria'] for destination in DESTINOS_COLOMBIA}:
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
