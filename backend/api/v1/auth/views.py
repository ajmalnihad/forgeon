from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import CustomTokenObtainPairSerializer, UserSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/
    Custom JWT obtain view to return token + authenticated user details.
    """
    serializer_class = CustomTokenObtainPairSerializer


class UserMeView(generics.RetrieveAPIView):
    """
    GET /api/v1/auth/me/
    Return details of currently authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
