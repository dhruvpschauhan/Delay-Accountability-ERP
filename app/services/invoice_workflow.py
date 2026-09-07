from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models import invoices as models
from app.models import events
from app.models import workflow
from app.schemas import invoices as schemas

def get_now() -> datetime:
    return datetime.now(timezone.utc)

def close_current_stage(db: Session, invoice: models.Invoice):
    """Finds the open stage_event and closes it, calculating duration."""
    # REPOSITORY LOGIC: Fetching the active event from the database
    current_event = db.query(events.StageEvent).filter(
        events.StageEvent.invoice_id == invoice.id,
        events.StageEvent.exited_at == None
    ).order_by(events.StageEvent.entered_at.desc()).first()
    
    if current_event:
        now = get_now()
        current_event.exited_at = now
        delta = now - current_event.entered_at
        current_event.duration_hours = round(delta.total_seconds() / 3600, 2)
        db.add(current_event)

def open_new_stage(db: Session, invoice: models.Invoice, stage_name: str, delay_type: str, acted_by_user_id: int | None = None):
    """Creates a new stage_event."""
    now = get_now()
    new_event = events.StageEvent(
        invoice_id=invoice.id,
        stage_name=stage_name,
        entered_at=now,
        acted_by_user_id=acted_by_user_id,
        delay_type=delay_type
    )
    db.add(new_event)
    
    invoice.current_stage = stage_name
    invoice.current_stage_entered_at = now
    db.add(invoice)
    return new_event

def create_invoice(db: Session, invoice_in: schemas.InvoiceCreate, user_id: int, plant_id: int):
    # Check if duplicate PO + invoice combination exists
    # REPOSITORY LOGIC: Checking for duplicate invoices in the database
    existing = db.query(models.Invoice).filter(
        models.Invoice.plant_id == plant_id,
        models.Invoice.po_number == invoice_in.po_number,
        models.Invoice.invoice_number == invoice_in.invoice_number
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail="Invoice for this PO already exists.")
        
    now = get_now()
    db_invoice = models.Invoice(
        plant_id=plant_id,
        firm_id=invoice_in.firm_id,
        created_by_user_id=user_id,
        po_number=invoice_in.po_number,
        po_date=invoice_in.po_date,
        invoice_number=invoice_in.invoice_number,
        invoice_date=invoice_in.invoice_date,
        invoice_amount=invoice_in.invoice_amount,
        item_quantity_ordered=invoice_in.item_quantity_ordered,
        current_stage="invoice_entry",
        current_stage_entered_at=now,
        current_owner_role="store",
        notes=invoice_in.notes
    )
    db.add(db_invoice)
    db.flush() # flush to get ID
    
    # Create the invoice_entry stage
    open_new_stage(
        db=db, 
        invoice=db_invoice, 
        stage_name="invoice_entry", 
        delay_type="internal", 
        acted_by_user_id=user_id
    )
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def record_material_receipt(db: Session, invoice_id: int, receipt_in: schemas.MaterialReceiptCreate, user_id: int):
    # REPOSITORY LOGIC: Fetching the invoice from the database
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.current_stage not in ["invoice_entry", "replacement_processing"]:
        raise HTTPException(status_code=409, detail="Invoice is not in a valid stage for material receipt.")
        
    close_current_stage(db, invoice)
    open_new_stage(db, invoice, "material_receipt", "internal", user_id)
    
    receipt = workflow.MaterialReceipt(
        invoice_id=invoice.id,
        receipt_date=receipt_in.receipt_date,
        quantity_received=receipt_in.quantity_received,
        received_by_user_id=user_id,
        receipt_notes=receipt_in.receipt_notes
    )
    db.add(receipt)
    db.commit()
    db.refresh(invoice)
    return invoice

def confirm_inspection(db: Session, invoice_id: int, user_id: int):
    """
    Branching logic AFTER inspection.
    """
    # REPOSITORY LOGIC: Fetching the invoice from the database
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice or invoice.current_stage != "inspection_summary":
        raise HTTPException(status_code=409, detail="Invoice not in inspection_summary stage.")
        
    # Get the latest material receipt to check the acceptance_type
    # REPOSITORY LOGIC: Fetching the latest material receipt related to the invoice
    latest_receipt = db.query(workflow.MaterialReceipt).filter(
        workflow.MaterialReceipt.invoice_id == invoice.id
    ).order_by(workflow.MaterialReceipt.id.desc()).first()
    
    # We close the inspection_summary stage
    close_current_stage(db, invoice)
    
    # Branching Logic
    if latest_receipt.acceptance_type == "full":
        # MOVE TO accounts_verification (forwarded_to_accounts)
        open_new_stage(db, invoice, "forwarded_to_accounts", "handoff", user_id)
        invoice.current_owner_role = "accounts"
    else:
        # MOVE TO partial_firm_intimation (AWAIT firm_response)
        open_new_stage(db, invoice, "partial_firm_intimation", "external_wait", None)
        invoice.current_owner_role = "external_firm"
        
    db.commit()
    db.refresh(invoice)
    return invoice

def verify_invoice(db: Session, invoice_id: int, user_id: int, observations_found: bool):
    """
    Branching logic AFTER accounts_verification.
    """
    # REPOSITORY LOGIC: Fetching the invoice from the database
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice or invoice.current_stage != "accounts_verification":
        raise HTTPException(status_code=409, detail="Invoice not in accounts_verification stage.")
        
    close_current_stage(db, invoice)
    now = get_now()
    
    if not observations_found:
        # MOVE TO invoice_passed
        open_new_stage(db, invoice, "invoice_passed", "internal", user_id)
        invoice.current_owner_role = "accounts"
    else:
        # CREATE observation_rounds row (round 1)
        new_round = workflow.ObservationRound(
            invoice_id=invoice.id,
            round_number=1, 
            raised_at=now,
            raised_by_user_id=user_id,
            target="firm" # placeholder
        )
        db.add(new_round)
        
        # MOVE TO observation_correspondence
        open_new_stage(db, invoice, "observation_correspondence", "external_wait", None)
        invoice.current_owner_role = "external_firm"
        
    db.commit()
    db.refresh(invoice)
    return invoice
