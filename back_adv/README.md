# NimbusLaw — Backend (Django API + Admin)

Backend API skeleton to replace Supabase for the Lovable (Vite/React) frontend.

## What you get
- Django 5 + DRF
- JWT auth (SimpleJWT)
- Multi-tenant data model (Tenant + role assignments)
- Admin ready (Tenant-aware models)
- CRUD APIs for: Clients, Processes, Movements, Deadlines, Hearings, Finance (AR/AP), Invoices, Payments, Notifications, Documents, Contracts, Job Positions

## Quickstart (local)
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt

cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Frontend integration
- Configure Vite app to call this API (instead of Supabase).
- Use JWT access token in `Authorization: Bearer <token>`.

## Environment
See `.env.example`.
