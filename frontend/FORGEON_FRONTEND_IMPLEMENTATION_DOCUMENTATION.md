# ForgeON — Frontend Implementation Documentation

**Project:** ForgeON — Company Sales & Customer Loyalty Management System
**Layer documented:** Frontend only (React + Vite + JavaScript)
**Backend:** Not connected. Django / DRF / PostgreSQL / JWT will be built separately and will become the production source of truth.
**Stage:** Frontend MVP → API-ready → running on isolated mock data.

> This document describes the **actual current codebase**, including the Final MVP Gap Fix applied in the changelog at the end. Where something is missing, partial, or differs from the master prompt, it is stated explicitly (sections **P** and **Q**).

---

# A. PROJECT STATUS

## A.1 Current status

Runnable, feature-complete frontend MVP. All screens work against an isolated mock adapter because `VITE_API_BASE_URL` is unset; the Axios service layer switches to the real API the moment it is set.

Production build verified: `npm run build` → 154 modules, single-file `dist/index.html` ≈ 471 kB (≈ 138 kB gzip), no errors.

## A.2 Fully implemented

- Dark/light theme from one CSS-variable token set, persisted.
- Mock JWT-style auth, protected routes, role-aware UI (Admin / Staff).
- App shell: mobile bottom navigation (`Home | Sales | + Sale | Reports | More`) + desktop sidebar.
- Dashboard: Payment Pending (horizontal cards → bottom sheet), Today's Summary, Sales Overview with compact period stepper + bar chart, Loyalty Milestones.
- Sales: list (search, filter sheet, mobile cards, desktop table), details, create, edit, pending payments screen.
- Create Sale: customer sheet (recent + live search + inline create), loyalty card, product sheet (search + category chips), quantity controls, per-sale price editing, price validation, payment checkbox, totals, sticky save bar.
- Customers: list/search, create, details with counters + loyalty progress + history, **Admin edit**.
- Products: list, search, category chips, Admin create/edit/mark-inactive.
- Reports: quick ranges, summary cards, chart, top products, top customers, **customer filter**, **product filter**, payment filter, sort, search, sales list, Export PDF entry point.
- Trash: Admin-only deleted sales with reason/deleted-by/date, restore with confirmation.
- More hub, Profile, Settings (theme, API environment, mock reset).
- Loading skeletons, empty states, error states with retry, toasts, confirmation modals, inline validation.
- **Opaque non-sequential customer codes (`FO-XXXX`)** with a single generation path.
- **Loyalty by distinct paid calendar dates**, with no same-day warnings or merging.
- **Staff cannot change payment status when editing a sale.**

## A.3 Partially implemented

| Area | Exists | Missing |
| --- | --- | --- |
| PDF export | Button, loading state, service function, real blob-download path | No file is produced in mock mode; returns `{ pending: true }` + info toast |
| Auth | Login, logout, token + user in localStorage, role map, protected routes | No token verification on boot, no refresh rotation, no forced logout on 401. `authApi.me()` exists but is never called |
| Chart data | Week / Month / Year buckets are real aggregates and honour customer/product filters | "Today" buckets are a synthetic distribution (mock sales have no hourly timestamps); custom date ranges fall back to month buckets |
| Customer management | Create, read, search, **Admin edit** | No deletion/deactivation (deliberately out of scope) |

## A.4 Not implemented

Real backend, JWT verification, automated tests, pagination/virtualisation, offline/PWA, notifications, messaging, inventory/stock/suppliers, discounts/coupons/rewards, refunds. Inter is referenced in the font stack but **not bundled**. There is no `assets/`, `layouts/`, `pages/` or `styles/` folder.

## A.5 Known issues

1. **Deleted sales are readable by direct URL** (`/#/sales/:id`) by any authenticated user; only Restore is Admin-gated.
2. **401 does not force logout in the UI** — the interceptor clears the token but the in-memory session continues until reload.
3. **Reports "Custom" chip** only opens the filter sheet; the range becomes custom when selected inside the sheet.
4. **Rolling, not calendar, periods** — Week = last 7 days, Month = last 30 days, Year = last 365 days.
5. **Sales list defaults to "This Month"**, hiding older sales until the filter is changed.
6. Mock data lives in `localStorage` per browser.
7. The Reports **product filter dropdown lists inactive products for both roles** (intentional, so historical reports can filter a discontinued product) even though Staff cannot see inactive products on the Products screen.
8. Unused-but-intentional service methods kept for backend integration: `authApi.me`, `customersApi.loyalty`.

---

# B. TECHNOLOGY STACK

## Dependencies (from `package.json`)

| Package | Version | Purpose |
| --- | --- | --- |
| `react` | 19.2.6 | UI library, function components + hooks only |
| `react-dom` | 19.2.6 | `createRoot`; `createPortal` for sheets/modals |
| `react-router-dom` | ^7.18.2 | Routing — **`HashRouter`**, nested layout route, guards |
| `axios` | ^1.19.0 | Single HTTP client with interceptors, prepared for DRF + JWT |
| `clsx` | 2.1.1 | Conditional class names |
| `tailwind-merge` | 3.4.0 | Conflict-safe Tailwind merging (`utils/cn.js`) |

## Dev dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| `vite` | 7.3.2 | Dev server + build |
| `@vitejs/plugin-react` | 5.1.1 | React fast refresh / JSX |
| `tailwindcss` + `@tailwindcss/vite` | 4.1.17 | Styling. Tailwind **v4 configured in CSS** — there is no `tailwind.config.js` |
| `vite-plugin-singlefile` | 2.3.0 | Inlines JS+CSS into one `dist/index.html` (reason for HashRouter) |
| `typescript`, `@types/*` | 5.9.3 | **Starter leftovers.** Only `vite.config.ts` is TypeScript; no app source is TS and the build does not type-check |

## JavaScript usage

All application code is plain JavaScript (`.js` / `.jsx`). No TypeScript in `src/`. No Redux, Zustand, React Query, GraphQL, charting library, icon package or UI kit — icons are an inline SVG path map and the chart is a hand-written flex bar chart.

---

# C. FOLDER STRUCTURE

