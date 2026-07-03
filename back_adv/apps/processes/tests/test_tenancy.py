"""Testes de isolamento multi-tenant e RBAC na API de processos.

Garantem que um escritório jamais enxergue ou altere dados de outro —
requisito central para um SaaS jurídico.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import AppRole, User, UserRole
from apps.core.models import Tenant
from apps.processes.models import Process
from apps.processes.tests.test_cnj import make_cnj


class BaseTenantTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.tenant_a = Tenant.objects.create(name='Escritorio A', slug='escritorio-a')
        cls.tenant_b = Tenant.objects.create(name='Escritorio B', slug='escritorio-b')

        cls.lawyer_a = User.objects.create_user(email='adv.a@test.com', password='x1y2z3!A', username='adv.a@test.com')
        cls.lawyer_b = User.objects.create_user(email='adv.b@test.com', password='x1y2z3!B', username='adv.b@test.com')
        cls.finance_a = User.objects.create_user(email='fin.a@test.com', password='x1y2z3!C', username='fin.a@test.com')

        UserRole.objects.create(user=cls.lawyer_a, tenant=cls.tenant_a, role=AppRole.LAWYER)
        UserRole.objects.create(user=cls.lawyer_b, tenant=cls.tenant_b, role=AppRole.LAWYER)
        UserRole.objects.create(user=cls.finance_a, tenant=cls.tenant_a, role=AppRole.FINANCE)

        cls.process_a = Process.objects.create(tenant=cls.tenant_a, subject='Caso A', plaintiff='Autor A')
        cls.process_b = Process.objects.create(tenant=cls.tenant_b, subject='Caso B', plaintiff='Autor B')

    def client_for(self, user: User, tenant: Tenant) -> APIClient:
        # O middleware de tenancy autentica o JWT diretamente, então o teste
        # usa um token real em vez de force_authenticate.
        token = str(RefreshToken.for_user(user).access_token)
        client = APIClient()
        client.credentials(
            HTTP_AUTHORIZATION=f'Bearer {token}',
            HTTP_X_TENANT_ID=str(tenant.id),
        )
        return client


class TenantIsolationTests(BaseTenantTestCase):
    def test_list_only_returns_own_tenant_processes(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/processes/')
        self.assertEqual(response.status_code, 200)
        ids = {item['id'] for item in response.json().get('results', response.json())}
        self.assertIn(str(self.process_a.id), ids)
        self.assertNotIn(str(self.process_b.id), ids)

    def test_cannot_retrieve_other_tenant_process(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get(f'/api/processes/{self.process_b.id}/')
        self.assertEqual(response.status_code, 404)

    def test_cannot_update_other_tenant_process(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.patch(
            f'/api/processes/{self.process_b.id}/', {'subject': 'invadido'}, format='json'
        )
        self.assertEqual(response.status_code, 404)
        self.process_b.refresh_from_db()
        self.assertEqual(self.process_b.subject, 'Caso B')

    def test_member_of_other_tenant_cannot_use_foreign_tenant_header(self):
        # lawyer_b não tem papel no tenant A
        client = self.client_for(self.lawyer_b, self.tenant_a)
        response = client.get('/api/processes/')
        self.assertIn(response.status_code, (403, 404))


class RbacTests(BaseTenantTestCase):
    def test_finance_role_cannot_access_processes(self):
        client = self.client_for(self.finance_a, self.tenant_a)
        response = client.get('/api/processes/')
        self.assertEqual(response.status_code, 403)

    def test_unauthenticated_rejected(self):
        client = APIClient()
        client.credentials(HTTP_X_TENANT_ID=str(self.tenant_a.id))
        response = client.get('/api/processes/')
        self.assertIn(response.status_code, (401, 403))


class ProcessCnjApiTests(BaseTenantTestCase):
    def test_create_with_valid_cnj_normalizes_format(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        cnj = make_cnj('0001234', '2024', '8', '26', '0100')
        response = client.post('/api/processes/', {'cnj': cnj.replace('-', '').replace('.', ''), 'subject': 'Novo'}, format='json')
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()['cnj'], cnj)

    def test_create_with_invalid_cnj_rejected(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.post('/api/processes/', {'cnj': '0001234-99.2024.8.26.0100', 'subject': 'Ruim'}, format='json')
        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn('cnj', str(body).lower())

    def test_create_without_cnj_allowed(self):
        # Processos administrativos/consultivos podem não ter CNJ
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.post('/api/processes/', {'subject': 'Consultivo'}, format='json')
        self.assertEqual(response.status_code, 201, response.content)
