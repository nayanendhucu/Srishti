from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from .models import Message
from .serializers import MessageSerializer
from artists.models import ArtistProfile
from bookings.models import Booking

User = get_user_model()

def display_name(user):
    return user.get_full_name() or user.email or user.username

def artist_profile_for(user):
    try:
        return user.artist_profile
    except ArtistProfile.DoesNotExist:
        return None

def allowed_contact_ids_for(user):
    message_contact_ids = set(
        Message.objects
        .filter(Q(sender=user) | Q(receiver=user))
        .values_list('sender_id', 'receiver_id')
    )
    message_contact_ids = {
        user_id
        for pair in message_contact_ids
        for user_id in pair
        if user_id != user.id
    }

    if user.role == 'artist':
        booking_contact_ids = set(
            Booking.objects
            .filter(artist__user=user)
            .values_list('client_id', flat=True)
        )
        return booking_contact_ids | message_contact_ids

    booking_contact_ids = set(
        Booking.objects
        .filter(client=user)
        .values_list('artist__user_id', flat=True)
    )
    return booking_contact_ids | message_contact_ids

def users_can_message(user, other_user):
    if user.id == other_user.id:
        return False

    if other_user.id in allowed_contact_ids_for(user):
        return True

    return user.role == 'client' and other_user.role == 'artist'

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inbox(request):
    allowed_contact_ids = allowed_contact_ids_for(request.user)
    if not allowed_contact_ids:
        return Response([])

    messages = (
        Message.objects
        .filter(Q(sender=request.user) | Q(receiver=request.user))
        .select_related('sender', 'receiver')
        .order_by('-timestamp')
    )

    latest_by_user = {}
    for message in messages:
        other = message.receiver if message.sender_id == request.user.id else message.sender
        if other.id not in allowed_contact_ids:
            continue
        if other.id not in latest_by_user:
            artist_profile = artist_profile_for(other)
            avatar_url = None
            if artist_profile and artist_profile.avatar:
                avatar_url = request.build_absolute_uri(artist_profile.avatar.url)
            latest_by_user[other.id] = {
                'user_id': other.id,
                'name': display_name(other),
                'role': other.role,
                'artist_profile_id': artist_profile.id if artist_profile else None,
                'avatar_url': avatar_url,
                'last_message': message.text or (message.attachment_name or 'Attachment'),
                'last_sender_id': message.sender_id,
                'timestamp': message.timestamp,
                'unread_count': 0,
            }

    unread_counts = (
        Message.objects
        .filter(receiver=request.user, sender_id__in=allowed_contact_ids, is_read=False)
        .values('sender')
        .annotate(count=Count('id'))
    )
    for item in unread_counts:
        sender_id = item['sender']
        if sender_id in latest_by_user:
            latest_by_user[sender_id]['unread_count'] = item['count']

    return Response(list(latest_by_user.values()))

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def conversation(request, user_id):
    try:
        other_user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

    if not users_can_message(request.user, other_user):
        return Response({'error': 'This conversation is available only between art lovers and artists.'}, status=403)

    if request.method == 'GET':
        messages = Message.objects.filter(
            sender=request.user, receiver=other_user
        ) | Message.objects.filter(
            sender=other_user, receiver=request.user
        )
        Message.objects.filter(sender=other_user, receiver=request.user, is_read=False).update(is_read=True)
        serializer = MessageSerializer(messages.order_by('timestamp'), many=True, context={'request': request})
        return Response(serializer.data)

    if request.method == 'POST':
        serializer = MessageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            attachment = request.FILES.get('attachment')
            save_kwargs = {'sender': request.user, 'receiver': other_user}
            if attachment:
                save_kwargs.update({
                    'attachment_name': attachment.name,
                    'attachment_content_type': getattr(attachment, 'content_type', '') or '',
                })
            serializer.save(**save_kwargs)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
