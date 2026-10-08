from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import invoices as schemas
from app.models.users import User
from app.dependencies import get_current_active_user
from app.services import invoice_workflow
from app.core import cache

# 1. APIRouter: This is like a "mini FastAPI app". Instead of putting all our routes in main.py, 
# we group invoice-related routes here, and then "include" this router in main.py.
router = APIRouter()

# 2. @router.get: This decorator tells FastAPI that any HTTP GET request to "/invoices/" 
# should be handled by this function.
# 3. response_model: This tells FastAPI to automatically convert the raw SQLAlchemy objects 
# returned by the workflow function into JSON, using the Pydantic schema `InvoiceResponse`.
@router.get("/", response_model=List[schemas.InvoiceResponse])
def read_invoices(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    # 4. Dependency Injection: FastAPI automatically runs `get_db` and provides a database connection.
    db: Session = Depends(get_db),
    # 5. Security: FastAPI automatically extracts the JWT token, validates it, and provides the current user!
    # If the user is not logged in, this route will automatically throw a 401 Unauthorized error.
    current_user: User = Depends(get_current_active_user)
):
    """Get all invoices (Filtered by plant access)"""
    cache_key = f"invoices:plant_{current_user.plant_id}:skip_{skip}:limit_{limit}:status_{status}:stage_{stage}"
    
    # 1. Try to fetch from Redis Cache first
    cached_data = cache.get_cache(cache_key)
    if cached_data:
        return cached_data
        
    # 2. Cache Miss: Fetch from SQLite DB
    db_invoices = invoice_workflow.get_invoices(db, current_user, skip, limit, status, stage)
    
    # 3. Serialize and save to Redis for next time
    serialized_invoices = [schemas.InvoiceResponse.model_validate(inv).model_dump(mode='json') for inv in db_invoices]
    cache.set_cache(cache_key, serialized_invoices)
    
    return db_invoices

@router.get("/{invoice_id}", response_model=schemas.InvoiceDetailResponse)
def read_invoice_detail(
    invoice_id: int, # FastAPI automatically parses this ID from the URL path (e.g., /invoices/5)
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get specific invoice details with audit trail"""
    return invoice_workflow.get_invoice_detail(db, invoice_id, current_user)

@router.post("/", response_model=schemas.InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    # 7. Pydantic Validation: FastAPI reads the incoming HTTP JSON body. 
    # If it doesn't strictly match the `InvoiceCreate` schema (e.g., missing a field), 
    # FastAPI automatically throws a 422 Validation Error. You never have to manually parse JSON!
    invoice_in: schemas.InvoiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Master Data Entry & Invoice Entry (Stage 1 & 2)"""
    
    # 8. RBAC (Role-Based Access Control): We manually check if this authenticated user 
    # is actually allowed to perform this specific action.
    if current_user.role != "store_officer":
        raise HTTPException(status_code=403, detail="Only store officers can create invoices")
    
    if not current_user.plant_id:
        raise HTTPException(status_code=400, detail="User must be assigned to a plant")
        
    new_invoice = invoice_workflow.create_invoice(db, invoice_in, current_user)
    
    # Invalidate the cache so the dashboard fetches the fresh data!
    cache.invalidate_cache(f"invoices:plant_{current_user.plant_id}:*")
    
    return new_invoice

@router.post("/{invoice_id}/material-receipt", response_model=schemas.InvoiceResponse)
def record_material_receipt(
    invoice_id: int, 
    receipt_in: schemas.MaterialReceiptCreate,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Record Material Receipt (Stage 3)"""
    if current_user.role != "store_officer":
        raise HTTPException(status_code=403, detail="Only store officers can record receipts")
        
    return invoice_workflow.record_material_receipt(db, invoice_id, receipt_in, current_user)

@router.post("/{invoice_id}/inspection", response_model=schemas.InvoiceResponse)
def confirm_inspection(
    invoice_id: int,
    inspection_in: schemas.InspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Confirm Inspection (Stage 4)"""
    if current_user.role != "store_officer":
        raise HTTPException(status_code=403, detail="Only store officers can confirm inspections")
        
    return invoice_workflow.confirm_inspection(db, invoice_id, current_user, inspection_in)

@router.post("/{invoice_id}/replacement", response_model=schemas.InvoiceResponse)
def record_replacement(
    invoice_id: int,
    replacement_in: schemas.ReplacementReceived,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Record Replacement Received from Firm (Stage 4.1)"""
    if current_user.role != "store_officer":
        raise HTTPException(status_code=403, detail="Only store officers can record replacements")
        
    return invoice_workflow.record_replacement(db, invoice_id, replacement_in, current_user)

@router.post("/{invoice_id}/verify", response_model=schemas.InvoiceResponse)
def verify_invoice(
    invoice_id: int,
    verify_in: schemas.VerifyInvoice,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Verify Invoice (Accounts Verification Stage)"""
    if current_user.role != "accounts_officer":
        raise HTTPException(status_code=403, detail="Only accounts officers can verify invoices")
        
    return invoice_workflow.verify_invoice(db, invoice_id, current_user, verify_in.observations_found)

@router.post("/{invoice_id}/payment", response_model=schemas.InvoiceResponse)
def record_payment(
    invoice_id: int,
    payment_in: schemas.RecordPayment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Record Payment (Final Stage)"""
    if current_user.role != "accounts_officer":
        raise HTTPException(status_code=403, detail="Only accounts officers can record payments")
        
    return invoice_workflow.record_payment(db, invoice_id, payment_in, current_user)

@router.post("/{invoice_id}/observation/reply", response_model=schemas.InvoiceResponse)
def proxy_observation_reply(
    invoice_id: int,
    reply_in: schemas.ReplyObservation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Proxy Firm Reply (Accounts Officer)"""
    if current_user.role != "accounts_officer":
        raise HTTPException(status_code=403, detail="Only accounts officers can record firm replies")
        
    return invoice_workflow.reply_to_observation(db, invoice_id, current_user, reply_in)
