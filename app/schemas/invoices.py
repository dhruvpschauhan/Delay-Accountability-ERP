from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from .users import UserResponse
from .plants import PlantResponse
from .firms import FirmResponse

# Stage Event Schema
class StageEventResponse(BaseModel):
    id: int
    stage_name: str
    entered_at: datetime
    exited_at: Optional[datetime] = None
    duration_hours: Optional[float] = None
    acted_by_user_id: Optional[int] = None
    delay_type: Optional[str] = None
    notes: Optional[str] = None
    acted_by_user: Optional[UserResponse] = None

    model_config = {"from_attributes": True}

# Core Invoice Schemas
class InvoiceCreate(BaseModel):
    po_number: str
    po_date: date
    firm_id: int
    invoice_number: str
    invoice_date: date
    invoice_amount: float = Field(gt=0)
    item_quantity_ordered: int = Field(gt=0)
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: int
    plant_id: int
    firm_id: int
    created_by_user_id: int
    po_number: str
    po_date: date
    invoice_number: str
    invoice_date: date
    invoice_amount: float
    item_quantity_ordered: Optional[int] = None
    current_stage: str
    current_stage_entered_at: datetime
    current_owner_role: Optional[str] = None
    status: str
    created_at: datetime
    closed_at: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}

class InvoiceDetailResponse(InvoiceResponse):
    stage_events: List[StageEventResponse] = []
    # Add other relationships as needed (material_receipts, replacement_rounds, etc.)

# Material Receipt Schema
class MaterialReceiptCreate(BaseModel):
    receipt_date: date
    quantity_received: int = Field(gt=0)
    receipt_notes: Optional[str] = None

class InspectionCreate(BaseModel):
    inspection_date: date
    pbg_acceptance_date: Optional[date] = None
    contract_agreement_date: Optional[date] = None
    acknowledgement_date: Optional[date] = None
    acceptance_type: str  # "full" or "partial"
    partial_action: Optional[str] = None  # "replace" or "revise", only for partial
    revised_amount: Optional[float] = None
    acceptance_notes: Optional[str] = None

class InspectionConfirm(BaseModel):
    acceptance_confirmed: bool

class IntimateFirm(BaseModel):
    expected_reply_date: date
    intimation_notes: str = Field(min_length=20)

class FirmResponseUpdate(BaseModel):
    firm_response: str  # "replace" or "no_replace"
    reply_notes: Optional[str] = None

class ReplacementReceived(BaseModel):
    replacement_received_date: date
    replacement_quantity: int = Field(gt=0)
    replacement_notes: Optional[str] = None

class ReviseInvoice(BaseModel):
    revised_amount: float = Field(gt=0)
    reason: str

class VerifyInvoice(BaseModel):
    observations_found: bool
    verification_notes: Optional[str] = None

class RaiseObservation(BaseModel):
    observation_title: str = Field(min_length=10)
    observation_details: str = Field(min_length=20)
    target: str

class IntimateObservation(BaseModel):
    expected_reply_date: date
    intimation_notes: str

class ReplyObservation(BaseModel):
    reply_received_date: date
    reply_notes: str
    resubmit_to_accounts: bool

class ResolveObservation(BaseModel):
    resolved: bool
    resolution_notes: Optional[str] = None

class PassInvoice(BaseModel):
    passed_amount: float = Field(gt=0)
    frm_number: str

class RecordPayment(BaseModel):
    payment_date: date
    payment_method: str
    reference_number: str

class LogFollowup(BaseModel):
    related_round_type: Optional[str] = None
    related_round_id: Optional[int] = None
    method: str
    subject: str
    message: str
