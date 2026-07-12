"""Isolamento multi-tenant do financeiro (contas a receber)."""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import AppRole, User, UserRole
from apps.core.models import Tenant
from apps.finance.models import AccountsReceivable


class FinanceTenantIsolationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.tenant_a = Tenant.objects.create(name='Escritorio A', slug='fin-esc-a')
        cls.tenant_b = Tenant.objects.create(name='Escritorio B', slug='fin-esc-b')
        cls.fin_a = User.objects.create_user(email='fin.iso.a@test.com', password='x1y2z3!A', username='fin.iso.a@test.com')
        UserRole.objects.create(user=cls.fin_a, tenant=cls.tenant_a, role=AppRole.FINANCE)

        cls.rec_a = AccountsReceivable.objects.create(tenant=cls.tenant_a, description='Honorario A', amount=100, due_date='2026-08-01')
        cls.rec_b = AccountsReceivable.objects.create(tenant=cls.tenant_b, description='Honorario B', amount=200, due_date='2026-08-01')

    def client_for(self, user, tenant):
        token = str(RefreshToken.for_user(user).access_token)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}', HTTP_X_TENANT_ID=str(tenant.id))
        return client

    def test_list_only_own_tenant_receivables(self):
        resp = self.client_for(self.fin_a, self.tenant_a).get('/api/accounts-receivable/')
        self.assertEqual(resp.status_code, 200)
        payload = resp.json()
        ids = {item['id'] for item in payload.get('results', payload)}
        self.assertIn(str(self.rec_a.id), ids)
        self.assertNotIn(str(self.rec_b.id), ids)

    def test_cannot_touch_other_tenant_receivable(self):
        client = self.client_for(self.fin_a, self.tenant_a)
        self.assertEqual(client.get(f'/api/accounts-receivable/{self.rec_b.id}/').status_code, 404)
        self.assertEqual(
            client.patch(f'/api/accounts-receivable/{self.rec_b.id}/', {'amount': 1}, format='json').status_code,
            404,
        )
