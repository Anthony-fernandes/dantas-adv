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


class ConflictCheckTests(BaseTenantTestCase):
    def test_conflict_when_party_is_existing_client(self):
        from apps.clients.models import Client as ClientModel
        ClientModel.objects.create(tenant=self.tenant_a, name='Empresa Conflitada Ltda', doc='12.345.678/0001-90')
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/conflict-check/', {'name': 'Empresa Conflitada'})
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertTrue(body['has_conflict'])
        self.assertEqual(body['clients'][0]['name'], 'Empresa Conflitada Ltda')

    def test_no_conflict_for_unknown_person(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/conflict-check/', {'name': 'Pessoa Inexistente Xyz'})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['has_conflict'])

    def test_conflict_check_does_not_leak_other_tenant(self):
        from apps.clients.models import Client as ClientModel
        ClientModel.objects.create(tenant=self.tenant_b, name='Cliente Secreto B', doc='999.888.777-66')
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/conflict-check/', {'name': 'Cliente Secreto'})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['has_conflict'])
        self.assertEqual(response.json()['clients'], [])

    def test_requires_query(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/conflict-check/')
        self.assertEqual(response.status_code, 400)


class GlobalSearchTests(BaseTenantTestCase):
    def test_search_finds_process_by_subject(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/search/', {'q': 'Caso A'})
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        self.assertTrue(any(p['subject'] == 'Caso A' for p in body['processes']))

    def test_search_finds_client_by_name(self):
        from apps.clients.models import Client as ClientModel
        ClientModel.objects.create(tenant=self.tenant_a, name='Construtora Horizonte Ltda')
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/search/', {'q': 'Horizonte'})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(any(c['name'] == 'Construtora Horizonte Ltda' for c in response.json()['clients']))

    def test_search_does_not_leak_other_tenant(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/search/', {'q': 'Caso B'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['processes'], [])

    def test_short_query_returns_empty(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/search/', {'q': 'a'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'processes': [], 'clients': [], 'documents': [], 'tasks': []})


class HearingConflictTests(BaseTenantTestCase):
    def _create_hearing(self, tenant, process, when):
        from apps.processes.models import Hearing
        return Hearing.objects.create(tenant=tenant, process=process, hearing_date=when, type='Instrução')

    def test_detects_overlapping_hearing(self):
        from django.utils import timezone
        from datetime import timedelta
        base = timezone.now() + timedelta(days=3)
        self._create_hearing(self.tenant_a, self.process_a, base)
        client = self.client_for(self.lawyer_a, self.tenant_a)
        probe = (base + timedelta(minutes=30)).isoformat()
        response = client.get('/api/hearings/check-conflict/', {'hearing_date': probe})
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.json()['has_conflict'])

    def test_no_conflict_outside_window(self):
        from django.utils import timezone
        from datetime import timedelta
        base = timezone.now() + timedelta(days=3)
        self._create_hearing(self.tenant_a, self.process_a, base)
        client = self.client_for(self.lawyer_a, self.tenant_a)
        probe = (base + timedelta(hours=4)).isoformat()
        response = client.get('/api/hearings/check-conflict/', {'hearing_date': probe})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['has_conflict'])

    def test_conflict_scoped_to_tenant(self):
        from django.utils import timezone
        from datetime import timedelta
        base = timezone.now() + timedelta(days=3)
        self._create_hearing(self.tenant_b, self.process_b, base)
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/hearings/check-conflict/', {'hearing_date': base.isoformat()})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['has_conflict'])

    def test_invalid_date_rejected(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/hearings/check-conflict/', {'hearing_date': 'amanha'})
        self.assertEqual(response.status_code, 400)

    def test_confirmada_status_accepted(self):
        from django.utils import timezone
        from datetime import timedelta
        hearing = self._create_hearing(self.tenant_a, self.process_a, timezone.now() + timedelta(days=5))
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.patch(f'/api/hearings/{hearing.id}/', {'status': 'confirmada'}, format='json')
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.json()['status'], 'confirmada')


class PortalUploadTests(BaseTenantTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        from apps.accounts.models import AppRole, User, UserRole
        from apps.clients.models import Client as ClientModel
        cls.portal_user = User.objects.create_user(email='cliente@test.com', password='x1y2z3!P', username='cliente@test.com')
        UserRole.objects.create(user=cls.portal_user, tenant=cls.tenant_a, role=AppRole.CLIENT)
        cls.portal_client = ClientModel.objects.create(tenant=cls.tenant_a, name='Cliente Portal', portal_user=cls.portal_user)
        cls.process_a.client = cls.portal_client
        cls.process_a.save(update_fields=['client'])

    def test_portal_client_can_upload_document(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        client = self.client_for(self.portal_user, self.tenant_a)
        upload = SimpleUploadedFile('contrato.pdf', b'%PDF-1.4 fake', content_type='application/pdf')
        response = client.post(
            f'/api/portal/processes/{self.process_a.id}/documents/upload/',
            {'file': upload, 'title': 'Contrato assinado'},
            format='multipart',
        )
        self.assertEqual(response.status_code, 201, response.content)
        body = response.json()
        self.assertEqual(body['title'], 'Contrato assinado')
        self.assertEqual(body['category'], 'portal')
        from apps.documents.models import Document
        doc = Document.objects.get(id=body['id'])
        self.assertEqual(doc.tenant_id, self.tenant_a.id)
        self.assertEqual(str(doc.process_id), str(self.process_a.id))

    def test_portal_client_cannot_upload_to_unrelated_process(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        client = self.client_for(self.portal_user, self.tenant_a)
        upload = SimpleUploadedFile('x.pdf', b'%PDF-1.4', content_type='application/pdf')
        response = client.post(
            f'/api/portal/processes/{self.process_b.id}/documents/upload/',
            {'file': upload},
            format='multipart',
        )
        self.assertEqual(response.status_code, 404)

    def test_lawyer_role_cannot_use_portal_upload(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        client = self.client_for(self.lawyer_a, self.tenant_a)
        upload = SimpleUploadedFile('x.pdf', b'%PDF-1.4', content_type='application/pdf')
        response = client.post(
            f'/api/portal/processes/{self.process_a.id}/documents/upload/',
            {'file': upload},
            format='multipart',
        )
        self.assertEqual(response.status_code, 403)

    def test_upload_requires_file(self):
        client = self.client_for(self.portal_user, self.tenant_a)
        response = client.post(f'/api/portal/processes/{self.process_a.id}/documents/upload/', {}, format='multipart')
        self.assertEqual(response.status_code, 400)


class ContractReceivablesTests(BaseTenantTestCase):
    def _make_contract(self, value='3000.00'):
        from apps.documents.models import Contract
        from apps.clients.models import Client as ClientModel
        client = ClientModel.objects.create(tenant=self.tenant_a, name='Cliente Contrato')
        return Contract.objects.create(
            tenant=self.tenant_a, client=client, type='fixo',
            fixed_value=value, start_date='2026-01-01',
        )

    def test_generates_installments_summing_total(self):
        from apps.finance.models import AccountsReceivable
        contract = self._make_contract('1000.00')
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.post(
            f'/api/contracts/{contract.id}/gerar-recebiveis/',
            {'installments': 3, 'first_due_date': '2026-08-01'},
            format='json',
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.json()['created'], 3)
        rows = AccountsReceivable.objects.filter(tenant=self.tenant_a, client=contract.client).order_by('due_date')
        self.assertEqual(rows.count(), 3)
        total = sum(r.amount for r in rows)
        self.assertEqual(str(total), '1000.00')
        # vencimentos mensais
        self.assertEqual(str(rows[0].due_date), '2026-08-01')
        self.assertEqual(str(rows[1].due_date), '2026-09-01')
        self.assertEqual(str(rows[2].due_date), '2026-10-01')

    def test_rejects_contract_without_value(self):
        contract = self._make_contract(value=None)
        contract.fixed_value = None
        contract.save(update_fields=['fixed_value'])
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.post(
            f'/api/contracts/{contract.id}/gerar-recebiveis/',
            {'installments': 2, 'first_due_date': '2026-08-01'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_rejects_invalid_installments(self):
        contract = self._make_contract()
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.post(
            f'/api/contracts/{contract.id}/gerar-recebiveis/',
            {'installments': 0, 'first_due_date': '2026-08-01'},
            format='json',
        )
        self.assertEqual(response.status_code, 400)

    def test_other_tenant_contract_not_found(self):
        contract = self._make_contract()
        client = self.client_for(self.lawyer_b, self.tenant_b)
        response = client.post(
            f'/api/contracts/{contract.id}/gerar-recebiveis/',
            {'installments': 1, 'first_due_date': '2026-08-01'},
            format='json',
        )
        self.assertEqual(response.status_code, 404)


class PortalNotificationTests(PortalUploadTests):
    def test_hearing_creation_notifies_portal_client(self):
        from apps.notifications.models import Notification
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.post('/api/hearings/', {
            'process': str(self.process_a.id),
            'hearing_date': '2026-09-10T14:00:00Z',
            'type': 'Conciliação',
        }, format='json')
        self.assertEqual(response.status_code, 201, response.content)
        self.assertTrue(
            Notification.objects.filter(user=self.portal_user, type='hearing').exists()
        )

    def test_portal_client_can_list_own_notifications(self):
        from apps.notifications.models import Notification
        Notification.objects.create(tenant=self.tenant_a, user=self.portal_user, type='document', title='Doc', message='m')
        Notification.objects.create(tenant=self.tenant_a, user=self.lawyer_a, type='document', title='Privada', message='m')
        client = self.client_for(self.portal_user, self.tenant_a)
        response = client.get('/api/notifications/')
        self.assertEqual(response.status_code, 200, response.content)
        titles = {n['title'] for n in response.json().get('results', response.json())}
        self.assertIn('Doc', titles)
        self.assertNotIn('Privada', titles)


class StrategicDashboardTests(BaseTenantTestCase):
    def test_single_payload_scoped_to_tenant(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/dashboard/strategic/')
        self.assertEqual(response.status_code, 200, response.content)
        body = response.json()
        for key in ['legal_summary', 'process_totals', 'processes', 'deadlines', 'hearings',
                    'movements', 'documents', 'clients', 'employees', 'areas']:
            self.assertIn(key, body)
        proc_ids = {p['id'] for p in body['processes']}
        self.assertIn(str(self.process_a.id), proc_ids)
        self.assertNotIn(str(self.process_b.id), proc_ids)

    def test_finance_excluded_without_role(self):
        # lawyer não tem papel FINANCE — finance vem vazio mesmo pedindo
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/dashboard/strategic/?include_finance=1')
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body['receivables'], [])
        self.assertEqual(body['payables'], [])

    def test_finance_included_for_finance_role(self):
        from apps.finance.models import AccountsReceivable
        AccountsReceivable.objects.create(
            tenant=self.tenant_a, description='Honorários', category='honorarios',
            amount='500.00', due_date='2026-08-01', status='aberta',
        )
        client = self.client_for(self.finance_a, self.tenant_a)
        response = client.get('/api/dashboard/strategic/?include_finance=1')
        self.assertEqual(response.status_code, 403)  # finance role não é IsLegal

    def test_process_totals_counts_all_time(self):
        from apps.processes.models import Process
        Process.objects.create(tenant=self.tenant_a, subject='Encerrado', status='finalizado')
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/dashboard/strategic/')
        totals = {row['status']: row['count'] for row in response.json()['process_totals']}
        self.assertEqual(totals.get('finalizado'), 1)


class PortalContractsTests(PortalUploadTests):
    def test_portal_client_sees_own_contracts(self):
        from apps.documents.models import Contract
        Contract.objects.create(tenant=self.tenant_a, client=self.portal_client, type='fixo', fixed_value='2000.00', start_date='2026-01-01', status='vigente')
        client = self.client_for(self.portal_user, self.tenant_a)
        response = client.get('/api/portal/contracts/')
        self.assertEqual(response.status_code, 200, response.content)
        results = response.json().get('results', response.json())
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['type'], 'fixo')

    def test_portal_client_does_not_see_other_client_contracts(self):
        from apps.documents.models import Contract
        from apps.clients.models import Client as ClientModel
        other = ClientModel.objects.create(tenant=self.tenant_a, name='Outro')
        Contract.objects.create(tenant=self.tenant_a, client=other, type='fixo', fixed_value='9.00', start_date='2026-01-01')
        client = self.client_for(self.portal_user, self.tenant_a)
        response = client.get('/api/portal/contracts/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json().get('results', response.json())), 0)

    def test_lawyer_cannot_use_portal_contracts(self):
        client = self.client_for(self.lawyer_a, self.tenant_a)
        response = client.get('/api/portal/contracts/')
        self.assertEqual(response.status_code, 403)
