from rest_framework import serializers, status
from rest_framework.response import Response

from apps.core.permissions import IsTenantMember
from apps.core.viewsets import TenantScopedModelViewSet
from .models import Notification, PushSubscription


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at')


class NotificationViewSet(TenantScopedModelViewSet):
    queryset = Notification.objects.all().order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [IsTenantMember]

    def get_queryset(self):
        qs = super().get_queryset()
        # by default, users only see their notifications
        return qs.filter(user=self.request.user)

    def perform_create(self, serializer):
        # force user to self unless admin decides otherwise
        serializer.save(user=self.request.user, tenant=self.request.tenant)


class PushSubscriptionSerializer(serializers.ModelSerializer):
    keys = serializers.DictField(write_only=True, required=True)

    class Meta:
        model = PushSubscription
        fields = ('id', 'endpoint', 'keys', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        keys = validated_data.pop('keys')
        validated_data['p256dh'] = keys.get('p256dh', '')
        validated_data['auth'] = keys.get('auth', '')
        obj, _ = PushSubscription.objects.update_or_create(
            user=validated_data['user'],
            endpoint=validated_data['endpoint'],
            defaults={**validated_data},
        )
        return obj


class PushSubscriptionViewSet(TenantScopedModelViewSet):
    serializer_class = PushSubscriptionSerializer
    permission_classes = [IsTenantMember]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return PushSubscription.objects.filter(tenant=self.request.tenant, user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant, user=self.request.user)
