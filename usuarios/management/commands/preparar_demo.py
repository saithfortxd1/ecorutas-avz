from datetime import time, timedelta

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from catalogo.models import Disponibilidad, Experiencia
from usuarios.models import Rol, Usuario


class Command(BaseCommand):
    """Prepara cuentas de demostracion y asegura que el catalogo tenga un anfitrion visible.

    Crea/actualiza:
      - anfitrion_demo (rol Anfitrion, dueno del catalogo)
      - turista_demo (rol Turista)

    Reasigna todas las experiencias existentes a anfitrion_demo para que las
    reservas entrantes de los clientes aparezcan en su bandeja.
    """

    help = 'Prepara cuentas de demo (anfitrion y turista) y asigna el catalogo al anfitrion.'

    def add_arguments(self, parser):
        parser.add_argument('--password', required=True, help='Contrasena elegida para las cuentas locales de demo.')

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError('preparar_demo solo se permite con DEBUG=True.')

        password = options['password']
        roles = {name: Rol.objects.get_or_create(nombre=name)[0] for name in ('Administrador', 'Anfitrión', 'Turista')}

        anfitrion, _ = Usuario.objects.get_or_create(
            username='anfitrion_demo',
            defaults={
                'email': 'anfitrion.demo@ecorutas.com',
                'first_name': 'Anfitrion',
                'last_name': 'Demo',
                'documento_identidad': 'DEMO-0001',
                'estado_verificacion': 'aprobado',
            },
        )
        anfitrion.set_password(password)
        anfitrion.save()
        anfitrion.roles.set([roles['Anfitrión']])

        turista, _ = Usuario.objects.get_or_create(
            username='turista_demo',
            defaults={
                'email': 'turista.demo@ecorutas.com',
                'first_name': 'Turista',
                'last_name': 'Demo',
            },
        )
        turista.set_password(password)
        turista.save()
        turista.roles.set([roles['Turista']])

        asignadas = Experiencia.objects.update(anfitrion=anfitrion)
        detalles_actualizados = Experiencia.objects.filter(incluye='', recomendaciones='').update(
            incluye=(
                'Acompañamiento de un anfitrión local durante el recorrido.\n'
                'Paradas de interpretación del entorno y tiempo para fotografías.'
            ),
            recomendaciones=(
                'Usa calzado cómodo, lleva agua y protección solar. '
                'Confirma con el anfitrión el transporte, alimentación, permisos y condiciones del clima.'
            ),
        )
        hoy = timezone.localdate()
        fecha_demo = hoy + timedelta(days=14)
        disponibilidades_creadas = 0
        for experiencia in Experiencia.objects.prefetch_related('disponibilidades'):
            if not any(disponibilidad.fecha >= hoy for disponibilidad in experiencia.disponibilidades.all()):
                _, creada = Disponibilidad.objects.get_or_create(
                    experiencia=experiencia,
                    fecha=fecha_demo,
                    hora_inicio=time(8, 0),
                    defaults={
                        'hora_fin': time(12, 0),
                        'cupos_totales': 12,
                    },
                )
                disponibilidades_creadas += int(creada)

        self.stdout.write(self.style.SUCCESS(
            'Demo lista.\n'
            f'  Anfitrion: anfitrion_demo  (rol Anfitrion, {asignadas} experiencias asignadas)\n'
            '  Turista:   turista_demo  (rol Turista)\n'
            f'  Planes completados con informacion comercial: {detalles_actualizados}\n'
            f'  Disponibilidades futuras creadas: {disponibilidades_creadas}'
        ))
