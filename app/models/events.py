from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class StageEvent(Base):
    __tablename__ = "stage_events"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    stage_name = Column(String(50), nullable=False, index=True)
    entered_at = Column(DateTime(timezone=True), nullable=False)
    exited_at = Column(DateTime(timezone=True), index=True)
    duration_hours = Column(Numeric(10, 2))
    
    acted_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True)
    delay_type = Column(String(20), index=True)
    
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    invoice = relationship("Invoice")
    actor = relationship("User")
