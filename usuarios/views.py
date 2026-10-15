from rest_framework import generics, status
from rest_framework.response import Response
from .models import Usuario
from .serializers import UsuarioRegistroSerializer


class UsuarioRegistroView(generics.CreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioRegistroSerializer
    permission_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'mensaje': 'Usuario registrado correctamente.',
            'usuario': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'rol': user.rol,
            }
        }, status=status.HTTP_201_CREATED)