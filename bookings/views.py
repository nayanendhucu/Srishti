from django.shortcuts import render

from django.utils import timezone
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer
from artists.models import ArtistProfile
from messaging.models import Message

def notify(sender, receiver, text):
    Message.objects.create(sender=sender, receiver=receiver, text=text)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def create_booking(request):
    if request.user.role != 'client':
        return Response({'error': 'Only client accounts can send booking requests.'}, status=403)

    if request.data.get('terms_accepted') != 'true':
        return Response({'error': 'You must accept the Terms of Service before booking.'}, status=400)

    delivery = request.data.get('delivery', 'digital')
    if delivery in ['physical', 'both'] and not request.data.get('delivery_address', '').strip():
        return Response({'error': 'Delivery address is required for physical artwork delivery.'}, status=400)

    artist_id = request.data.get('artist')
    try:
        artist = ArtistProfile.objects.get(pk=artist_id)
    except ArtistProfile.DoesNotExist:
        return Response({'error': 'Artist not found'}, status=404)

    if artist.user_id == request.user.id:
        return Response({'error': 'You cannot book your own artist profile.'}, status=400)

    multipliers = {'standard': 1, 'express': 1.5, 'premium': 2}
    service = request.data.get('service_type', 'standard')
    price = float(artist.base_price) * multipliers.get(service, 1)
    platform_fee = price * 0.05
    total = round(price + platform_fee, 2)
    advance = round(total * 0.30, 2)

    data = request.data.copy()
    data['total_price'] = total

    serializer = BookingSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        booking = serializer.save(
            client=request.user,
            total_price=total,
            advance_amount=advance,
        )
        notify(
            request.user,
            artist.user,
            f'New booking request from {request.user.get_full_name() or request.user.email}.'
        )
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_bookings(request):
    if request.user.role == 'artist':
        bookings = Booking.objects.filter(artist__user=request.user).exclude(status__in=['declined', 'cancelled'])
    else:
        bookings = Booking.objects.filter(client=request.user)
    serializer = BookingSerializer(bookings.order_by('-created_at'), many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, pk):
    try:
        booking = Booking.objects.get(pk=pk, artist__user=request.user)
        new_status = request.data.get('status', booking.status)
        allowed_statuses = {'accepted', 'declined', 'in_progress', 'completed', 'cancelled'}
        if new_status not in allowed_statuses:
            return Response({'error': 'Invalid status'}, status=400)

        if new_status == 'accepted':
            booking.status = 'accepted'
            booking.payment_status = 'pending_upload'
            if not booking.advance_amount:
                booking.advance_amount = round(float(booking.total_price) * 0.30, 2)
            notify(
                request.user,
                booking.client,
                'Your booking was accepted. Please upload the advance payment screenshot to start the work.'
            )
        elif new_status == 'declined':
            booking.status = 'declined'
            notify(
                request.user,
                booking.client,
                'Your booking was declined by the artist.'
            )
        elif new_status == 'in_progress':
            if booking.payment_status != 'submitted':
                return Response({'error': 'Payment screenshot must be submitted before starting work.'}, status=400)
            booking.status = 'in_progress'
            booking.payment_status = 'verified'
            notify(
                request.user,
                booking.client,
                'Your advance payment was verified. The artist has started working.'
            )
        else:
            booking.status = new_status
        booking.save()
        serializer = BookingSerializer(booking, context={'request': request})
        return Response(serializer.data)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_payment_screenshot(request, pk):
    try:
        booking = Booking.objects.get(pk=pk, client=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)

    if booking.status != 'accepted':
        return Response({'error': 'Payment screenshot can be uploaded only after artist acceptance.'}, status=400)

    screenshot = request.FILES.get('payment_screenshot')
    if not screenshot:
        return Response({'error': 'Payment screenshot is required.'}, status=400)
    if not getattr(screenshot, 'content_type', '').startswith('image/'):
        return Response({'error': 'Please upload an image screenshot.'}, status=400)
    if screenshot.size > 10 * 1024 * 1024:
        return Response({'error': 'Screenshot must be 10 MB or smaller.'}, status=400)

    booking.payment_screenshot = screenshot
    booking.payment_status = 'submitted'
    booking.payment_uploaded_at = timezone.now()
    booking.save()
    notify(
        request.user,
        booking.artist.user,
        'Payment screenshot submitted. Please verify it and start the work.'
    )
    serializer = BookingSerializer(booking, context={'request': request})
    return Response(serializer.data)
