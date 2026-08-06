from django.shortcuts import render

from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import ArtistProfile, Portfolio
from .serializers import ArtistSerializer, ArtistOnboardingSerializer, PortfolioSerializer

@api_view(['GET'])
@permission_classes([AllowAny])
def artist_list(request):
    artists = ArtistProfile.objects.filter(is_available=True)

    location = request.GET.get('location')
    style = request.GET.get('style')
    budget = request.GET.get('budget')

    if location and location != 'all':
        artists = artists.filter(location=location)
    if style and style != 'all':
        artists = artists.filter(style=style)
    if budget and budget != 'all':
        budget_map = {
            'under1000':    (0, 1000),
            '1000-5000':    (1000, 5000),
            '5000-15000':   (5000, 15000),
            '15000-50000':  (15000, 50000),
            'above50000':   (50000, 9999999),   
        }
        low, high = budget_map.get(budget, (0, 9999999))
        artists = artists.filter(base_price__gte=low, base_price__lte=high)

    serializer = ArtistSerializer(artists, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def artist_detail(request, pk):
    try:
        artist = ArtistProfile.objects.get(pk=pk)
        serializer = ArtistSerializer(artist, context={'request': request})
        return Response(serializer.data)
    except ArtistProfile.DoesNotExist:
        return Response({'error': 'Artist not found'}, status=404)

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def portfolio_list(request):
    if request.method == 'GET':
        items = Portfolio.objects.select_related('artist', 'artist__user').order_by('-uploaded_at')
        serializer = PortfolioSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

    if not request.user.is_authenticated:
        return Response({'detail': 'Authentication required.'}, status=401)

    try:
        artist_profile = request.user.artist_profile
    except ArtistProfile.DoesNotExist:
        return Response({'detail': 'Only artists can upload portfolio images.'}, status=403)

    files = request.FILES.getlist('images') or request.FILES.getlist('image')
    if not files:
        return Response({'image': ['No image file was submitted.']}, status=400)

    created_items = [
        Portfolio.objects.create(
            artist=artist_profile,
            image=file,
            title=request.data.get('title', '')
        )
        for file in files
    ]
    serializer = PortfolioSerializer(created_items, many=True, context={'request': request})
    return Response(serializer.data, status=201)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def update_artist_profile(request):
    profile, created = ArtistProfile.objects.get_or_create(
        user=request.user,
        defaults={'location': '', 'style': '', 'base_price': 0}
    )
    if request.method == 'GET':
        serializer = ArtistSerializer(profile)
        return Response(serializer.data)
    
    serializer = ArtistSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def complete_artist_profile(request):
    """
    GET: Get current artist profile (for onboarding page to fill)
    POST: Update artist profile during onboarding
    """
    try:
        artist_profile = request.user.artist_profile
    except ArtistProfile.DoesNotExist:
        return Response({'error': 'No artist profile found. Please register as artist first.'}, status=404)
    
    if request.method == 'GET':
        serializer = ArtistOnboardingSerializer(artist_profile, context={'request': request})
        data = dict(serializer.data)
        data['portfolio'] = PortfolioSerializer(
            artist_profile.portfolio.order_by('-uploaded_at'),
            many=True,
            context={'request': request}
        ).data
        return Response(data)
    
    full_name = request.data.get('full_name')
    if full_name:
        request.user.first_name = full_name
        request.user.save(update_fields=['first_name'])

    serializer = ArtistOnboardingSerializer(artist_profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': 'Profile completed successfully!',
            'profile': ArtistSerializer(artist_profile, context={'request': request}).data
        }, status=200)
    return Response(serializer.errors, status=400)