```
.
├── .env.example
├── FORGEON_FRONTEND_IMPLEMENTATION_DOCUMENTATION.md
├── index.html
├── package.json
├── tsconfig.json                     (starter leftover, unused by app code)
├── vite.config.ts                    (react + tailwind + singlefile, "@" → /src)
└── src
    ├── App.jsx                       Providers + all routes
    ├── main.jsx                      Entry
    ├── index.css                     Design tokens (light + dark) + Tailwind theme map + motion
    ├── components
    │   ├── domain                    CustomerCard, DeleteSaleModal, LoyaltyCard,
    │   │                             PendingPaymentCard, ProductCard, SaleCard, SaleDetailSheet
    │   ├── layout                    AppShell, BottomNavigation, DesktopSidebar, Logo,
    │   │                             PageHeader, ProtectedRoute (+AdminRoute), navItems.js
    │   └── ui                        BarChart, Button(+IconButton,Spinner), Card(+SectionHeader,
    │                                 LinkAction), Feedback(StatusBadge, Skeleton, LoadingState,
    │                                 EmptyState, ErrorState, InlineError), Icon,
    │                                 Input(Field, Input, Textarea, Select, SearchInput, Checkbox),
    │                                 Overlay(BottomSheet, Modal, ConfirmModal)
    ├── context                       AuthContext, ThemeContext, ToastContext
    ├── features
    │   ├── auth/LoginPage.jsx
    │   ├── customers
    │   │   ├── CustomerDetailsPage.jsx
    │   │   ├── CustomersPage.jsx
    │   │   └── components/CustomerForm.jsx     ← shared create + Admin edit form
    │   ├── dashboard/DashboardPage.jsx
    │   ├── more/{MorePage,ProfilePage,SettingsPage}.jsx
    │   ├── products/ProductsPage.jsx           (ProductFormSheet lives in the same file)
    │   ├── reports/ReportsPage.jsx
    │   ├── sales
    │   │   ├── PendingPaymentsPage.jsx
    │   │   ├── SaleDetailsPage.jsx
    │   │   ├── SaleFormPage.jsx                (create + edit via `mode` prop)
    │   │   ├── SalesListPage.jsx
    │   │   └── components/{CustomerSelectSheet,ProductSelectSheet,SaleItemRow}.jsx
    │   └── trash/TrashPage.jsx
    ├── hooks                         useAsync.js, useDebounce.js
    ├── mock                          seed.js, mockApi.js       ← isolated fake backend
    ├── services/api                  client.js, auth.js, customers.js, products.js,
    │                                 sales.js, reports.js, export.js, index.js
    └── utils                         cn.js, date.js, format.js, loyalty.js
```

Purposes: `features/` = screens (own their fetching via `useAsync`, never call Axios directly) · `components/ui` = presentation primitives · `components/domain` = entity-aware reusable pieces · `components/layout` = shell/nav/guards · `context/` = auth, theme, toast · `services/api` = the only Axios usage · `mock/` = the only business simulation · `utils/` = pure helpers · `src/index.css` = the single stylesheet.

---

# D. FINAL UI/UX DECISIONS (approved baseline — unchanged)

- **Theme:** dark default and primary; light re-maps the same tokens. Components contain no theme-specific classes.
- **Colour:** black background `#0A0A0B` → charcoal surfaces `#131316`/`#1B1B20` → elevated `#1F1F25`; off-white text; orange accent (`#FF6A1A` dark / `#E2590A` light) reserved for primary actions, active nav, milestones and brand; green = paid, amber = pending, red = destructive (restrained).
- **Typography:** Inter-first stack, tight heading tracking, `.tnum` tabular numerals on every money/metric value.
- **Navigation:** bottom bar with prominent orange **“+ Sale”** pill; Customers / Products / Trash / Profile / Settings in the **More** hub; desktop sidebar replaces the bottom bar at `lg`.
- **Dashboard order:** Payment Pending → Today's Summary → Sales Overview → Loyalty. Only the pending section scrolls horizontally. Pending taps open a bottom sheet, never a navigation.
- **Create Sale:** single scrolling screen, sticky SAVE SALE bar, collapsed price editing labelled “prices used in this sale”.
- **Overlay strategy:** bottom sheets for selection/filters/quick views/forms; modals for destructive confirmation; dedicated screens for details/reports/management.
- **Motion:** four short keyframes (140–180 ms), disabled under `prefers-reduced-motion`.

Nothing in this section was changed by the gap fix.

---

# E. COMPLETE SCREEN INVENTORY

Hash routes, e.g. `/#/sales`.

| # | Screen | Route | Purpose | Key actions | Role differences | Entry point |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Login | `/login` | Mock JWT sign-in | Login, theme toggle | None | Redirect from protected routes |
| 2 | Dashboard | `/` | Daily operations | Open pending sale sheet, Mark as Paid, change period, open customer | Mark as Paid = Admin | Bottom nav Home / sidebar |
| 3 | Sales list | `/sales` | Browse/search/filter sales | Search, filter sheet, open sale | None | Bottom nav Sales / sidebar |
| 4 | Create Sale | `/sales/new` | Record a sale | Select/create customer, add products, edit sale prices, payment, Save | None | “+ Sale” pill, sidebar, CTAs |
| 5 | Edit Sale | `/sales/:id/edit` | Amend a sale | Same as create, Update | **Payment status read-only for Staff** | Sale details “Edit” |
| 4b | Create Sale (direct from customer) | `/sales/new` with router state `{ customerId }` | Create a sale for an already-open customer | Products, quantity, pricing, payment, Save (customer preselected) | None | **Customer Details → top “+” icon** |
| 6 | Sale details | `/sales/:id` | Historical record | Edit, Mark Paid, Delete, Restore | Mark Paid / Delete / Restore = Admin | Sale cards, table rows, sheet |
| 7 | Pending payments | `/sales/pending` | All pending sales | Open sheet, Mark as Paid | Mark as Paid = Admin | Dashboard “View all →” |
| 8 | Customers | `/customers` | Search + create customers | Search, create, open customer | Create allowed for both | More hub / sidebar |
| 9 | Customer details | `/customers/:id` | Profile, loyalty, history | Open sale, new sale, **Edit customer** | **Edit = Admin only** | Customer list, loyalty lists |
| 10 | Products | `/products` | Catalogue | Search, category filter, create/edit/inactive | Management = Admin; Staff read-only | More hub / sidebar |
| 11 | Reports | `/reports` | Period analysis + export | Ranges, **customer/product filters**, payment, sort, search, Export PDF | None | Bottom nav Reports / sidebar |
| 12 | Trash | `/trash` | Deleted sales | View details, Restore | **Admin only** (guard screen for Staff) | More hub / sidebar (Admin) |
| 13 | More | `/more` | Mobile module hub | Navigate, theme, logout | Trash tile Admin-only | Bottom nav More |
| 14 | Profile | `/profile` | Account + capabilities | Logout | Capability list differs | More hub |
| 15 | Settings | `/settings` | Theme, API env, mock reset | Set theme, reset mock data | None | More hub / sidebar |

Mobile behaviour is card-based with bottom sheets throughout; desktop adds the sidebar, a sales table, and 2–4 column grids (see **L**).

---

# F. COMPONENT ARCHITECTURE

**UI primitives:** `Button`/`IconButton`/`Spinner` (7 variants, 3 sizes, built-in `loading` + `loadingText`), `Field`/`Input`/`Textarea`/`Select`/`SearchInput`/`Checkbox`, `Card`/`SectionHeader`/`LinkAction`, `StatusBadge` (paid/pending/deleted/accent/neutral), `Skeleton`/`LoadingState`/`EmptyState`/`ErrorState`/`InlineError`, `BottomSheet`/`Modal`/`ConfirmModal` (portal, scroll lock, Escape, `data-autofocus`, focus restore), `Icon`, `BarChart`.

