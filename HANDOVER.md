# Delay Accountability ERP - Project Handover Document

**To the AI Assistant reading this:** The user has migrated to a new chat/IDE instance. This document serves as the complete brain and context of the project so you can resume exactly where we left off.

## 1. Project Architecture
- **Backend**: FastAPI (Python 3.10+)
- **Database**: SQLite (`delay_erp.db`) using SQLAlchemy ORM and Alembic for migrations.
- **Frontend**: React.js with Vite (`frontend/` directory).
- **Authentication**: JWT Bearer tokens with Role-Based Access Control (RBAC).

## 2. Core Business Logic (The Workflow State Machine)
This is an ERP to track bureaucratic delays in invoice processing. The state machine is strictly enforced in `app/services/invoice_workflow.py` via guard clauses. The sequence is:
1. `invoice_entry` (Store Officer)
2. `material_receipt` (Store Officer)
3. `inspection_summary` (Store Officer)
   - *Branch A*: Full Acceptance -> `forwarded_to_accounts`
   - *Branch B*: Partial Acceptance -> `partial_firm_intimation` (External Wait) -> `replacement_processing` (Loop back)
4. `accounts_verification` (Accounts Officer)
   - *Branch A*: No issues -> `invoice_passed`
   - *Branch B*: Observations found -> `observation_correspondence` (External Wait). We built a "Proxy Reply" route (`POST /{id}/observation/reply`) for the Accounts Officer to pull it back from this dead state.
5. `payment_recorded` (Accounts Officer) -> Terminal state (`status = "closed"`).

## 3. Notable Architectural Bugs We Solved
- **The "Ghost Delay" Bug**: Terminal stages were infinitely calculating delays because the final stage was never officially `closed` in the DB. Fixed by mutating `status = "closed"` directly in the DB.
- **The "0 hrs" Formatting Bug**: JavaScript `Math.round(hours % 24)` was aggressively rounding 0.2 hours to 0. Fixed in the frontend by intercepting small decimals and displaying `< 1 hr`.
- **The "Observation Dead State"**: Invoices got stuck waiting for an external firm that had no login access. Fixed by creating Proxy UI buttons for the Store/Accounts officers to manually register the firm's offline replies.
- **Graceful Redis Caching**: Implemented a dashboard cache in `app/routers/invoices.py` using `app/core/cache.py`. It is completely optional—if `REDIS_URL` is missing from the `.env` file, the app gracefully bypasses the cache without crashing.

## 4. Current Deployment Status (Ready for Production)
The codebase has been prepped for free-tier hosting:
- **Frontend (Vercel)**: `vercel.json` is set up for React Router rewrites.
- **Backend Option 1 (Render)**: `render.yaml` infrastructure-as-code is ready with persistent disk mounting for the SQLite DB.
- **Backend Option 2 (Hugging Face Spaces - Gradio)**: 
  - `gradio` is added to `requirements.txt`.
  - `app.py` has been created in the root directory. It mounts a dummy Gradio UI at `/gradio` and serves the core FastAPI application at the root (`/`), bypassing the Docker requirement and utilizing the free Gradio SDK.
  - CORS in `app/main.py` is configured to accept Vercel traffic (`allow_origin_regex=r"https://.*\.vercel\.app"`).

## 5. How to Run Locally
1. Backend: `.\venv\Scripts\Activate.ps1; uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`
2. Frontend: `cd frontend; npm run dev`
