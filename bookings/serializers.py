from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    artist_name = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    reference_image_url = serializers.SerializerMethodField()
    payment_screenshot_url = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ['id', 'client', 'artist', 'artist_name', 'client_name',
                  'description', 'service_type', 'artwork_size',
                  'delivery', 'delivery_address', 'preferred_date', 'reference_image',
                  'reference_image_url', 'status', 'total_price',
                  'advance_amount', 'payment_status', 'payment_screenshot',
                  'payment_screenshot_url', 'payment_uploaded_at', 'created_at']
        read_only_fields = [
            'client',
            'status',
            'total_price',
            'advance_amount',
            'payment_status',
            'payment_uploaded_at',
            'created_at',
        ]

    def get_artist_name(self, obj):
        return obj.artist.user.get_full_name() or obj.artist.user.email

    def get_client_name(self, obj):
        return obj.client.get_full_name() or obj.client.email

    def get_reference_image_url(self, obj):
        request = self.context.get('request')
        if not obj.reference_image:
            return None
        return request.build_absolute_uri(obj.reference_image.url) if request else obj.reference_image.url

    def get_payment_screenshot_url(self, obj):
        request = self.context.get('request')
        if not obj.payment_screenshot:
            return None
        return request.build_absolute_uri(obj.payment_screenshot.url) if request else obj.payment_screenshot.url
