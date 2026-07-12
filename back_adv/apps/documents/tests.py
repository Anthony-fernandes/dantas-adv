"""Isolamento multi-tenant de documentos, incluindo o download autenticado.

Um escritório jamais pode listar, ver ou baixar arquivo de outro tenant.
"""
from django.core.files.base import ContentFile
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import AppRole, User, UserRole
from apps.core.models import Tenant
from apps.documents.models import Document


class DocumentTenantIsolationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.tenant_a = Tenant.objects.create(name='Escritorio A', slug='doc-esc-a')
        cls.tenant_b = Tenant.objects.create(name='Escritorio B', slug='doc-esc-b')

        cls.lawyer_a = User.objects.create_user(email='doc.a@test.com', password='x1y2z3!A', username='doc.a@test.com')
        cls.lawyer_b = User.objects.create_user(email='doc.b@test.com', password='x1y2z3!B', username='doc.b@test.com')
        UserRole.objects.create(user=cls.lawyer_a, tenant=cls.tenant_a, role=AppRole.LAWYER)
        UserRole.objects.create(user=cls.lawyer_b, tenant=cls.tenant_b, role=AppRole.LAWYER)

        cls.doc_a = Document.objects.create(tenant=cls.tenant_a, title='Peticao A', category='peticao')
        cls.doc_a.file.save('peticao-a.txt', ContentFile(b'conteudo tenant A'), save=True)
        cls.doc_b = Document.objects.create(tenant=cls.tenant_b, title='Peticao B', category='peticao')
        cls.doc_b.file.save('peticao-b.txt', ContentFile(b'conteudo tenant B'), save=True)

    def client_for(self, user: User, tenant: Tenant) -> APIClient:
        token = str(RefreshToken.for_user(user).access_token)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}', HTTP_X_TENANT_ID=str(tenant.id))
        return client

    def test_list_only_own_tenant_documents(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        resp = client.get('/api/documents/')
        self.assertEqual(resp.status_code, 200)
        payload = resp.json()
        ids = {item['id'] for item in payload.get('results', payload)}
        self.assertIn(str(self.doc_a.id), ids)
        self.assertNotIn(str(self.doc_b.id), ids)

    def test_cannot_retrieve_other_tenant_document(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        resp = client.get(f'/api/documents/{self.doc_b.id}/')
        self.assertEqual(resp.status_code, 404)

    def test_download_own_document(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        resp = client.get(f'/api/documents/{self.doc_a.id}/download/')
        self.assertEqual(resp.status_code, 200)
        content = b''.join(resp.streaming_content)
        self.assertEqual(content, b'conteudo tenant A')

    def test_cannot_download_other_tenant_document(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        resp = client.get(f'/api/documents/{self.doc_b.id}/download/')
        self.assertEqual(resp.status_code, 404)

    def test_download_requires_authentication(self):
        resp = APIClient().get(f'/api/documents/{self.doc_a.id}/download/')
        self.assertIn(resp.status_code, (401, 403))

    def test_serializer_exposes_endpoint_not_media_url(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        resp = client.get(f'/api/documents/{self.doc_a.id}/')
        self.assertEqual(resp.status_code, 200)
        url = resp.json().get('file_download_url') or ''
        self.assertIn(f'/api/documents/{self.doc_a.id}/download/', url)
        self.assertNotIn('/media/', url)
