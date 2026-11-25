from rest_framework import serializers
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

    class Meta:
        model = Experiencia
        fields = [
            'id', 'anfitrion', 'anfitrion_username', 'categoria', 'categoria_nombre',
            'titulo', 'descripcion', 'precio_unitario', 'latitud', 'longitud',
            'estado', 'created_at', 'traducciones', 'fotos'
        ]
        read_only_fields = ['anfitrion', 'created_at']


class DisponibilidadSerializer(serializers.ModelSerializer):
    experiencia_titulo = serializers.ReadOnlyField(source='experiencia.titulo')

    class Meta:
        model = Disponibilidad
        fields = [
            'id', 'experiencia', 'experiencia_titulo', 'fecha',
            'hora_inicio', 'hora_fin', 'cupos_totales'
        ]


class ReservaSerializer(serializers.ModelSerializer):
    experiencia_titulo = serializers.ReadOnlyField(source='experiencia.titulo')
    cliente_username = serializers.ReadOnlyField(source='cliente.username')
    disponibilidad_fecha = serializers.ReadOnlyField(source='disponibilidad.fecha')
    precio_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Reserva
        fields = [
            'id', 'experiencia', 'experiencia_titulo', 'cliente', 'cliente_username',
            'disponibilidad', 'disponibilidad_fecha', 'fecha', 'personas',
            'precio_total', 'estado', 'notas', 'created_at',
        ]
        read_only_fields = ['cliente', 'precio_total', 'estado', 'created_at']

    def validate_personas(self, value):
        if value is None or value < 1:
            raise serializers.ValidationError('La reserva debe incluir al menos 1 persona.')
        return value

    def validate(self, attrs):
        experiencia = attrs.get('experiencia')
        disponibilidad = attrs.get('disponibilidad')
        personas = attrs.get('personas', 1)

        if disponibilidad is not None:
            if experiencia is not None and disponibilidad.experiencia_id != experiencia.id:
                raise serializers.ValidationError(
                    {'disponibilidad': 'La disponibilidad no pertenece a esa experiencia.'}
                )
            if disponibilidad.cupos_totales and personas > disponibilidad.cupos_totales:
                raise serializers.ValidationError(
                    {'personas': f'La disponibilidad solo tiene {disponibilidad.cupos_totales} cupos.'}
                )
        return attrs