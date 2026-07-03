"""Testes de partes do processo (ProcessParty) e auditoria de autenticação."""
from apps.core.models import AuditEvent
from apps.processes.models import ProcessParty
from apps.processes.tests.test_tenancy import BaseTenantTestCase


class ProcessPartyTests(BaseTenantTestCase):
    def test_create_party_for_own_process(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.post('/api/process-parties/', {
            'process': str(self.process_a.id),
            'role': 'autor',
            'name': 'Maria da Silva',
            'doc': '123.456.789-00',
            'is_client': True,
        }, format='json')
        self.assertEqual(response.status_code, 201, response.content)
        body = response.json()
        self.assertEqual(body['role_label'], 'Autor / Requerente')

    def test_cannot_attach_party_to_other_tenant_process(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.post('/api/process-parties/', {
            'process': str(self.process_b.id),
            'role': 'reu',
            'name': 'Invasor',
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_list_scoped_by_tenant(self):
        ProcessParty.objects.create(tenant=self.tenant_a, process=self.process_a, role='autor', name='Parte A')
        ProcessParty.objects.create(tenant=self.tenant_b, process=self.process_b, role='reu', name='Parte B')
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/process-parties/')
        self.assertEqual(response.status_code, 200)
        names = {item['name'] for item in response.json().get('results', response.json())}
        self.assertIn('Parte A', names)
        self.assertNotIn('Parte B', names)

    def test_filter_by_process(self):
        ProcessParty.objects.create(tenant=self.tenant_a, process=self.process_a, role='autor', name='Filtrada')
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get(f'/api/process-parties/?process={self.process_a.id}')
        self.assertEqual(response.status_code, 200)
        results = response.json().get('results', response.json())
        self.assertTrue(all(item['process'] == str(self.process_a.id) for item in results))


class AuthAuditTests(BaseTenantTestCase):
    def test_login_creates_audit_event(self):
        from rest_framework.test import APIClient
        client = APIClient()
        response = client.post('/api/auth/login/', {'email': 'adv.a@test.com', 'password': 'x1y2z3!A'}, format='json')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(
            AuditEvent.objects.filter(event_type='auth.login', actor=self.lawyer_a).exists()
        )

    def test_failed_login_creates_audit_event(self):
        from rest_framework.test import APIClient
        client = APIClient()
        response = client.post('/api/auth/login/', {'email': 'adv.a@test.com', 'password': 'errada'}, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue(
            AuditEvent.objects.filter(event_type='auth.login_failed', tenant__isnull=True).exists()
        )
