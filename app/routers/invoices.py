from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import invoices as schemas
from app.models.users import User
from app.dependencies import get_current_active_user
from app.services import invoice_workflow

router = APIRouter()

@router.get("/", response_model=List[schemas.InvoiceResponse])
def read_invoices(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all invoices (Filtered by plant access)"""
    return invoice_workflow.get_invoices(db, current_user, skip, limit, status, stage)

@router.get("/{invoice_id}", response_model=schemas.InvoiceDetailResponse)
def read_invoice_detail(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get specific invoice details with audit trail"""
    return invoice_workflow.get_invoice_detail(db, invoice_id, current_user)

@router.post("/", response_model=schemas.InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_in: schemas.InvoiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    """Master Data Entry & Invoice Entry (Stage 1 & 2)"""
    if current_user.role != "store_officer":
        raise HTTPException(status_code=403, detail="Only store officers can create invoices")
    
    if not current_user.plant_id:
        raise HTTPException(status_code=400, detail="User must be assigned to a plant")
        
    return invoice_workflow.create_invoice(db, invoice_in, current_user)

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
