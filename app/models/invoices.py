from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Date, ForeignKey, Text, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    plant_id = Column(Integer, ForeignKey("plants.id", ondelete="RESTRICT"), nullable=False, index=True)
    firm_id = Column(Integer, ForeignKey("firms.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    po_number = Column(String(50), nullable=False)
    po_date = Column(Date, nullable=False)
    
    invoice_number = Column(String(50), nullable=False)
    invoice_date = Column(Date, nullable=False)
    invoice_amount = Column(Numeric(15, 2), nullable=False)
    item_quantity_ordered = Column(Integer)
    
    current_stage = Column(String(50), nullable=False, index=True)
    current_stage_entered_at = Column(DateTime(timezone=True), nullable=False, index=True)
    current_owner_role = Column(String(50), index=True)
    status = Column(String(20), default="active", index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True))
    notes = Column(Text)
    
    __table_args__ = (
        UniqueConstraint('plant_id', 'po_number', 'invoice_number', name='uix_plant_po_invoice'),
    )

    plant = relationship("Plant")
    firm = relationship("Firm")
    creator = relationship("User")
