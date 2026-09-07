from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: int
    name: str
    role: str
    plant_id: int | None = None

class LoginRequest(BaseModel):
    email: str
    password: str
