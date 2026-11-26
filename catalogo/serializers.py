from rest_framework import serializers
from django.db.models import Sum
from .models import Categoria, Experiencia, ExperienciaTraduccion, FotoExperiencia, Disponibilidad, Reserva

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ExperienciaTraduccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperienciaTraduccion
        fields = ['id', 'idioma', 'titulo_traducido', 'descripcion_traducida']

class FotoExperienciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoExperiencia
        fields = ['id', 'url_foto', 'es_principal']

class ExperienciaSerializer(serializers.ModelSerializer):
    # Relaciones anidadas (Filtro entre tablas)
    traducciones = ExperienciaTraduccionSerializer(many=True, read_only=True)
    fotos = FotoExperienciaSerializer(many=True, read_only=True)
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    # El anfitrión se asigna automáticamente desde el usuario autenticado
    anfitrion = serializers.PrimaryKeyRelatedField(read_only=True)
    anfitrion_username = serializers.ReadOnlyField(source='anfitrion.username')
    anfitrion_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Experiencia
        fields = [
            'id', 'anfitrion', 'anfitrion_username', 'anfitrion_nombre', 'categoria', 'categoria_nombre',
            'titulo', 'descripcion', 'precio_unitario', 'latitud', 'longitud',
            'estado', 'incluye', 'recomendaciones', 'created_at', 'traducciones', 'fotos'
        ]
        read_only_fields = ['anfitrion', 'created_at']

    def get_anfitrion_nombre(self, obj):
        nombre = f'{obj.anfitrion.first_name} {obj.anfitrion.last_name}'.strip()
        return nombre or obj.anfitrion.username


class DisponibilidadSerializer(serializers.ModelSerializer):
    experiencia_titulo = serializers.ReadOnlyField(source='experiencia.titulo')
    cupos_disponibles = serializers.SerializerMethodField()

    class Meta:
        model = Disponibilidad
        fields = [
            'id', 'experiencia', 'experiencia_titulo', 'fecha',
            'hora_inicio', 'hora_fin', 'cupos_totales', 'cupos_disponibles'
        ]

    def get_cupos_disponibles(self, obj):
        reservas_activas = getattr(obj, 'reservas_activas', None)
        if reservas_activas is None:
            reservas_activas = obj.reservas.filter(
                estado__in=('pendiente', 'confirmada'),
            ).aggregate(total=Sum('personas'))['total'] or 0
        return max(obj.cupos_totales - reservas_activas, 0)


class ReservaSerializer(serializers.ModelSerializer):
    experiencia_titulo = serializers.ReadOnlyField(source='experiencia.titulo')
    experiencia_anfitrion = serializers.ReadOnlyField(source='experiencia.anfitrion_id')
    cliente_username = serializers.ReadOnlyField(source='cliente.username')
    cliente_nombre = serializers.SerializerMethodField()
    cliente_email = serializers.ReadOnlyField(source='cliente.email')
    cliente_telefono = serializers.ReadOnlyField(source='cliente.telefono')
    disponibilidad_fecha = serializers.ReadOnlyField(source='disponibilidad.fecha')
    precio_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Reserva
        fields = [
            'id', 'experiencia', 'experiencia_titulo', 'experiencia_anfitrion',
            'cliente', 'cliente_username', 'cliente_nombre', 'cliente_email', 'cliente_telefono',
            'disponibilidad', 'disponibilidad_fecha', 'fecha', 'personas',
            'precio_total', 'estado', 'telefono_contacto', 'notas', 'created_at',
        ]
        read_only_fields = ['cliente', 'precio_total', 'created_at']

    def get_cliente_nombre(self, obj):
        nombre = f'{obj.cliente.first_name} {obj.cliente.last_name}'.strip()
        return nombre or obj.cliente.username

    def validate_personas(self, value):
        if value is None or value < 1:
            raise serializers.ValidationError('La reserva debe incluir al menos 1 persona.')
        return value

    def validate(self, attrs):
        experiencia = attrs.get('experiencia') or getattr(self.instance, 'experiencia', None)
        disponibilidad = attrs.get('disponibilidad') or getattr(self.instance, 'disponibilidad', None)
        fecha = attrs.get('fecha') or getattr(self.instance, 'fecha', None)
        personas = attrs.get('personas', getattr(self.instance, 'personas', 1))

        if disponibilidad is not None:
            if experiencia is not None and disponibilidad.experiencia_id != experiencia.id:
                raise serializers.ValidationError(
                    {'disponibilidad': 'La disponibilidad no pertenece a esa experiencia.'}
                )
            if fecha is not None and disponibilidad.fecha != fecha:
                raise serializers.ValidationError(
                    {'fecha': 'La fecha debe coincidir con la disponibilidad seleccionada.'}
                )
            reservas_activas_query = disponibilidad.reservas.filter(
                estado__in=('pendiente', 'confirmada'),
            )
            if self.instance is not None:
                reservas_activas_query = reservas_activas_query.exclude(pk=self.instance.pk)
            reservas_activas = reservas_activas_query.aggregate(total=Sum('personas'))['total'] or 0
            cupos_disponibles = max(disponibilidad.cupos_totales - reservas_activas, 0)
            if self.instance is None or any(field in attrs for field in ('personas', 'disponibilidad', 'fecha')):
                if personas > cupos_disponibles:
                    raise serializers.ValidationError(
                        {'personas': f'La disponibilidad solo tiene {cupos_disponibles} cupos disponibles.'}
                    )
        return attrs