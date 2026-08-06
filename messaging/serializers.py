from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'sender_name',
            'receiver',
            'receiver_name',
            'text',
            'attachment',
            'attachment_url',
            'attachment_name',
            'attachment_content_type',
            'timestamp',
            'is_read',
        ]
        read_only_fields = ['sender', 'receiver', 'timestamp', 'is_read']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.email

    def get_receiver_name(self, obj):
        return obj.receiver.get_full_name() or obj.receiver.email

    def get_attachment_url(self, obj):
        request = self.context.get('request')
        if not obj.attachment:
            return None
        return request.build_absolute_uri(obj.attachment.url) if request else obj.attachment.url

    def validate(self, attrs):
        text = attrs.get('text', '')
        attachment = attrs.get('attachment')
        if not text.strip() and not attachment:
            raise serializers.ValidationError('Message text or an attachment is required.')
        if attachment:
            max_size = 10 * 1024 * 1024
            allowed_types = {
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
            }
            if attachment.size > max_size:
                raise serializers.ValidationError('Attachment must be 10 MB or smaller.')
            if getattr(attachment, 'content_type', '') not in allowed_types:
                raise serializers.ValidationError('Unsupported attachment type.')
        return attrs
