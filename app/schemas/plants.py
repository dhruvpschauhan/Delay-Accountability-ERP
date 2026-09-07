from pydantic import BaseModel
from datetime import datetime

class PlantBase(BaseModel):
    code: str
    name: str
    location: str | None = None
    manager_name: str | None = None
    manager_email: str | None = None
    active: bool = True

class PlantCreate(PlantBase):
    pass

class PlantResponse(PlantBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}
