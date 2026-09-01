# ForgeON Backend

Django + DRF + PostgreSQL backend for the ForgeON Sales & Customer Loyalty MVP.

**Implementation status: Stage 1 – 4 complete. All runtime verification must be performed locally.**

---

## Overview

| Component | Purpose |
|---|---|
| `apps/accounts/` | Custom User model with `admin` / `staff` roles (distinct from Django `is_superuser`) |
| `apps/customers/` | Customer domain — opaque code generation, contact validation |
| `apps/products/` | Product catalogue — soft inactive, price snapshots |
| `apps/sales/` | Sale + SaleItem — soft delete, historical snapshots, denormalized totals |
| `apps/reports/` | Domain placeholder (aggregation is in `services/report_service.py`) |
| `api/v1/` | Versioned REST API — serializers, views, URLs |
| `services/` | Cross-domain business logic: loyalty, sale creation, payment, trash, reports, PDF |
| `config/settings/` | Split settings: base / development / production (env-driven) |

---

## Requirements

- Python 3.11 or 3.12 (recommended)
- PostgreSQL 15+
- Git

---

## Local Setup (must be performed by the developer)

The following commands have NOT been executed in the AI workspace.
They must be run locally after downloading the project.

### 1. Clone / download and enter the backend directory

```bash
cd backend
```

### 2. Create and activate a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate       # macOS / Linux
# .venv\Scripts\activate        # Windows
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials and a secure `DJANGO_SECRET_KEY`.

Minimum required values:

```
DJANGO_SECRET_KEY=your-long-random-secret-here
DJANGO_DEBUG=True
POSTGRES_DB=forgeon
POSTGRES_USER=forgeon_user
POSTGRES_PASSWORD=your-db-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 5. Create the PostgreSQL database

```bash
createdb forgeon
# OR via psql:
# psql -U postgres -c "CREATE DATABASE forgeon;"
# psql -U postgres -c "CREATE USER forgeon_user WITH PASSWORD 'your-db-password';"
# psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE forgeon TO forgeon_user;"
```

### 6. Verify migrations match the models

The initial migration files were authored without a live Python runtime.
Run this check FIRST:

```bash
python manage.py makemigrations --check --dry-run
```

If Django reports any drift, regenerate migrations:

```bash
# Delete only the 0001_initial.py files (keep __init__.py files):
rm apps/accounts/migrations/0001_initial.py
rm apps/customers/migrations/0001_initial.py
rm apps/products/migrations/0001_initial.py
rm apps/sales/migrations/0001_initial.py

# Regenerate:
python manage.py makemigrations accounts customers products sales
```

### 7. Apply migrations

```bash
python manage.py migrate
```

### 8. Run system checks

```bash
python manage.py check
```

### 9. Run the test suite

```bash
python manage.py test
```

Test files:
- `apps/accounts/tests.py` — User model / role tests
- `apps/customers/tests.py` — Customer code / contact rule tests
- `apps/products/tests.py` — Product price constraint tests
- `apps/sales/tests.py` — Sale + SaleItem model tests
- `apps/sales/test_services.py` — Stage 2 business service tests
- `apps/sales/test_stage3.py` — Stage 3 dashboard / reports / PDF tests

### 10. Create an admin user

```bash
python manage.py createsuperuser
```

Then set `role = admin` in Django Admin at http://127.0.0.1:8000/admin/ →
Accounts → Users → your user → ForgeON section.

Alternatively, create users via the shell:

```python
python manage.py shell
from apps.accounts.models import User
User.objects.create_user(username='admin', password='yourpassword', name='Admin User', role='admin', is_staff=True)
User.objects.create_user(username='staff', password='yourpassword', name='Staff User', role='staff')
```

### 11. Start the backend server

```bash
python manage.py runserver
```

Backend is now available at http://127.0.0.1:8000/

Django Admin: http://127.0.0.1:8000/admin/

---

## Frontend Setup

From the project **root directory** (not `backend/`):

```bash
npm install
```

Create a frontend environment file:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

Start the Vite development server:

```bash
npm run dev
```

Frontend is now available at http://localhost:5173/

Build for production:

```bash
npm run build
```

---

## API Endpoints Reference

All endpoints are prefixed with `/api/v1/`.

### Authentication

| Method | Endpoint | Permission |
|---|---|---|
| POST | `/api/v1/auth/login/` | Public |
| POST | `/api/v1/auth/refresh/` | Public |
| GET | `/api/v1/auth/me/` | IsAuthenticated |

### Customers

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/customers/` | IsAuthenticated |
| POST | `/api/v1/customers/` | IsAuthenticated |
| GET | `/api/v1/customers/{id}/` | IsAuthenticated |
| PATCH | `/api/v1/customers/{id}/` | Admin only |
| POST | `/api/v1/customers/{id}/loyalty-preview/` | IsAuthenticated |

### Products

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/products/` | IsAuthenticated |
| GET | `/api/v1/products/categories/` | IsAuthenticated |
| POST | `/api/v1/products/` | Admin only |
| PATCH | `/api/v1/products/{id}/` | Admin only |

### Sales

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/sales/` | IsAuthenticated |
| POST | `/api/v1/sales/` | IsAuthenticated |
| GET | `/api/v1/sales/{id}/` | IsAuthenticated |
| PATCH | `/api/v1/sales/{id}/` | IsAuthenticated |
| POST | `/api/v1/sales/{id}/mark-paid/` | Admin only |
| DELETE | `/api/v1/sales/{id}/` | Admin only (soft delete + required reason) |
| POST | `/api/v1/sales/{id}/restore/` | Admin only |
| GET | `/api/v1/sales/trash/` | Admin only |

### Dashboard

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/dashboard/summary/` | IsAuthenticated |
| GET | `/api/v1/dashboard/pending/` | IsAuthenticated |
| GET | `/api/v1/dashboard/timeseries/` | IsAuthenticated |

### Reports

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/reports/summary/` | IsAuthenticated |
| GET | `/api/v1/reports/timeseries/` | IsAuthenticated |
| GET | `/api/v1/reports/top-products/` | IsAuthenticated |
| GET | `/api/v1/reports/top-customers/` | IsAuthenticated |
| GET | `/api/v1/reports/loyalty/` | IsAuthenticated |
| GET | `/api/v1/reports/export/pdf/` | IsAuthenticated |

### Shared report filter parameters

All report and dashboard endpoints accept:

| Parameter | Description |
|---|---|
| `date_from` | Start date (YYYY-MM-DD) |
| `date_to` | End date (YYYY-MM-DD) |
| `customer` | Customer ID |
| `product` | Product ID |
| `payment_status` | `paid` or `pending` |

---

## Key Business Rules

- **Loyalty:** distinct calendar dates of paid, non-deleted sales. Same-day multiple sales count as one loyalty purchase. Milestones every 10th distinct date.
- **Sale date:** explicit `DateField` in Asia/Kolkata timezone — never derived from `created_at`.
- **Same-day sales:** multiple sales for one customer on the same date are valid separate records.
- **Soft delete:** sales are never physically deleted. `is_deleted=True` + reason + actor + timestamp. Excluded from all analytics.
- **Price snapshots:** SaleItem stores the prices used in the sale. Product price changes do not affect historical sales.
- **Server-side totals:** `total`, `total_cost`, `total_profit` are computed by the sale creation service — never trusted from the client.
- **Staff cannot change payment status** on an existing sale (enforced in `sale_service.update_sale()`).
