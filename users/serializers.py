from rest_framework import serializers
from django.contrib.auth import get_user_model
from artists.models import ArtistProfile


User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'email','first_name', 'password', 'role', 'phone']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
             first_name=validated_data.get('first_name', ''),
            role=validated_data.get('role', 'client'),
            phone=validated_data.get('phone', '')
        )

        # Auto-create empty artist profile if user is registering as artist
        if user.role == 'artist':
            ArtistProfile.objects.create(
                user=user,
                location='kerala',  # Default location
                style='digital'     # Default style
            )

        return user