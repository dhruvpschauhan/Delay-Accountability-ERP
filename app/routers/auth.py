from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.schemas.auth import Token
from app.core.security import verify_password, create_access_token
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=Token, status_code=status.HTTP_201_CREATED)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    OAuth2-compatible login endpoint.
    Accepts application/x-www-form-urlencoded with 'username' (email) and 'password'.
    """
    # REPOSITORY LOGIC: Fetching user by email from the database
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Embed user info as top-level JWT claims (not nested in sub)
    token_data = {
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "plant_id": user.plant_id,
    }
    access_token = create_access_token(
        subject=str(user.id), extra_claims=token_data, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
