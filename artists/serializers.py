from rest_framework import serializers
from .models import ArtistProfile, Portfolio

class PortfolioSerializer(serializers.ModelSerializer):
    artist_id = serializers.IntegerField(source='artist.id', read_only=True)
    artist_name = serializers.SerializerMethodField()
    artist_style = serializers.CharField(source='artist.style', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            'id',
            'title',
            'image',
            'image_url',
            'uploaded_at',
            'artist_id',
            'artist_name',
            'artist_style',
        ]

    def get_artist_name(self, obj):
        return obj.artist.user.get_full_name() or obj.artist.user.email

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

class ArtistSerializer(serializers.ModelSerializer):
    portfolio = PortfolioSerializer(many=True, read_only=True)
    user_name = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    avatar_url = serializers.SerializerMethodField()
    
    

    class Meta:
        model = ArtistProfile
        fields = ['id', 'user', 'user_id', 'user_name', 'bio', 'portfolio_url', 'location', 'style',
          'base_price', 'avatar', 'avatar_url', 'rating', 'total_bookings',
          'is_available', 'created_at', 'portfolio', 'phone', 'experience', 'mediums',]
        read_only_fields = ['user', 'rating', 'total_bookings', 'created_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email
    
    
    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar:
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None
    
class ArtistOnboardingSerializer(serializers.ModelSerializer):
    """Serializer for artist profile completion during onboarding"""

    user_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = ArtistProfile
        fields = ['user_name', 'bio', 'portfolio_url', 'location', 'style', 'base_price', 'avatar', 'avatar_url','phone', 'experience', 'mediums',]
        # Make all fields optional so they can skip them
        extra_kwargs = {
            'bio': {'required': False, 'allow_blank': True},
            'portfolio_url': {'required': False, 'allow_blank': True},
            'location': {'required': False, 'allow_blank': True},
            'style': {'required': False, 'allow_blank': True},
            'base_price': {'required': False},
            'avatar': {'required': False, 'allow_null': True},
            'phone': {'required': False, 'allow_blank': True},
            'experience': {'required': False, 'allow_blank': True},
            'mediums': {'required': False, 'allow_blank': True},

        }

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar:
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None
