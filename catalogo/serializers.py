from rest_framework import serializers
from .models import Categoria, Experiencia, ExperienciaTraduccion, FotoExperiencia, Disponibilidad

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