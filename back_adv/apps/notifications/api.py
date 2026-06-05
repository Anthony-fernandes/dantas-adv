from rest_framework import serializers

from apps.core.permissions import IsTenantMember
from apps.core.viewsets import TenantScopedModelViewSet
from .models import Notification


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