**Layout:** `AppShell`, `BottomNavigation`, `DesktopSidebar`, `PageHeader` (sticky, optional back), `Logo`, `ProtectedRoute` + `AdminRoute`, `navItems.js` (single source of truth for all three nav surfaces).

**Domain:** `SaleCard` (`showCustomer={false}` variant leads with the date), `CustomerCard`, `ProductCard`, `PendingPaymentCard`, `LoyaltyCard`, `SaleDetailSheet` (quick view + Admin Mark as Paid), `DeleteSaleModal` (confirmation + required reason).

**Feature-local:** `CustomerSelectSheet`, `ProductSelectSheet`, `SaleItemRow`, and **`features/customers/components/CustomerForm.jsx`** — one form used for customer creation (Customers screen and inside Create Sale) *and* Admin editing. It renders the `FO-` code read-only in edit mode.

Convention: components never call Axios; only `SettingsPage` imports from `src/mock/`.

---

# G. STATE MANAGEMENT

- **AuthContext** — `user`, `booting`, `login`, `logout`, `isAuthenticated`, `isAdmin`, `isStaff`, and a `can` map (`markPaid`, `deleteSale`, `restoreSale`, `manageProducts`, `editCustomer`, `viewTrash`). Token + cached user in `localStorage`; the cached user is trusted on boot.
- **ThemeContext** — `theme`, `setTheme`, `toggleTheme`; toggles `.dark` on `<html>`; persisted.
- **ToastContext** — `success/error/info`, auto-dismiss 3.2 s, tap to dismiss, top-centre stack.
- **Server data** — `useAsync(fn, deps)` → `{ data, loading, error, reload, setData }`; mutations call a service then `reload()`.
- **Sale form** — local `useState` (`customer`, `items[]`, `date`, `paymentDone`, sheet booleans, `saving`, `formError`); totals via `useMemo`; drafts are not persisted.
- **Reports** — local `range`, `custom`, `status`, `sort`, `customerId`, `productId`, `query`; all report queries share one `scope` object and one `scopeDeps` array.
- **Overlays** — local booleans / selected-entity objects.
- **Persistent keys:** `forgeon.theme`, `forgeon.auth.token`, `forgeon.auth.user`, **`forgeon.mockdb.v2`**.

---

# H. AXIOS / API ARCHITECTURE

`src/services/api/client.js`:

```js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const USE_MOCK = !API_BASE_URL;
export const apiClient = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });
```

- **Request interceptor:** attaches `Authorization: Bearer <token>` from `localStorage`.
- **Response interceptor:** clears the token on 401 (no redirect/refresh yet).
- **`toUserMessage(error, fallback)`** normalises mock errors, `detail`, DRF field-error objects and timeouts into short user-safe strings.
- **Switch:** every service function is `if (USE_MOCK) return mock…; else await apiClient…` and unwraps `data.results ?? data`.

> Endpoint paths below are **proposals written into the code**, not an agreed contract. Adjust the service files if the backend chooses different URLs.

| Service | Methods → proposed endpoints |
| --- | --- |
| `auth.js` | `login` → `POST /api/auth/login/`; `me` → `GET /api/auth/me/` *(unused)*; `logout` (client-side) |
| `customers.js` | `list` → `GET /api/customers/?search=&limit=`; `get`; `create`; **`update` → `PATCH /api/customers/:id/` (now used by Admin edit)**; `loyalty` *(unused)* |
| `products.js` | `list` → `?search=&category=&include_inactive=`; `categories`; `create`; `update`; `setActive` |
| `sales.js` | `list` → `?search=&date_from=&date_to=&payment_status=&customer=&**product**=&ordering=`; `get`; `create`; `update`; `markPaid` → `POST /api/sales/:id/mark-paid/`; `softDelete` → `DELETE /api/sales/:id/` body `{ reason }`; `restore` → `POST /api/sales/:id/restore/`; `trash`; `pending` |
| `reports.js` | `summary`, `timeseries`, `topProducts`, `topCustomers`, `loyaltyOverview` — all now accept **`customer` and `product`** scope params via a shared `scopeParams()` helper |
| `export.js` | `exportSalesReportPdf` → `GET /api/reports/export/pdf/` (blob). **Placeholder in mock mode** |

**Field shapes the UI expects** (DRF serializers must provide, camelCase): Sale `{id,date,paymentStatus,customerId,customerName,customerCode,customerPhone,items[{productId,productName,unit,quantity,costPrice,sellingPrice}],total,cost,profit,purchaseNumber,isMilestone,createdBy}` (+ `deleted,deleteReason,deletedBy,deletedAt` in trash) · Customer `{id,code,name,phone,whatsapp,place,address,email,paidPurchases,nextMilestone,totalPurchases,totalSpent,pendingAmount,lastPurchaseDate}` · Product `{id,name,category,description,unit,costPrice,sellingPrice,active}` · Summary `{salesCount,totalSales,totalCost,totalProfit,paidAmount,pendingAmount,pendingCount,customers}` · Timeseries `[{label,value}]`.

---

# I. MOCK DATA ARCHITECTURE

- **`src/mock/seed.js`** — 2 users (`admin/admin123` → Admin “Ajmal Nihad”; `staff/staff123` → Staff “Rahul K”), 8 customers with **opaque codes** (`FO-A901`, `FO-K7M2`, `FO-X4P8`, `FO-Q9NC`, `FO-7BXA`, `FO-M2RK`, `FO-D3VP`, `FO-T8JW`), 9 products (one inactive), 25 sales (paid, pending, one soft-deleted with a reason). Dates are generated relative to today.
- **`src/mock/mockApi.js`** — the fake backend: 260 ms latency, `structuredClone` on every read, validation errors shaped like DRF (`{ isApiError, status }`), and `localStorage` persistence under **`forgeon.mockdb.v2`** (the key was bumped from v1 because customer codes changed). `resetMockData()` restores the seed.
- **Simulated rules:** selling ≥ cost, customer required fields, sale validation, payment default paid, distinct-date loyalty, soft-delete exclusion, report aggregation with customer/product scoping, opaque code generation.
- **Derived on read (never stored):** `total`, `cost`, `profit`, `customerName`, `customerCode`, `customerPhone`, `purchaseNumber`, `isMilestone`, `paidPurchases`, `nextMilestone`, `totalSpent`, `pendingAmount`.

**Must be replaced by the backend:** both mock files, the `USE_MOCK` branches, the Settings mock-reset card, and the login credential hint (auto-hidden when `USE_MOCK` is false).

---

# J. BUSINESS RULES REPRESENTED IN THE UI

Backend remains authoritative; these are the UI/mock representations.

