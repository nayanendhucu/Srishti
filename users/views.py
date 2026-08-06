from django.shortcuts import render

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer

User = get_user_model()

@api_view(['POST'])
def register(request):
    if not request.data.get('terms_accepted'):
        return Response({'terms_accepted': ['You must accept the Terms and Privacy Policy to register.']}, status=400)

    if User.objects.filter(email=request.data.get('email')).exists():
        return Response({'email': ['User already exists.']}, status=400)

    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        response_data = {
            'message': 'Account created successfully',
            'user_id': user.id,
            'role': user.role
        }
        # If registered as artist, they need to complete onboarding
        if user.role == 'artist':
            response_data['next_page'] = '/artist-onboarding/'
        else:
            response_data['next_page'] = '/'
        return Response(response_data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    return Response({
        'id': user.id,
        'email': user.email,
        'name': user.get_full_name() or user.username,
        'role': user.role,
        'phone': user.phone
    })
