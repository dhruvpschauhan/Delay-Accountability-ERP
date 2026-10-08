# PROJECT_CONTEXT.md

## 1. PROJECT OVERVIEW
**Name**: Delay Accountability ERP (IDAS)
**Purpose**: A highly structured, state-machine-driven Enterprise Resource Planning application designed to track and attribute bureaucratic delays in invoice processing. It logs exactly how much time an invoice spends sitting on a specific desk or waiting for external firms, solving the business problem of "where is the bottleneck in our procurement/payment pipeline?"
**Users**:
- **Store Officers**: Enter invoices, record physical material receipts, and perform quality inspections.
- **Accounts Officers**: Financially verify invoices, raise observations, and release payments.
- **Admins**: Oversee the entire pipeline and view analytics.
**Key Feature**: Multi-tenant plant isolation (users can only see invoices belonging to their assigned `plant_id`), strict workflow sequence enforcement, and precise delay analytics down to the hour.

---

## 2. TECH STACK
### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn
- **ORM**: SQLAlchemy
- **Validation**: Pydantic (v2)
- **Database Migrations**: Alembic
- **Database Engine**: SQLite (`delay_erp.db`) - designed to easily swap to PostgreSQL.
- **Authentication**: PyJWT, Passlib (with `bcrypt` for password hashing).
- **Deployment**: `gradio` (for Hugging Face free-tier execution), `python-dotenv`, `python-multipart`.

### Frontend
- **Framework**: React.js 18 with Vite
- **UI Component Library**: Material UI (MUI v5)
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **State Management / Data Fetching**: Custom hooks via React Context API
- **Icons**: Lucide React & MUI Icons
- **Date Formatting**: `date-fns`
- **Charts**: Recharts

---

## 3. COMPLETE FOLDER & FILE STRUCTURE
### Backend (`/app/`)
- `main.py`: Application entry point, configures CORS, and registers all API routers.
- `database.py`: SQLAlchemy setup, `engine`, `SessionLocal`, and `get_db()` dependency yield.
- `dependencies.py`: FastAPI Dependency Injection for Auth (`get_current_user`, JWT decoding, DB lookup).
- `core/config.py`: Pydantic `BaseSettings` for environment variables (`DATABASE_URL`, `SECRET_KEY`).
- `core/security.py`: JWT payload generation (`create_access_token`) and bcrypt password hashing.
- `models/users.py`: SQLAlchemy `User` table definition.
- `models/firms.py`: SQLAlchemy `Firm` and `Plant` table definitions.
- `models/invoices.py`: SQLAlchemy `Invoice` table definition.
- `models/workflow.py`: SQLAlchemy `MaterialReceipt`, `InvoiceRevision`, `ObservationRound`, `InvoicePassing` tables.
- `models/events.py`: SQLAlchemy `StageEvent` table (the audit log for delays).
- `schemas/invoices.py`: Pydantic validation models for all invoice creation/mutation requests.
- `schemas/users.py`, `schemas/firms.py`: Pydantic models for related entities.
- `routers/auth.py`: `POST /auth/login` endpoint.
- `routers/invoices.py`: All invoice mutation endpoints, heavily dependent on RBAC checking.
- `services/invoice_workflow.py`: **The Brain**. Contains the strict state-machine guard clauses and DB transaction logic.

### Root Directories
- `Dockerfile`: Configuration to run the backend on Hugging Face Spaces.
- `app.py`: Gradio app wrapper to bypass Docker restrictions on Hugging Face.
- `render.yaml`: Infrastructure-as-code configuration for Render.com deployment.
- `requirements.txt`: Python package dependencies.

### Frontend (`/frontend/`)
- `vercel.json`: Configuration for Vercel deployment (React Router rewrites).
- `src/main.jsx`, `src/App.jsx`: React mount point and global context providers.
- `src/api/axios.js`: Axios instance config with automatic JWT Bearer token interceptor.
- `src/api/endpoints.js`: Centralised dictionary of all backend API call functions.
- `src/contexts/AuthContext.jsx`: Global authentication state manager.
- `src/hooks/useAuth.js`, `src/hooks/useInvoices.js`: Custom hooks for abstracting API calls.
- `src/utils/formatters.js`: Formatting logic for currency, dates, and the custom `< 1 hr` delay logic.
- `src/utils/stageConfig.js`: Massive dictionary configuring the color, icon, label, and owner of every workflow stage.
- `src/components/common/ProtectedRoute.jsx`: Wrapper to kick unauthenticated or unauthorized users back to login.
- `src/components/layout/AppLayout.jsx`, `Sidebar.jsx`, `TopBar.jsx`: The main application shell.
- `src/components/invoice/DelayBreakdown.jsx`: Live ticking delay analytics component.
- `src/components/invoice/InvoiceStatusChip.jsx`: Visual badges for current stage.
- `src/components/forms/*`: Modular form components (`InspectionForm`, `PaymentForm`, `ObservationReplyForm`, `MaterialReceiptForm`, `ReplacementForm`).
- `src/pages/LoginPage.jsx`: Standard JWT login page.
- `src/pages/DashboardPage.jsx`: KPI metrics.
- `src/pages/store/StoreInvoiceList.jsx`, `src/pages/accounts/AccountsInvoiceList.jsx`: Role-specific data tables.
- `src/pages/common/InvoiceDetailPage.jsx`: Massive dynamic view that renders completely different action buttons based on the user's role and the invoice's `current_stage`.

