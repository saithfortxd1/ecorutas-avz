from rest_framework import serializers
from .models import Usuario


class UsuarioRegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'rol', 'documento_identidad'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Las contraseñas no coinciden.'})
        
        rol = attrs.get('rol', 'turista')
        documento_identidad = attrs.get('documento_identidad')
        
        if rol == 'anfitrion' and not documento_identidad:
            raise serializers.ValidationError({
                'documento_identidad': 'El documento de identidad es obligatorio para anfitriones.'
            })
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UsuarioMeSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para el perfil del usuario autenticado.
    Devuelve el rol y, si es anfitrión, sus datos particulares.
    """
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    perfil_anfitrion = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'rol', 'rol_display', 'is_staff', 'is_superuser',
            'documento_identidad', 'estado_verificacion', 'perfil_anfitrion',
            'date_joined',
        ]
        read_only_fields = fields

    def get_perfil_anfitrion(self, obj):
        if getattr(obj, 'rol', None) != 'anfitrion':
            return None
        return {
            'documento_identidad': obj.documento_identidad,
            'estado_verificacion': obj.estado_verificacion,
            'estado_verificacion_display': obj.get_estado_verificacion_display(),
        }