from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import invoices as schemas
from app.models.users import User
from app.dependencies import get_current_active_user
from app.services import invoice_workflow

router = APIRouter()

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
        
    return invoice_workflow.create_invoice(db, invoice_in, current_user.id, current_user.plant_id)

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
        
    return invoice_workflow.record_material_receipt(db, invoice_id, receipt_in, current_user.id)