---

## 4. DATABASE SCHEMA (SQLAlchemy Models)
1. **`users`**:
   - `id` (PK, int), `username` (str), `email` (str), `hashed_password` (str)
   - `role` (Enum: `admin`, `store_officer`, `accounts_officer`)
   - `plant_id` (FK -> plants.id, nullable)
   - `is_active` (boolean, default=True)
2. **`plants`**:
   - `id` (PK, int), `name` (str), `code` (str, unique), `location` (str)
3. **`firms`**:
   - `id` (PK, int), `name` (str), `vendor_code` (str, unique), `email` (str), `phone` (str), `address` (str)
4. **`invoices`**:
   - `id` (PK, int), `plant_id` (FK -> plants.id), `firm_id` (FK -> firms.id)
   - `created_by_user_id` (FK -> users.id)
   - `po_number` (str), `po_date` (date), `invoice_number` (str), `invoice_date` (date), `invoice_amount` (float), `item_quantity_ordered` (int)
   - `current_stage` (str), `current_stage_entered_at` (datetime), `current_owner_role` (str)
   - `status` (str, default="open", terminal="closed")
   - `created_at` (datetime), `closed_at` (datetime, nullable), `notes` (str, nullable)
5. **`stage_events`** (The Audit Log):
   - `id` (PK, int), `invoice_id` (FK -> invoices.id), `stage_name` (str)
   - `entered_at` (datetime), `exited_at` (datetime, nullable), `duration_hours` (float)
   - `acted_by_user_id` (FK -> users.id), `delay_type` (str: `internal`, `external_wait`, `handoff`)
6. **`material_receipts`**:
   - `id` (PK, int), `invoice_id` (FK -> invoices.id), `receipt_date` (date), `quantity_received` (int)
   - `received_by_user_id` (FK -> users.id), `receipt_notes` (str)
   - `inspection_date` (date), `pbg_acceptance_date` (date), `contract_agreement_date` (date), `acknowledgement_date` (date)
   - `acceptance_type` (str: `full`, `partial`), `inspection_notes` (str)
7. **`invoice_revisions`** (Replacement Processing):
   - `id` (PK, int), `invoice_id` (FK -> invoices.id), `firm_response` (str: `replace`, `no_replace`), `reply_notes` (str)
   - `replacement_received_date` (date), `quantity_replaced` (int), `accepted_by_user_id` (FK -> users.id)
8. **`observation_rounds`**:
   - `id` (PK, int), `invoice_id` (FK -> invoices.id), `round_number` (int), `observation_date` (date)
   - `raised_by_user_id` (FK -> users.id), `observation_notes` (str)
   - `firm_reply_date` (date), `firm_reply_notes` (str), `resolved_at` (datetime)
9. **`invoice_passing`**:
   - `id` (PK, int), `invoice_id` (FK -> invoices.id), `passed_date` (date), `passed_amount` (float)
   - `frm_number` (str), `deduction_amount` (float), `deduction_reason` (str)
   - `passed_by_user_id` (FK -> users.id), `payment_date` (date), `payment_reference` (str), `paid_by_user_id` (FK -> users.id)

---

## 5. BACKEND — COMPLETE API DOCUMENTATION
*(All endpoints below require JWT Bearer token authentication via `Depends(get_current_active_user)` unless stated otherwise).*

1. **`POST /auth/login`**:
   - **Auth**: None
   - **Body**: OAuth2 `username`, `password` (Form Data)
   - **Returns**: `{"access_token": str, "token_type": "bearer"}`
2. **`GET /invoices/`**:
   - **Query Params**: `skip` (int), `limit` (int), `status` (str), `stage` (str)
   - **Returns**: List of `InvoiceResponse` schemas. Automatically filters by `user.plant_id` (Multi-tenant isolation).