1. **Same-day sales are separate records.** Multiple sales for one customer on one calendar date are all saved individually. There is **no** duplicate warning, no blocking, no confirmation, no merging, and no end-of-day rewriting. Verified by search: no such code exists.
2. **Loyalty = distinct paid calendar dates** (see **M**).
3. **Payment:** “Payment Done” checked by default; unchecking still saves the sale as *Payment Pending*; pending sales are visible to both roles; only Admin can mark them Paid; marking paid preserves the original sale date.
3b. **Loyalty preview:** the Create/Edit Sale preview adds one purchase only when the sale will be paid **and** the selected date is not already represented by another active paid sale for that customer (see **M.7**).
4. **Pricing:** product selection seeds the latest saved cost/selling price; edits apply to that sale only under the label “prices used in this sale”, with the current catalogue price shown separately; `selling < cost` blocks saving with an inline error and disables SAVE (re-validated in the mock).
5. **Sale delete:** Admin only — Delete → confirmation → **required reason** → soft delete → Trash; excluded from lists, history, reports and loyalty; visibly faded; restorable.
6. **Product delete:** inactive/soft-delete only; historical sales keep their own product name, unit and prices.
7. **Customer code:** opaque, non-sequential, immutable after creation (see **N**).
8. **No rewards system:** no points, coupons, redemption, expiry or tiers anywhere.

---

# K. ADMIN vs STAFF

| Feature | Admin | Staff | UI enforcement |
| --- | --- | --- | --- |
| View Dashboard | ✅ | ✅ | — |
| View Sales / Sale details | ✅ | ✅ | — |
| Create Sale | ✅ | ✅ | — |
| Create Sale as Payment Pending | ✅ | ✅ | Approved behaviour |
| Edit Sale (customer, date, products, prices) | ✅ | ✅ | — |
| **Change payment status while editing a sale** | ✅ | ❌ **read-only badge** | `canEditPayment = mode === "create" \|\| isAdmin`; payment fields omitted from the Staff update payload |
| Mark payment as Paid | ✅ | ❌ hidden | `can.markPaid` in `SaleDetailSheet` + `SaleDetailsPage` |
| Delete Sale (reason required) | ✅ | ❌ hidden | `can.deleteSale` |
| Restore Sale | ✅ | ❌ hidden | `can.restoreSale`, `/trash` guarded |
| Access Trash | ✅ | ❌ blocked | `AdminRoute` renders “Admin access required” |
| Search / view Customers | ✅ | ✅ | — |
| Create Customer (screen or during sale) | ✅ | ✅ | Not gated (approved: Staff may create) |
| **Edit existing Customer** | ✅ | ❌ hidden | `can.editCustomer` on Customer details |
| View Products | ✅ | ✅ | — |
| Create / edit / deactivate Product | ✅ | ❌ hidden | `can.manageProducts` |
| See inactive Products (Products screen) | ✅ | ❌ | `includeInactive` not requested for Staff |
| Reports + all filters + Export PDF | ✅ | ✅ | Not role-gated |

**Security statement:** every check above is a UX affordance only. Hidden buttons remain reachable by editing local state or calling the API directly. **Django/DRF must enforce all of these server-side**, especially mark-paid, delete, restore, product writes, customer updates, and the `paymentStatus` field on sale updates.

**Role switcher:** none exists. Roles come only from the mock login credentials (`admin` / `staff`), which is isolated behind `USE_MOCK` and disappears when a real backend is configured.

---

# L. RESPONSIVE DESIGN

Tailwind defaults; the meaningful switch is `lg` (1024 px). `sm` (640 px) is used for sheet centring and label visibility.

- **Mobile (< 640 px):** single column, cards, bottom navigation, bottom sheets, sticky save bar at `bottom-[64px]` with `env(safe-area-inset-bottom)`, horizontal scroll only for pending cards / category chips / range chips, touch targets 44–52 px, `truncate` + `min-w-0` everywhere for long names.
- **Tablet (640–1023 px):** same shell; sheets become centred `max-w-lg`; 2-column stat grids; header labels appear.
- **Desktop (≥ 1024 px):** bottom nav hidden, 256 px sidebar, content `max-w-6xl` with `lg:pl-64`; sales list becomes a table; pending becomes a 3-column grid; summary cards 4 columns; sticky bar becomes `bottom-0 left-64`.

---

# M. LOYALTY IMPLEMENTATION

## M.1 The rule (explicit)

**Multiple sales for the same customer on the same calendar day are valid, separate sale records. However, one customer + one calendar date = one loyalty purchase.** Loyalty is counted from **distinct calendar dates of valid, paid, non-deleted sales**. No duplicate-sale warning is shown and no sale records are ever merged.

Worked example (matches the mock implementation):

```
Aug 28 — Sale 1 — Paid
Aug 28 — Sale 2 — Paid
Aug 28 — Sale 3 — Paid
Aug 29 — Sale 4 — Paid
Aug 30 — Sale 5 — Paid
→ 5 sale records, loyalty purchases = 3
```

## M.2 Single calculation path

`src/mock/mockApi.js`:

```js
function paidDates(customerId, excludeSaleId) {   // the ONLY loyalty counting path
  const dates = db.sales
    .filter(s => s.customerId === customerId && !s.deleted &&
                 s.paymentStatus === "paid" &&
                 (!excludeSaleId || s.id !== excludeSaleId))
    .map(s => s.date);
  return [...new Set(dates)].sort();              // distinct calendar dates
}
```

`loyaltyFor()` derives `paidPurchases = paidDates.length` and `nextMilestone = (floor(count/10)+1)*10`. `decorateSale()` derives `purchaseNumber` as the 1-based index of the sale's date inside that distinct sorted list, and `isMilestone = purchaseNumber % 10 === 0`.

`src/utils/loyalty.js` holds **display-only** helpers (`MILESTONE_STEP = 10`, `nextMilestone`, `milestoneProgress`, `upcomingPurchaseNumber`, `isMilestoneNumber`). Components render the count they are given; the dashboard progress bar now uses `milestoneProgress()` instead of its own modulo maths, so no component re-implements milestone logic.

## M.7 Loyalty preview in Create / Edit Sale (same rule, not a second one)

`loyaltyPreview()` in the mock — reached through `customersApi.loyaltyPreview()` — is derived from that **same `paidDates()` call**, so the preview can never drift from the real count:

```js
const dates        = paidDates(customerId, excludeSaleId); // exclude sale being edited
const currentCount = dates.length;
const alreadyCounted      = dates.includes(date);
const potentialIncrement  = paymentDone && !alreadyCounted ? 1 : 0;
const projectedCount      = currentCount + potentialIncrement;
const upcomingNumber      = potentialIncrement === 1 ? currentCount + 1 : null;
```

Consequences that satisfy the business rule:

