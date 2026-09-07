from sqlalchemy import Column, Integer, String, DateTime, Date, Numeric, ForeignKey, Text, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class MaterialReceipt(Base):
    __tablename__ = "material_receipts"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    receipt_date = Column(Date, nullable=False, index=True)
    quantity_received = Column(Integer, nullable=False)
    received_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    receipt_notes = Column(Text)
    
    inspection_date = Column(Date)
    inspection_notes = Column(Text)
    pbg_acceptance_date = Column(Date)
    contract_agreement_date = Column(Date)
    acknowledgement_date = Column(Date)
    acceptance_type = Column(String(20))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ReplacementRound(Base):
    __tablename__ = "replacement_rounds"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    
    intimated_at = Column(DateTime(timezone=True), nullable=False)
    intimated_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    expected_reply_date = Column(Date)
    intimation_notes = Column(Text)
    
    firm_response = Column(String(20), index=True)
    replied_at = Column(DateTime(timezone=True))
    
    replacement_received_at = Column(DateTime(timezone=True))
    replacement_quantity = Column(Integer)
    replacement_notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('invoice_id', 'round_number', name='uix_invoice_round_replacement'),
    )

class InvoiceRevision(Base):
    __tablename__ = "invoice_revisions"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    original_amount = Column(Numeric(15, 2))
    revised_amount = Column(Numeric(15, 2))
    reason = Column(String(255))
    revised_at = Column(DateTime(timezone=True), nullable=False)
    revised_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    revision_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ObservationRound(Base):
    __tablename__ = "observation_rounds"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    
    raised_at = Column(DateTime(timezone=True), nullable=False)
    raised_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    observation_title = Column(String(255))
    observation_details = Column(Text)
    target = Column(String(50), index=True)
    
    intimated_at = Column(DateTime(timezone=True))
    intimated_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    expected_reply_date = Column(Date)
    
    replied_at = Column(DateTime(timezone=True))
    reply_notes = Column(Text)
    
    resubmitted_at = Column(DateTime(timezone=True))
    resubmitted_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    
    resolved_at = Column(DateTime(timezone=True), index=True)
    resolved_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    resolution_notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('invoice_id', 'round_number', name='uix_invoice_round_observation'),
    )

class Followup(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    related_round_type = Column(String(50))
    related_round_id = Column(Integer)
    
    sent_at = Column(DateTime(timezone=True), nullable=False, index=True)
    sent_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    method = Column(String(50))
    subject = Column(String(255))
    message = Column(Text)
    
    response_received_at = Column(DateTime(timezone=True))
    response_notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InvoicePassing(Base):
    __tablename__ = "invoice_passing"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    passed_at = Column(DateTime(timezone=True), nullable=False)
    passed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    passed_amount = Column(Numeric(15, 2))
    frm_number = Column(String(50))
    
    payment_date = Column(Date, index=True)
    payment_method = Column(String(50))
    reference_number = Column(String(100))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