3. **`GET /invoices/{invoice_id}`**:
   - **Returns**: `InvoiceDetailResponse` including the full nested array of `stage_events`.
4. **`POST /invoices/`**:
   - **Auth**: `store_officer` only.
   - **Body (`InvoiceCreate`)**: `firm_id`, `po_number`, `po_date`, `invoice_number`, `invoice_date`, `invoice_amount`, `item_quantity_ordered`, `notes`.
   - **Action**: Opens `invoice_entry` stage.
5. **`POST /invoices/{invoice_id}/material-receipt`**:
   - **Auth**: `store_officer` only. Requires `current_stage == invoice_entry` or `replacement_processing`.
   - **Body (`MaterialReceiptCreate`)**: `receipt_date`, `quantity_received`, `receipt_notes`.
   - **Action**: Closes current stage, opens `inspection_summary` stage.
6. **`POST /invoices/{invoice_id}/inspection`**:
   - **Auth**: `store_officer` only. Requires `current_stage == inspection_summary`.
   - **Body (`InspectionCreate`)**: `inspection_date`, `pbg_acceptance_date`, `contract_agreement_date`, `acknowledgement_date`, `acceptance_type` (`full`|`partial`), `partial_action`, `revised_amount`, `acceptance_notes`.
   - **Action**: Branching Logic. If `full`, opens `forwarded_to_accounts`. If `partial`, opens `partial_firm_intimation`.
7. **`POST /invoices/{invoice_id}/replacement`**:
   - **Auth**: `store_officer` only. Requires `current_stage == partial_firm_intimation`.
   - **Body (`ReplacementReceived`)**: `replacement_received_date`, `quantity_replaced`, `replacement_notes`.
   - **Action**: Opens `replacement_processing` stage (loops back).
8. **`POST /invoices/{invoice_id}/verify`**:
   - **Auth**: `accounts_officer` only. Requires `current_stage == forwarded_to_accounts` or `accounts_verification`.
   - **Body (`VerifyInvoice`)**: `verification_date`, `observations_found` (bool), `observation_notes`, `passed_amount`, `frm_number`, `deduction_amount`, `deduction_reason`.
   - **Action**: Branching Logic. If observations found, opens `observation_correspondence`. If clear, opens `invoice_passed`.
9. **`POST /invoices/{invoice_id}/observation/reply`**:
   - **Auth**: `accounts_officer` only. Proxy route. Requires `current_stage == observation_correspondence`.
   - **Body (`ReplyObservation`)**: `firm_reply_date`, `firm_reply_notes`.
   - **Action**: Closes external stage, loops back to `accounts_verification`.
10. **`POST /invoices/{invoice_id}/payment`**:
    - **Auth**: `accounts_officer` only. Requires `current_stage == invoice_passed`.
    - **Body (`RecordPayment`)**: `payment_date`, `payment_reference`.
    - **Action**: Mutates `status = "closed"`, ends workflow, stops delay timers.

---

## 6. FRONTEND — COMPLETE PAGE & COMPONENT DOCUMENTATION
### Core Routing (`App.jsx`)
- Uses `<BrowserRouter>` and `<ProtectedRoute allowedRoles={['...']}>`.
- Unauthorized users are immediately redirected to `/login`.

### Pages
- **`LoginPage.jsx`**: Handles Axios login, stores token in `localStorage('idas_token')`, sets AuthContext.
- **`InvoiceDetailPage.jsx`**: The most complex component in the app.
  - Queries `GET /invoices/{id}`.
  - Passes data to `<DelayBreakdown />` to show live analytics.
  - Reads `invoice.current_stage`. If the stage matches the logged-in user's role (e.g., `store_officer` viewing `invoice_entry`), it renders the corresponding action form (e.g., `<MaterialReceiptForm />`).
  - If the stage does not belong to the user, it renders a read-only timeline.

### Delay Analytics Engine (`DelayBreakdown.jsx`)
- Reads the `stage_events` array from the backend.
- Groups durations by `owner` (`store_officer`, `accounts_officer`, `external`).
- **Live Ticking**: For the currently open stage (`exited_at == null`), it runs a `setInterval` that calculates `Date.now() - entered_at` and adds those active hours to the total, re-rendering percentages dynamically.
- **Blacklist**: Explicitly ignores live math if `invoice.status == "closed"` or if the stage is `payment_recorded`.

---