| Situation | Increment | What the UI shows |
| --- | --- | --- |
| Paid sale on a **new** date | 1 | Progress advances; quiet line “After this purchase: 9 / 10”; if that lands on a multiple of 10 the **“10th Purchase”** badge appears |
| Paid sale on a date **already counted** | **0** | Count stays as-is (e.g. `9 / 10`), “Next milestone: 10th”, plus a quiet note that another sale today adds no extra loyalty purchase. **Never** shows “10th Purchase” |
| Payment **Pending** sale | 0 | No increment; a pending milestone sale still shows the badge with “Payment Pending” beneath it (approved earlier behaviour) |
| **Editing** a sale | — | The sale excludes itself (`excludeSaleId`), so its own date is not treated as already taken by itself |
| Pending sale later marked **Paid** | 0 or 1 | The original date is used; if another active paid sale already covers that date the count does not change |

The preview is fetched by `SaleFormPage` via `useAsync` on `[customerId, date, paymentDone]` and rendered by the existing `LoyaltyCard` (new optional props `projectedCount`, `dateAlreadyCounted`, `upcomingNumber`). No warning, blocking, confirmation or duplicate-sale message is introduced — the note is a quiet one-line text.

## M.3 Pending payments

Pending sales are excluded from `paidDates`, so they never increase the count. When an Admin marks a pending sale paid, its **original date** is kept; if that date already has another paid sale for the same customer, the loyalty count **does not increase** — the distinct-date set is unchanged. This is a direct consequence of the set-based implementation, not a special case.

## M.4 Milestones

Milestones are the 10th, 20th, 30th … distinct paid purchase date. During Create Sale the card shows `upcomingNumber = paidPurchases + 1`; when that is a multiple of 10 it shows a prominent **“10th Purchase”** badge, plus **“Payment Pending”** in amber if the payment checkbox is unchecked. The badge is display only — the count changes only when the sale is actually paid and adds a new date.

## M.5 Delete / restore

Deleting a paid sale removes its date from the set (count drops, later purchase numbers shift). Restoring re-adds the original date, still de-duplicated by the distinct-date rule.

## M.6 Layer separation

1. **UI simulation (now):** every number above is computed by the mock adapter from local data, so the screens can be built and demonstrated.
2. **Backend authority (later):** Django must compute `paidPurchases`, `nextMilestone`, `purchaseNumber`, `isMilestone` using the same distinct-date rule and return them; the frontend renders whatever the API sends.

---

# N. CUSTOMER CODE IMPLEMENTATION

## N.1 The rule (explicit)

**Customer display codes are opaque and non-sequential** — e.g. `FO-A901`, `FO-K7M2`. They **must not** expose registration order or total customer count. The display code is **separate from the internal primary key**: `customer.id` is the internal identity; `customer.code` is a display/search identifier only. The previous sequential `FRG-001` format has been removed from both the generator and the seed data.

## N.2 Single generation path

`src/mock/mockApi.js → generateCustomerCode(existing)`:

- Format `FO-` + 4 characters from the alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (ambiguous `I`, `O`, `0`, `1` excluded so staff can read codes off a printed card).
- Randomly generated, checked against all existing codes, retried up to 50 times, with an opaque fallback.
- Called from exactly one place: `mockCustomers.create()`.

## N.3 Immutability

`mockCustomers.update()` strips `id` and `code` from the payload before merging, so editing a customer can never change or spoof the code. `CustomerForm` shows the code **read-only** in edit mode and never submits it.

## N.4 Search and display

- **Search** (`matchCustomer`) matches name, phone, WhatsApp, **code** and place, case-insensitively — so typing `FO-A901` (or `fo-a901`) finds the customer. Used by the Customers screen and the Create Sale customer sheet. No fuzzy-search library.
- **Displayed in:** customer list cards, customer details subtitle, the selected-customer card in Create Sale, sale details header, the sale detail bottom sheet, Trash cards, and the Reports customer filter options. It is always visually secondary to the customer name.

## N.5 Backend requirement

Frontend uniqueness is only valid inside the local mock database. **Django must generate the code server-side and enforce uniqueness with a database constraint** (unique column + retry on collision), and must reject client-supplied codes.

---

# O. TESTING / QA

Stated precisely, with no inflation.

## O.1 Automated tests

**None.** No test runner, no test script, no test files. No unit, integration, snapshot or E2E tests exist.

## O.2 Build verification (performed)

`npm run build` executed after the changes and **passing**: 154 modules transformed, `dist/index.html` ≈ 471 kB (≈ 138 kB gzip), no errors or warnings other than the expected singlefile inlining notices.

## O.3 Static verification (performed by the assistant)

- Read the pre-existing source before editing; every changed anchor was verified against the real file.
- Grep-verified that **no** same-day/duplicate/merge warning code exists anywhere in `src/`.
- Grep-verified that no `FRG-` code remains outside an explanatory comment, and that no stale `CreateCustomerForm` import remains.
- Traced the loyalty path to confirm `paidDates()` is the only counting implementation.
- Traced the Staff edit payload to confirm payment fields are omitted for Staff.

## O.4 Manual browser testing

- **By the project owner (earlier):** UI/UX and responsiveness reviewed on a real mobile phone and approved. Device/OS/browser not recorded.
- **By the assistant:** **none.** No browser session, emulator or screenshot verification was performed — not before and not after this gap fix.

## O.5 Explicitly NOT verified at runtime

The verification checklist in the request (creating customers and checking code format, creating two same-day sales and checking the loyalty count stays at 1, marking pending sales paid, delete/restore loyalty effects, Staff vs Admin behaviour, report filter results, and the 375/768/1280 px layouts) has **not** been executed in a browser by the assistant. The logic is implemented and statically traced, but it still needs a human runtime pass.

---

# P. KNOWN LIMITATIONS

1. **No backend.** Everything runs on `src/mock/`; data is per-browser.
2. **No automated tests.**
3. **No runtime verification of this gap fix** (see O.4/O.5) — build + static tracing only.
4. **PDF export produces no file** in mock mode; it shows an informational toast. No PDF library is installed.
5. **Auth is shallow:** cached user trusted on boot, no `/me` call, no refresh rotation, 401 does not force logout.
6. **Deleted sales readable by direct URL** for any authenticated user.
7. **“Today” chart data is synthetic;** custom ranges fall back to month buckets.
8. **Rolling period windows** (7/30/365 days), not calendar periods.
9. **Sales list default range is “This Month”**, hiding older sales until changed.
10. **Reports “Custom” chip** only opens the filter sheet.
11. **Reports product filter lists inactive products for both roles** (deliberate for historical filtering; slightly inconsistent with the Products screen).
12. **Report filters are not persisted** across navigation, and are not reflected in the URL.
13. **No pagination/virtualisation** — lists render fully.
14. **Inter is referenced but not bundled;** falls back to system sans-serif.
15. **Accessibility is basic:** labels, `aria-label`s, focus-visible, Escape-to-close and focus restore exist, but there is no focus trap in overlays and no screen-reader testing.
16. **No global error boundary.**
17. **No draft persistence** in the sale form.
18. **Starter leftovers:** `tsconfig.json`, `@types/*`, and a TypeScript `vite.config.ts`.
19. **HashRouter URLs** contain `#`.
20. **Mock storage key bumped to v2** — anyone with an older `forgeon.mockdb.v1` will see the fresh seed (old locally created mock data is not migrated).

