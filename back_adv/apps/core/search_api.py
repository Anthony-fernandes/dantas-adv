"""Busca global do workspace (Cmd+K).

GET /api/search/?q=termo
Retorna processos, clientes e documentos do tenant que casem com o termo,
limitados a 8 por categoria — pensado para o palette de busca do frontend.
"""
from __future__ import annotations

from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsTenantMember


class GlobalSearchView(APIView):
    permission_classes = [IsTenantMember]

    def get(self, request):
        term = (request.query_params.get('q') or '').strip()
        if len(term) < 2:
            return Response({'processes': [], 'clients': [], 'documents': [], 'tasks': []})

        tenant = request.tenant
        limit = 8

        from apps.processes.models import Process, Task
        from apps.clients.models import Client
        from apps.documents.models import Document

        digits = ''.join(ch for ch in term if ch.isdigit())

        process_filter = (
            Q(cnj__icontains=term)
            | Q(subject__icontains=term)
            | Q(plaintiff__icontains=term)
            | Q(defendant__icontains=term)
            | Q(client__name__icontains=term)
        )
        if len(digits) >= 4:
            process_filter = process_filter | Q(cnj__icontains=digits)

        processes = (
            Process.objects.filter(tenant=tenant, deleted_at__isnull=True)
            .filter(process_filter)
            .select_related('client')
            .order_by('-updated_at')[:limit]
        )

        client_filter = Q(name__icontains=term) | Q(trade_name__icontains=term) | Q(email__icontains=term)
        if len(digits) >= 4:
            client_filter = client_filter | Q(doc__icontains=digits)

        clients = (
            Client.objects.filter(tenant=tenant, deleted_at__isnull=True)
            .filter(client_filter)
            .order_by('name')[:limit]
        )

        documents = (
            Document.objects.filter(tenant=tenant, deleted_at__isnull=True, is_latest=True)
            .filter(Q(title__icontains=term) | Q(filename__icontains=term) | Q(category__icontains=term))
            .select_related('process', 'client')
            .order_by('-created_at')[:limit]
        )

        tasks = (
            Task.objects.filter(tenant=tenant)
            .filter(Q(title__icontains=term) | Q(description__icontains=term))
            .exclude(status='concluida')
            .order_by('due_date')[:limit]
        )

        return Response({
            'tasks': [
                {
                    'id': str(t.id),
                    'title': t.title,
                    'status': t.status,
                    'due_date': t.due_date.isoformat() if t.due_date else None,
                }
                for t in tasks
            ],
            'processes': [
                {
                    'id': str(p.id),
                    'cnj': p.cnj,
                    'subject': p.subject,
                    'client_name': p.client.name if p.client else None,
                    'status': p.status,
                }
                for p in processes
            ],
            'clients': [
                {
                    'id': str(c.id),
                    'name': c.name,
                    'doc': c.doc,
                    'type': c.type,
                    'status': c.status,
                }
                for c in clients
            ],
            'documents': [
                {
                    'id': str(d.id),
                    'title': d.title or d.filename,
                    'category': d.category,
                    'process_id': str(d.process_id) if d.process_id else None,
                    'client_id': str(d.client_id) if d.client_id else None,
                }
                for d in documents
            ],
        })
