# IDAS — Invoice Delay Accountability System (Frontend)

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

The app runs at **http://localhost:5173** and connects to the FastAPI backend at **http://localhost:8000**.

## Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

The only variable is:
```
VITE_API_BASE_URL=http://localhost:8000
```

## Authentication

Login uses OAuth2 form-data (`application/x-www-form-urlencoded`) with the `username` and `password` fields. The backend returns a JWT token, which is decoded using `jwt-decode` and stored in `localStorage` under the key `idas_token`.

### Test Credentials
| Email | Password | Role |
|-------|----------|------|
| rajesh@plant1.local | secure_password | Store Officer (Plant 1) |
| sunita@plant1.local | secure_password | Accounts Officer (Plant 1) |
| admin@hq.local | secure_password | HQ Admin (All Plants) |

## Folder Structure

```
src/
├── main.jsx                     # Entry point (providers)
├── App.jsx                      # Router
├── theme/index.js               # MUI theme
├── api/axios.js                 # Axios instance
├── api/endpoints.js             # All API calls
├── auth/AuthContext.jsx          # JWT auth state
├── auth/ProtectedRoute.jsx       # Role guard
├── hooks/useAuth.js             # Auth hook
├── hooks/useInvoices.js         # React Query hooks
├── utils/stageConfig.js         # Stage labels/colors/icons
├── utils/formatters.js          # Date/currency/duration formatting
├── components/layout/           # AppLayout, Sidebar, TopBar
├── components/invoice/          # InvoiceTable, StatusChip, Timeline, DelayBreakdown
├── components/forms/            # CreateInvoice, MaterialReceipt, Inspection, Verify
├── components/common/           # LoadingSpinner, ErrorAlert, ConfirmDialog
└── pages/                       # Login, Store/, Accounts/, Admin/
```

## Routing

| Path | Role | Page |
|------|------|------|
| `/login` | Public | Login page |
| `/store` | store_officer | Store Dashboard |
| `/store/invoices/:id` | store_officer | Invoice Detail + Actions |
| `/accounts` | accounts_officer | Accounts Dashboard |
| `/accounts/invoices/:id` | accounts_officer | Invoice Detail + Verify |
| `/admin` | admin | HQ Oversight Dashboard |
| `/admin/invoices` | admin | All Invoices (read-only) |
| `/admin/invoices/:id` | admin | Invoice Detail (read-only) |

## Tech Stack

- React 18 + Vite
- MUI v5 (Material UI)
- React Router v6
- React Query (TanStack) v5
- Recharts
- react-hook-form
- dayjs
- jwt-decode
- axios