---

# Q. DIFFERENCES FROM THE ORIGINAL MASTER PROMPT

| Original Requirement | Current Implementation | Status | Note |
| --- | --- | --- | --- |
| React + Vite + JavaScript + Axios, no TypeScript | All app code is `.js`/`.jsx` | ✅ | `vite.config.ts` / `tsconfig.json` are starter leftovers |
| Folders `layouts/ pages/ assets/ styles/` | `components/layout`, `features/`, single `index.css`, no assets | ⚠️ | Feature-oriented structure chosen; no static assets exist |
| Bottom nav with “+ Sale” pill | Implemented exactly | ✅ | — |
| Dashboard order + pending carousel + sheet | Implemented | ✅ | Cards are fixed-width (13.5 rem) rather than exactly 3 per viewport |
| Period stepper “Today ›” | `‹ This Week ›` with both arrows, ends disabled | ⚠️ | Both arrows always rendered |
| Same-day sales: no warning, no merge | No such code exists (grep-verified) | ✅ | Confirmed by the gap fix |
| Loyalty = distinct paid dates | `paidDates()` set-based counting | ✅ | Single path |
| Customer code opaque `FO-XXXX` | `generateCustomerCode()` + opaque seed codes | ✅ | Changed in the gap fix |
| Staff cannot change payment status in Edit Sale | Read-only badge + payload omission | ✅ | Changed in the gap fix |
| Admin can edit customers | `CustomerForm` edit mode on Customer details, `can.editCustomer` | ✅ | Added in the gap fix |
| Reports customer + product filters | Added to the existing filter sheet + active chips | ✅ | Added in the gap fix |
| Staff cannot generally edit existing customers | Edit hidden for Staff | ✅ | Staff can still **create** (approved) |
| Report filters incl. product/customer | Range, custom, customer, product, payment, sort, search | ✅ | Filters scope summary, chart, top lists and the sales list |
| PDF export placeholder | Isolated placeholder service | ✅ | Produces no file in mock mode, by design |
| JWT integration prepared | Axios instance, Bearer header, token store, 401 clearing | ⚠️ | No refresh rotation / `/me` bootstrap / forced logout |
| Typography “similar to Inter” | Inter requested in the stack | ⚠️ | Not bundled |
| Visual QA across devices | Owner's mobile review only | ⚠️ | No assistant runtime testing |
| Routing | `HashRouter` | ⚠️ | Required by the single-file build |
| No Redux/heavy state | Three small contexts | ✅ | — |

---

# R. FUTURE DJANGO / DRF INTEGRATION CHECKLIST

**Switch-on:** set `VITE_API_BASE_URL` in `.env`; all services stop using the mock immediately.

**Authentication**
- [ ] `POST /api/auth/login/` → `{ access, refresh, user: { id, name, username, email, role } }`, `role ∈ {admin, staff}`.
- [ ] `GET /api/auth/me/`; call it on boot in `AuthContext` instead of trusting the cached user.
- [ ] Refresh-token rotation + retry interceptor; make 401 force logout.

**Customers**
- [ ] `GET /api/customers/?search=&limit=` — search must cover name, phone, WhatsApp, place **and code**.
- [ ] `GET /api/customers/:id/`, `POST /api/customers/`, `PATCH /api/customers/:id/` (Admin only).
- [ ] Generate the opaque `FO-XXXX` code **server-side**, unique DB constraint, never accept it from the client, never change it on update.
- [ ] Return `paidPurchases`, `nextMilestone`, `totalPurchases`, `totalSpent`, `pendingAmount`, `lastPurchaseDate`.
- [ ] `POST /api/customers/:id/loyalty-preview/` with `{ date, payment_done, exclude_sale_id }` returning `{ currentCount, potentialIncrement, projectedCount, dateAlreadyCounted, upcomingNumber, nextMilestone }` — computed with the same distinct-date logic as the real count.

**Products**
- [ ] `GET /api/products/?search=&category=&include_inactive=`, `GET /api/products/categories/`.
- [ ] `POST` / `PATCH` (Admin), including the `active` flag; enforce selling ≥ cost.

**Sales**
- [ ] `GET /api/sales/?search=&date_from=&date_to=&payment_status=&customer=&product=&ordering=` excluding soft-deleted rows.
- [ ] `GET/POST/PATCH` with item **price snapshots** and derived `total`, `cost`, `profit`, `purchaseNumber`, `isMilestone`, `customerName`, `customerCode`, `customerPhone`, `createdBy`.
- [ ] **Allow multiple sales for the same customer on the same date** — do not block, warn or merge.

**Payments**
- [ ] `POST /api/sales/:id/mark-paid/` — Admin only; preserve the original sale date.
- [ ] **Reject `paymentStatus` changes from Staff** on `PATCH /api/sales/:id/`.

**Loyalty**
- [ ] Count **distinct calendar dates** of paid, non-deleted sales per customer.
- [ ] Marking a pending sale paid on an already-counted date must add **zero**.
- [ ] `GET /api/reports/loyalty/` → `{ approaching:[{id,name,paidPurchases,nextMilestone}], recent:[{id,name,date,purchaseNumber}] }`.

**Reports**
- [ ] `summary`, `timeseries`, `top-products`, `top-customers` — all accepting `date_from`, `date_to`, `customer`, `product`; all excluding soft-deleted sales.

**Trash / Restore**
- [ ] `DELETE /api/sales/:id/` with `{ reason }` (Admin, reason required, store `deletedBy`/`deletedAt`).
- [ ] `GET /api/sales/trash/`, `POST /api/sales/:id/restore/` (Admin); restore must return the sale to reports and loyalty under the distinct-date rule.
- [ ] Consider blocking non-Admin reads of deleted sales.

**PDF**
- [ ] `GET /api/reports/export/pdf/` returning `application/pdf`; the frontend download path already works.

**Permissions & cleanup**
- [ ] Enforce every row of section **K** server-side.
- [ ] Delete `src/mock/`, remove `USE_MOCK` branches and the Settings mock card.
- [ ] Return DRF-style errors so `toUserMessage()` keeps producing short messages.
- [ ] Add pagination UI if DRF pagination is enabled (services already accept `data.results ?? data`).

---

# S. HOW TO RUN

```bash
npm install     # install dependencies
npm run dev     # dev server → http://localhost:5173
npm run build   # production build → dist/index.html (single inlined file)
npm run preview # preview the production build
```

**Environment** — copy `.env.example` to `.env`:

```bash
# Empty  → isolated mock data layer (current default)
# Set    → every screen uses the Django REST API
VITE_API_BASE_URL=
```

