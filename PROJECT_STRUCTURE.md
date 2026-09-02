# Project Structure

```text
project-root/
├── backend/
│   ├── api/
│   │   └── v1/
│   │       ├── auth/
│   │       │   ├── __init__.py
│   │       │   ├── serializers.py
│   │       │   ├── urls.py
│   │       │   └── views.py
│   │       ├── customers/
│   │       │   ├── __init__.py
│   │       │   ├── serializers.py
│   │       │   ├── urls.py
│   │       │   └── views.py
│   │       ├── dashboard/
│   │       │   ├── __init__.py
│   │       │   ├── serializers.py
│   │       │   ├── urls.py
│   │       │   └── views.py
│   │       ├── products/
│   │       │   ├── __init__.py
│   │       │   ├── serializers.py
│   │       │   ├── urls.py
│   │       │   └── views.py
│   │       ├── reports/
│   │       │   ├── __init__.py
│   │       │   ├── serializers.py
│   │       │   ├── urls.py
│   │       │   └── views.py
│   │       ├── sales/
│   │       │   ├── __init__.py
│   │       │   ├── serializers.py
│   │       │   ├── urls.py
│   │       │   └── views.py
│   │       ├── __init__.py
│   │       ├── permissions.py
│   │       └── urls.py
│   ├── apps/
│   │   ├── accounts/
│   │   │   ├── migrations/
│   │   │   │   ├── __init__.py
│   │   │   │   └── 0001_initial.py
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   └── tests.py
│   │   ├── customers/
│   │   │   ├── migrations/
│   │   │   │   ├── __init__.py
│   │   │   │   └── 0001_initial.py
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── tests.py
│   │   │   └── utils.py
│   │   ├── products/
│   │   │   ├── migrations/
│   │   │   │   ├── __init__.py
│   │   │   │   └── 0001_initial.py
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   └── tests.py
│   │   ├── reports/
│   │   │   ├── __init__.py
│   │   │   ├── apps.py
│   │   │   └── models.py
│   │   ├── sales/
│   │   │   ├── migrations/
│   │   │   │   ├── __init__.py
│   │   │   │   └── 0001_initial.py
│   │   │   ├── __init__.py
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── test_services.py
│   │   │   ├── test_stage3.py
│   │   │   └── tests.py
│   │   └── __init__.py
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── asgi.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── loyalty_service.py
│   │   ├── payment_service.py
│   │   ├── pdf_service.py
│   │   ├── report_service.py
│   │   ├── sale_service.py
│   │   └── trash_service.py
│   ├── db.sqlite3
│   ├── FINAL_STABILIZATION_IMPLEMENTATION_SUMMARY.md
│   ├── manage.py
│   ├── README.md
│   ├── requirements.txt
│   ├── STAGE_2_IMPLEMENTATION_SUMMARY.md
│   ├── STAGE_3_IMPLEMENTATION_SUMMARY.md
│   ├── STAGE_4_IMPLEMENTATION_SUMMARY.md
│   └── TARGETED_FIXES_IMPLEMENTATION_SUMMARY.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── domain/
│   │   │   │   ├── CustomerCard.jsx
│   │   │   │   ├── DeleteSaleModal.jsx
│   │   │   │   ├── LoyaltyCard.jsx
│   │   │   │   ├── PendingPaymentCard.jsx
│   │   │   │   ├── ProductCard.jsx
│   │   │   │   ├── SaleCard.jsx
│   │   │   │   └── SaleDetailSheet.jsx
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.jsx
│   │   │   │   ├── BottomNavigation.jsx
│   │   │   │   ├── DesktopSidebar.jsx
│   │   │   │   ├── Logo.jsx
│   │   │   │   ├── navItems.js
│   │   │   │   ├── PageHeader.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   └── ui/
│   │   │       ├── BarChart.jsx
│   │   │       ├── Button.jsx
│   │   │       ├── Card.jsx
│   │   │       ├── Feedback.jsx
│   │   │       ├── Icon.jsx
│   │   │       ├── Input.jsx
│   │   │       └── Overlay.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── LoginPage.jsx
│   │   │   ├── customers/
│   │   │   │   ├── components/
│   │   │   │   │   └── CustomerForm.jsx
│   │   │   │   ├── CustomerDetailsPage.jsx
│   │   │   │   └── CustomersPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.jsx
│   │   │   ├── more/
│   │   │   │   ├── MorePage.jsx
│   │   │   │   ├── ProfilePage.jsx
│   │   │   │   └── SettingsPage.jsx
│   │   │   ├── products/
│   │   │   │   └── ProductsPage.jsx
│   │   │   ├── reports/
│   │   │   │   └── ReportsPage.jsx
│   │   │   ├── sales/
│   │   │   │   ├── components/
│   │   │   │   │   ├── CustomerSelectSheet.jsx
│   │   │   │   │   ├── ProductSelectSheet.jsx
│   │   │   │   │   └── SaleItemRow.jsx
│   │   │   │   ├── PendingPaymentsPage.jsx
│   │   │   │   ├── SaleDetailsPage.jsx
│   │   │   │   ├── SaleFormPage.jsx
│   │   │   │   └── SalesListPage.jsx
│   │   │   └── trash/
│   │   │       └── TrashPage.jsx
│   │   ├── hooks/
│   │   │   ├── useAsync.js
│   │   │   └── useDebounce.js
│   │   ├── services/
│   │   │   └── api/
│   │   │       ├── auth.js
│   │   │       ├── client.js
│   │   │       ├── customers.js
│   │   │       ├── export.js
│   │   │       ├── index.js
│   │   │       ├── products.js
│   │   │       ├── reports.js
│   │   │       └── sales.js
│   │   ├── utils/
│   │   │   ├── cn.js
│   │   │   ├── date.js
│   │   │   ├── format.js
│   │   │   └── loyalty.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── FORGEON_FRONTEND_IMPLEMENTATION_DOCUMENTATION.md
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── changes.txt
```
