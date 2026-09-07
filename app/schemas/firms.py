from pydantic import BaseModel
from datetime import datetime

class FirmBase(BaseModel):
    name: str
    gstin: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    payment_terms: str | None = None
    is_active: bool = True

class FirmCreate(FirmBase):
    pass

class FirmResponse(FirmBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