**Mock login (development only):** `admin / admin123` (Admin), `staff / staff123` (Staff). Shown on the login screen only while `USE_MOCK` is true.

**Reset demo data:** Settings → “Reset mock data”, or clear the `forgeon.mockdb.v2` localStorage key.

---

# T. IMPORTANT DEVELOPER NOTES

1. **The UI/UX is approved — do not redesign.** Treat visual changes as out of scope unless explicitly requested.
2. **Do not hard-code colours.** Edit tokens in `src/index.css`; use semantic classes. Tailwind v4 is configured in CSS — there is no `tailwind.config.js`.
3. **Do not call Axios from a component.** Extend `src/services/api/*` and fetch through `useAsync`.
4. **Do not import `src/mock/*` from UI** — the only exception is `SettingsPage` (mock reset).
5. **One loyalty path:** `paidDates()` in the mock (later, the backend). Never re-implement counting in a component; use `src/utils/loyalty.js` helpers for display maths only.
6. **One customer-code path:** `generateCustomerCode()`. Never generate, edit or infer codes in the UI, and never treat the code as a primary key.
7. **Same-day sales are legitimate.** Do not add duplicate warnings, blocking, confirmations or merging.
8. **Payment status in Edit Sale is Admin-only** (`canEditPayment`); Staff payloads must keep omitting payment fields.
9. **`useAsync` deps must be primitives** (e.g. `dates.from`, `customerId`), never object identities — Reports uses a shared `scopeDeps` array for this reason.
10. **Sticky-bar geometry:** `bottom-[64px]` on mobile, `bottom-0 left-64` on desktop; keep in sync with the bottom-nav height and `AppShell`'s `pb-28` / `lg:pl-64`.
11. **Historical vs current prices is a hard rule.** Sale items carry their own prices; never render catalogue prices where sale prices belong.
12. **Role checks are UX, not security.**
13. **`navItems.js` is the single source of truth** for the bottom nav, sidebar and More hub.
14. **Mock DB is versioned** (`forgeon.mockdb.v2`). If the seed shape changes again, bump the key.
15. **The build is a single file** — new dependencies inflate `dist/index.html` directly.
16. **There are no tests:** verify changes manually plus `npm run build`.

---

# CHANGELOG — FINAL MVP GAP FIX

Applied on top of the approved baseline. **No visual redesign, no rebuild, no new screens.**

## 1. Same-day sales & loyalty clarification

- **Verified (no code change needed):** loyalty already counted **distinct paid calendar dates** via `paidDates()`.
- **Verified by grep:** the codebase contains **no** same-day duplicate warning, blocking message, confirmation or merge logic — nothing had to be removed.
- **Documented** explicitly in sections **J** and **M**, including the worked 5-sales-in-3-days example and the “marking a pending sale paid on an already-counted date adds zero” case.
- **Consistency fix:** `DashboardPage` had inline `% 10` progress maths; it now uses the shared `milestoneProgress()` helper so milestone logic lives in one place.

## 2. Customer code: sequential → opaque

- `src/mock/seed.js` — all 8 seed customers re-coded from `FRG-001…FRG-008` to opaque codes (`FO-A901`, `FO-K7M2`, `FO-X4P8`, `FO-Q9NC`, `FO-7BXA`, `FO-M2RK`, `FO-D3VP`, `FO-T8JW`).
- `src/mock/mockApi.js` — added `generateCustomerCode()` (single path): `FO-` + 4 random characters from a 32-char unambiguous alphabet, uniqueness-checked against existing customers, with a fallback. `mockCustomers.create()` now uses it.
- `mockCustomers.update()` — strips `id` and `code` from the payload so the code is **immutable**, and now applies the same required-field validation as create.
- Mock storage key bumped `forgeon.mockdb.v1` → **`forgeon.mockdb.v2`** so stale sequential codes are not resurrected from a previous session.

## 3. Customer code search & display

- Search already covered the code (`matchCustomer`); confirmed and documented.
- Code is now also shown on the **selected-customer card in Create Sale** and on **Trash cards**, in addition to the existing customer list, customer details, sale details and sale detail sheet. It stays visually secondary.
- The Reports customer filter lists `Name · CODE`.

## 4. Staff payment restriction (Edit Sale)

- `SaleFormPage` — added `canEditPayment = mode === "create" || isAdmin`.
- Staff editing a sale now sees a **read-only payment status card** (`StatusBadge` + “Only an Admin can change the payment status of a saved sale.”) instead of the checkbox.
- The update payload **omits `paymentDone`/`paymentStatus` entirely** for Staff, so the field cannot be changed even accidentally.
- Creating a sale is unchanged for both roles (Staff may still save a sale as Payment Pending, which is approved).

## 5. Admin customer editing

- New shared component `src/features/customers/components/CustomerForm.jsx` handling **both** create and edit (same fields, same validation: name required, phone **or** WhatsApp required, place required). In edit mode it shows the `FO-` code read-only.
- `CustomerSelectSheet` and `CustomersPage` now reuse this component (the duplicated local `CreateCustomerForm` was removed — no UI change).
- `CustomerDetailsPage` — Admin-only **Edit** button in the header opening a `BottomSheet` with the form; on save the customer reloads. Hidden for Staff via `can.editCustomer`.
- `customersApi.update()` (previously unused) is now wired up.

## 6. Reports — customer & product filters

- `ReportsPage` — added `customerId` / `productId` state, two new `<Select>`s inside the **existing** filter bottom sheet, and dismissible active-filter chips under the range chips.
- All report queries share one `scope` object: **summary cards, trend chart, top products, top customers and the sales list** all honour the filters, as does the PDF export payload.
- `mockApi.js` — added `saleMatchesReportFilters()`; `activeSalesIn()` now accepts `{ customerId, productId }`; `summary`, `timeseries`, `topProducts`, `topCustomers` accept the scope; `mockSales.list()` gained a `productId` filter.
- `services/api/reports.js` — added a shared `scopeParams()` mapping to `customer` / `product` query params; `services/api/sales.js` — added `product`.
- The product dropdown includes inactive products so historical reports can filter a discontinued item.

## 7. Files changed

**Modified:** `src/mock/seed.js`, `src/mock/mockApi.js`, `src/services/api/reports.js`, `src/services/api/sales.js`, `src/features/sales/SaleFormPage.jsx`, `src/features/sales/components/CustomerSelectSheet.jsx`, `src/features/customers/CustomersPage.jsx`, `src/features/customers/CustomerDetailsPage.jsx`, `src/features/reports/ReportsPage.jsx`, `src/features/dashboard/DashboardPage.jsx`, `src/features/trash/TrashPage.jsx`, `FORGEON_FRONTEND_IMPLEMENTATION_DOCUMENTATION.md`.

**Added:** `src/features/customers/components/CustomerForm.jsx`.

