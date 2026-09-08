from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from fastapi import HTTPException, status
from app.models import invoices as models
from app.models import events
from app.models import workflow
from app.models import users
from app.schemas import invoices as schemas

def get_now() -> datetime:
    return datetime.now(timezone.utc)

def _get_invoice_for_user(db: Session, invoice_id: int, user: users.User) -> models.Invoice:
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if user.plant_id and invoice.plant_id != user.plant_id:
        raise HTTPException(status_code=403, detail="Not authorized to access invoices for this plant")
    return invoice

def get_invoices(db: Session, user: users.User, skip: int = 0, limit: int = 100, status: Optional[str] = None, stage: Optional[str] = None):
    """Fetch all invoices (with multi-tenant isolation)"""
    query = db.query(models.Invoice)
    
    # REPOSITORY LOGIC: Multi-tenant filtering
    if user.plant_id:
        query = query.filter(models.Invoice.plant_id == user.plant_id)
        
    if status:
        query = query.filter(models.Invoice.status == status)
    if stage:
        query = query.filter(models.Invoice.current_stage == stage)
        
    return query.order_by(models.Invoice.created_at.desc()).offset(skip).limit(limit).all()

def get_invoice_detail(db: Session, invoice_id: int, user: users.User):
    """Fetch specific invoice with full audit trail"""
    query = db.query(models.Invoice).filter(models.Invoice.id == invoice_id)
    
    # REPOSITORY LOGIC: Multi-tenant filtering
    if user.plant_id:
        query = query.filter(models.Invoice.plant_id == user.plant_id)
        
    # REPOSITORY LOGIC: Eagerly load the audit trail
    invoice = query.options(joinedload(models.Invoice.stage_events)).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    # Sort the events by entered_at descending (newest first)
    invoice.stage_events.sort(key=lambda x: x.entered_at, reverse=True)
    return invoice

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
        delta = now.replace(tzinfo=None) - current_event.entered_at.replace(tzinfo=None)
        current_event.duration_hours = round(delta.total_seconds() / 3600, 2)
        db.add(current_event)

def open_new_stage(db: Session, invoice: models.Invoice, stage_name: str, delay_type: str, acted_by_user_id: int | None = None, event_time: datetime | None = None):
    """Creates a new stage_event."""
    now = event_time or get_now()
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

def create_invoice(db: Session, invoice_in: schemas.InvoiceCreate, user: users.User):
    # Check if duplicate PO + invoice combination exists
    # REPOSITORY LOGIC: Checking for duplicate invoices in the database
    existing = db.query(models.Invoice).filter(
        models.Invoice.plant_id == user.plant_id,
        models.Invoice.po_number == invoice_in.po_number,
        models.Invoice.invoice_number == invoice_in.invoice_number
    ).first()
    
    if existing:
        raise HTTPException(status_code=409, detail="Invoice for this PO already exists.")
        
    now = get_now()
    db_invoice = models.Invoice(
        plant_id=user.plant_id,
        firm_id=invoice_in.firm_id,
        created_by_user_id=user.id,
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
        acted_by_user_id=user.id,
        event_time=now
    )
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def record_material_receipt(db: Session, invoice_id: int, receipt_in: schemas.MaterialReceiptCreate, user: users.User):
    # REPOSITORY LOGIC: Fetching the invoice from the database
    invoice = _get_invoice_for_user(db, invoice_id, user)
        
    if invoice.current_stage not in ["invoice_entry", "replacement_processing"]:
        raise HTTPException(status_code=409, detail="Invoice is not in a valid stage for material receipt.")
        
    close_current_stage(db, invoice)
    open_new_stage(db, invoice, "inspection_summary", "internal", user.id)
    
    receipt = workflow.MaterialReceipt(
        invoice_id=invoice.id,
        receipt_date=receipt_in.receipt_date,
        quantity_received=receipt_in.quantity_received,
        received_by_user_id=user.id,
        receipt_notes=receipt_in.receipt_notes
    )
    db.add(receipt)
    db.commit()
    db.refresh(invoice)
    return invoice

