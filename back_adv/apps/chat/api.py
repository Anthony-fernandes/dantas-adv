from rest_framework import serializers, generics, permissions
from rest_framework.response import Response

from apps.core.permissions import IsTenantMember
from apps.core.viewsets import TenantScopedModelViewSet
from .models import ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_email = serializers.SerializerMethodField()

    def get_sender_name(self, obj):
        return getattr(obj.sender, 'full_name', None) or getattr(obj.sender, 'email', None)

    def get_sender_email(self, obj):
        return getattr(obj.sender, 'email', None)

    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'sender', 'sender_name', 'sender_email', 'created_at')


class ChatMessageViewSet(TenantScopedModelViewSet):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsTenantMember]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    filterset_fields = {'process': ['exact'], 'client': ['exact']}
    ordering_fields = ['created_at']
    ordering = ['created_at']

    def get_queryset(self):
        qs = ChatMessage.objects.select_related('sender', 'process', 'client').filter(
            tenant=self.request.tenant
        )
        return qs

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant, sender=self.request.user)