**Removed:** the duplicated `CreateCustomerForm` inside `CustomerSelectSheet.jsx` (behaviour preserved by `CustomerForm`).

**Untouched:** all layout, navigation, theme, typography, dashboard structure, sale-form structure, sticky save bar, cards, sheets, modals and responsive behaviour.

## 8. User-visible changes

1. Customer codes now look like `FO-A901` instead of `FRG-001`.
2. The customer code appears on the Create Sale customer card and on Trash cards.
3. Admin sees an **Edit** button on the customer details screen.
4. Staff editing a sale sees payment status as a read-only badge instead of a checkbox.
5. Reports gains **Customer** and **Product** filters plus dismissible active-filter chips.
6. Existing users are moved to a fresh mock dataset (storage key bumped to v2).

## 9. Business-rule impact

- **Loyalty:** unchanged in behaviour (already distinct-date based); now documented explicitly and with a single display-maths path.
- **Same-day sales:** unchanged — still saved as separate records with no warnings.
- **Payment:** unchanged for Admin; tightened for Staff during edit.
- **Customer identity:** display code is now opaque, non-sequential and immutable; internal `id` remains the primary key.
- **Reports:** results can now be narrowed by customer and product; deleted sales remain excluded everywhere.

## 10. Testing performed (honest)

- ✅ `npm run build` run twice after the changes — passing, 154 modules, no errors.
- ✅ Source inspected before every edit; all anchors verified against the real files.
- ✅ Grep verification: no same-day/duplicate/merge warning code; no remaining `FRG-` codes; no stale `CreateCustomerForm` imports; `Icon` import present where newly used.
- ✅ Logic traced by hand for: distinct-date loyalty, Staff payload omission, code immutability on update, report scope propagation.
- ❌ **No browser/runtime testing was performed by the assistant** — the verification checklist (create customers and inspect codes, two same-day paid sales → loyalty stays 1, pending → mark paid → no double count, delete/restore effects, Staff vs Admin walkthrough, report filter results, 375/768/1280 px layouts) still requires a human runtime pass.
- ❌ No automated tests exist.

## 11. Remaining limitations after this fix

Everything listed in section **P** still applies — most importantly: no backend, no automated tests, no runtime verification of this change set, PDF export produces no file, shallow auth (no `/me`, no refresh, no forced logout on 401), deleted sales readable by direct URL, synthetic “Today” chart data, rolling period windows, no pagination, and Inter not bundled.

---

# CHANGELOG — TARGETED UX & LOYALTY PREVIEW FIX

Applied on top of the approved baseline. **No redesign, no rebuild, no visual-design change, no unrelated screens touched.**

## 1. Customer Details → Direct Create Sale (preselected customer)

- `CustomerDetailsPage` — the top “+” button now navigates with router state:
  `navigate("/sales/new", { state: { customerId: id } })`.
- `SaleFormPage` — reads `location.state?.customerId` (create mode only), fetches that customer and preselects it before the form renders (loading state set while it loads).
- Result: the customer card (name, `FO-` code, place, phone) and the loyalty card are already populated; the user goes straight to products, quantity, pricing, payment and save. The “Change” button still allows switching.
- No new global state, no new route, no query parameter — the simplest mechanism available in the current codebase (React Router state) was used.

## 2. Normal “+ Sale” flow unchanged

- The bottom-navigation “+ Sale” pill and the sidebar “New Sale” button send **no** router state, so `preselectCustomerId` is undefined, nothing is preselected, and the normal recent-customers + search + create flow behaves exactly as before.
- Both entry contexts were verified to coexist:
  - **A. Normal Create Sale** → no customer preselected, normal selection required.
  - **B. Customer Details direct sale** → customer preselected, no re-selection.

## 3. Loyalty milestone preview now respects same-day distinct-date eligibility

- Added `loyaltyPreview()` to `src/mock/mockApi.js`, derived from the **existing `paidDates()`** — there is still exactly **one** loyalty calculation in the frontend. No second independent logic.
- `paidDates()` gained an optional `excludeSaleId` so a sale being edited does not count itself as already occupying its own date.
- `services/api/customers.js` gained `loyaltyPreview()` (mock branch; real branch targets `POST /api/customers/:id/loyalty-preview/`).
- `SaleFormPage` fetches the preview via `useAsync` on `[customerId, date, paymentDone]` and passes it to the existing `LoyaltyCard`.
- `LoyaltyCard` gained optional preview props (`projectedCount`, `dateAlreadyCounted`, `upcomingNumber`). With no preview props (customer details, dashboards) it renders exactly as before.
- Behaviour:
  - Paid sale on a **new** date → progress advances, quiet “After this purchase: 9 / 10” line, and the **“10th Purchase”** badge when the number is a multiple of 10.
  - Paid sale on a date **already counted** → increment 0, count preserved (`9 / 10`, “Next milestone: 10th”). **“10th Purchase” is never shown.**
  - Payment **Pending** → increment 0; a pending milestone sale still shows the badge with “Payment Pending” underneath (preserves the previously approved wording).
  - Next calendar day → new date is eligible and the milestone badge appears correctly.

## 4. No same-day duplicate-sale warning introduced

The only new text is a quiet one-line note (“This date is already counted as a loyalty purchase — another sale today adds no extra loyalty purchase.”). There is **no** warning dialog, no confirmation, no blocking, no merging, and no change to how same-day sales are saved — they remain separate valid sale records.

## 5. Files changed

**Modified:** `src/features/customers/CustomerDetailsPage.jsx`, `src/features/sales/SaleFormPage.jsx`, `src/components/domain/LoyaltyCard.jsx`, `src/mock/mockApi.js`, `src/services/api/customers.js`, `FORGEON_FRONTEND_IMPLEMENTATION_DOCUMENTATION.md`.

**Not touched:** navigation design, bottom navigation, More screen, Customer Details layout, Create Sale layout, Dashboard, Sales, Products, Reports, Trash, theme, colours, typography, responsive behaviour, animations, customer codes, customer search, same-day sale saving, the actual distinct-date loyalty rule, and all Admin/Staff permissions.

## 6. Tests performed (honest)

- ✅ `npm run build` run after each change — passing (154 modules, no errors).
- ✅ Source inspected before editing; each edit anchored against real file content.
- ✅ Logic traced by hand for: preselected-customer path, normal path (no state → nothing preselected), new-date increment, same-day second sale (increment 0, no milestone badge), pending sale (increment 0), and edit mode excluding its own sale.
- ❌ **No browser/runtime testing was performed by the assistant.** TEST 1–6 from the request (direct sale flow, normal “+ Sale” flow, new loyalty date, same-day second sale, next-day milestone, pending → mark paid) still require a human runtime pass in a browser.
- ❌ No automated tests exist in the project.

## 7. Build result

`npm run build` — **passing**: 154 modules transformed, single-file `dist/index.html` ≈ 472 kB (≈ 139 kB gzip), no errors or new warnings.