def confirm_inspection(db: Session, invoice_id: int, user: users.User, inspection_in: schemas.InspectionCreate = None):
    """
    Branching logic AFTER inspection.
    """
    # REPOSITORY LOGIC: Fetching the invoice from the database
    invoice = _get_invoice_for_user(db, invoice_id, user)
    if invoice.current_stage != "inspection_summary":
        raise HTTPException(status_code=409, detail="Invoice not in inspection_summary stage.")
        
    # Get the latest material receipt to check the acceptance_type
    # REPOSITORY LOGIC: Fetching the latest material receipt related to the invoice
    latest_receipt = db.query(workflow.MaterialReceipt).filter(
        workflow.MaterialReceipt.invoice_id == invoice.id
    ).order_by(workflow.MaterialReceipt.id.desc()).first()
    
    if not latest_receipt:
        raise HTTPException(status_code=400, detail="No material receipt found for this invoice.")
        
    if inspection_in:
        latest_receipt.inspection_date = inspection_in.inspection_date
        latest_receipt.pbg_acceptance_date = inspection_in.pbg_acceptance_date
        latest_receipt.contract_agreement_date = inspection_in.contract_agreement_date
        latest_receipt.acknowledgement_date = inspection_in.acknowledgement_date
        latest_receipt.acceptance_type = inspection_in.acceptance_type
        latest_receipt.inspection_notes = inspection_in.acceptance_notes
        db.add(latest_receipt)
    
    # We close the inspection_summary stage
    close_current_stage(db, invoice)
    
    # Branching Logic
    if latest_receipt.acceptance_type == "full":
        # MOVE TO accounts_verification (forwarded_to_accounts)
        open_new_stage(db, invoice, "forwarded_to_accounts", "handoff", user.id)
        invoice.current_owner_role = "accounts"
    else:
        if inspection_in and inspection_in.partial_action == "revise":
            if not inspection_in.revised_amount or inspection_in.revised_amount <= 0:
                raise HTTPException(status_code=400, detail="Revised amount must be greater than 0.")
                
            # Create InvoiceRevision
            revision = workflow.InvoiceRevision(
                invoice_id=invoice.id,
                original_amount=invoice.invoice_amount,
                revised_amount=inspection_in.revised_amount,
                reason="Partial Acceptance Revision",
                revised_at=get_now(),
                revised_by_user_id=user.id,
                revision_notes=inspection_in.acceptance_notes
            )
            db.add(revision)
            
            # Update invoice amount
            invoice.invoice_amount = inspection_in.revised_amount
            
            # MOVE TO accounts_verification directly
            open_new_stage(db, invoice, "forwarded_to_accounts", "handoff", user.id)
            invoice.current_owner_role = "accounts"
        else:
            # MOVE TO partial_firm_intimation (AWAIT firm_response)
            open_new_stage(db, invoice, "partial_firm_intimation", "external_wait", None)
            invoice.current_owner_role = "external_firm"
            
            # Start a ReplacementRound
            round_number = db.query(workflow.ReplacementRound).filter(
                workflow.ReplacementRound.invoice_id == invoice.id
            ).count() + 1
            
            replacement_round = workflow.ReplacementRound(
                invoice_id=invoice.id,
                round_number=round_number,
                intimated_at=get_now(),
                intimated_by_user_id=user.id,
                intimation_notes="Automatic round started due to partial or rejected inspection."
            )
            db.add(replacement_round)
            
    db.commit()
    db.refresh(invoice)
    return invoice

def record_replacement(db: Session, invoice_id: int, replacement_in: schemas.ReplacementReceived, user: users.User):
    """
    Record replacement receipt from the firm.
    """
    invoice = _get_invoice_for_user(db, invoice_id, user)
    
    if invoice.current_stage != "partial_firm_intimation":
        raise HTTPException(status_code=409, detail="Invoice is not awaiting firm replacement.")
        
    latest_round = db.query(workflow.ReplacementRound).filter(
        workflow.ReplacementRound.invoice_id == invoice.id
    ).order_by(workflow.ReplacementRound.round_number.desc()).first()
    
    if not latest_round:
        # Backward compatibility for invoices that entered this stage before ReplacementRound logic was added
        latest_round = workflow.ReplacementRound(
            invoice_id=invoice.id,
            round_number=1,
            intimated_at=invoice.current_stage_entered_at or get_now(),
            intimated_by_user_id=user.id,
            intimation_notes="Backward compatibility round creation."
        )
        db.add(latest_round)
        
    latest_round.replacement_received_at = replacement_in.replacement_received_date
    latest_round.replacement_quantity = replacement_in.replacement_quantity
    latest_round.replacement_notes = replacement_in.replacement_notes
    db.add(latest_round)
    
    close_current_stage(db, invoice)
    # Give it back to the store officer to do material receipt for the replacement
    open_new_stage(db, invoice, "replacement_processing", "internal", user.id)
    invoice.current_owner_role = "store_officer"
    
    db.commit()
    db.refresh(invoice)
    return invoice

def verify_invoice(db: Session, invoice_id: int, user: users.User, observations_found: bool):
    """
    Branching logic AFTER accounts_verification.
    """
    # REPOSITORY LOGIC: Fetching the invoice from the database
    invoice = _get_invoice_for_user(db, invoice_id, user)
    if invoice.current_stage not in ["accounts_verification", "forwarded_to_accounts"]:
        raise HTTPException(status_code=409, detail="Invoice not in accounts_verification or forwarded_to_accounts stage.")
        
    close_current_stage(db, invoice)
    now = get_now()
    
    if not observations_found:
        # MOVE TO invoice_passed
        open_new_stage(db, invoice, "invoice_passed", "internal", user.id)
        invoice.current_owner_role = "accounts"
    else:
        from sqlalchemy.sql import func
        max_round = db.query(func.max(workflow.ObservationRound.round_number)).filter(
            workflow.ObservationRound.invoice_id == invoice.id
        ).scalar() or 0

        # CREATE observation_rounds row
        new_round = workflow.ObservationRound(
            invoice_id=invoice.id,
            round_number=max_round + 1, 
            raised_at=now,
            raised_by_user_id=user.id,
            target="firm" # placeholder
        )
        db.add(new_round)
        
        # MOVE TO observation_correspondence
        open_new_stage(db, invoice, "observation_correspondence", "external_wait", None)
        invoice.current_owner_role = "external_firm"
        
    db.commit()
    db.refresh(invoice)
    return invoice