## 7. WORKFLOW / STATE MACHINE
The core logic resides in `app/services/invoice_workflow.py`. Every function utilizes two specific helpers:
1. `close_current_stage()`: Finds the open `stage_event` for this invoice, stamps `exited_at = now()`, and calculates the exact `duration_hours`.
2. `open_new_stage(stage_name)`: Creates a new `stage_event` and overwrites `invoice.current_stage = stage_name`.

### The Exact Sequence:
1. `invoice_entry` (Owned by: Store)
2. `material_receipt` (Owned by: Store)
3. `inspection_summary` (Owned by: Store)
   - **[BRANCH A - FULL]**: Moves to `forwarded_to_accounts`
   - **[BRANCH B - PARTIAL]**: Moves to `partial_firm_intimation` (External). Store Officer later triggers `POST /replacement` to move to `replacement_processing` (Loop).
4. `forwarded_to_accounts` (Owned by: Accounts) -> `accounts_verification`
5. `accounts_verification` (Owned by: Accounts)
   - **[BRANCH A - OBSERVATIONS]**: Moves to `observation_correspondence` (External). Accounts Officer later triggers `POST /observation/reply` to move back to `accounts_verification` (Loop).
   - **[BRANCH B - CLEAR]**: Moves to `invoice_passed`.
6. `invoice_passed` (Owned by: Accounts)
7. `payment_recorded` (Terminal Stage - Invoice is officially CLOSED).

---

## 8. ROLES & PERMISSIONS
Enforced on the **backend** inside the routers using `if current_user.role != "..." raise HTTPException(403)`.
Enforced on the **frontend** by hiding UI elements and wrapping pages in `<ProtectedRoute>`.
- **`store_officer`**: Can create invoices, receive materials, inspect goods, and process replacements. They cannot see or touch the Accounts Verification forms.
- **`accounts_officer`**: Can verify invoices, raise financial observations, record proxy replies from the firm, and record final payments. They cannot create invoices.
- **`admin`**: Has dashboard oversight.
- **`external` (Firm)**: Conceptually, the firm owns stages like `observation_correspondence`, but they do not have a physical login portal in this V1 architecture. Instead, internal officers use "Proxy Actions" to act on their behalf.

---

## 9. KEY BUSINESS LOGIC & DECISIONS
- **Proxy Actions for External Firms**: Because external firms don't have ERP logins, they cannot "submit" a reply. The system originally created a "Dead State" where invoices got stuck forever. We built proxy endpoints (`reply_to_observation` and `record_replacement`) so internal officers can physically type in the firm's email reply, attaching the firm's timestamp to properly calculate the external delay accurately.
- **Multi-Tenant Isolation**: In `get_invoices()`, the system applies a strict `query.filter(Invoice.plant_id == current_user.plant_id)`. A Store Officer in Delhi can never see an invoice from Mumbai.
- **JWT Top-Level Claims**: The JWT payload includes `role` and `plant_id` at the top level so the React frontend can decode it locally and instantly know what UI to render without needing to query the backend for user details.

---

## 10. KNOWN ISSUES, BUGS FIXED & CURRENT STATUS
**Bugs Fixed:**
1. **Ghost Delay Bug**: Final stages kept ticking live hours forever. Fixed by hard-coding `status = "closed"` when payment is recorded, and blacklisting terminal stages in React.
2. **"0 hrs" Formatting Bug**: The UI rounded 0.2 hours to 0 hours, confusing users. Patched `formatters.js` to explicitly return `< 1 hr` if the value is between 0 and 1.

**Current Status:**
The application is 100% feature-complete for V1. The backend API is stable, the React frontend renders correctly without console errors, and the entire SQLite-driven state machine strictly enforces bureaucratic accountability.

---

## 11. HOW TO RUN THE PROJECT
### Local Development Setup
**Backend**:
1. Open terminal in the root directory.
2. Ensure you have Python 3.10+ installed.
3. `python -m venv venv`
4. `.\venv\Scripts\Activate.ps1` (Windows) or `source venv/bin/activate` (Mac/Linux)
5. `pip install -r requirements.txt`
6. `uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`
*(The SQLite DB `delay_erp.db` will automatically be created on the first run if migrations/models are called, or you can use Alembic if configured).*

**Frontend**:
1. Open a new terminal in the `/frontend` directory.
2. `npm install`
3. `npm run dev`
4. Visit `http://localhost:5173`. 
*(Note: Ensure you have users seeded in the database to log in).*

### Environment Variables
**Backend (`.env`)**:
```env
DATABASE_URL=sqlite:///./delay_erp.db
SECRET_KEY=supersecretkey_change_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
**Frontend (`frontend/.env.local`)**:
```env
VITE_API_BASE_URL=http://localhost:8000
```