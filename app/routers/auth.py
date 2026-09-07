from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.schemas.auth import LoginRequest, Token, TokenData
from app.core.security import verify_password, create_access_token
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=Token, status_code=status.HTTP_201_CREATED)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # REPOSITORY LOGIC: Fetching user by email from the database
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    
    # In a real app we'd embed more into the token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Store minimal info in sub, or a JSON payload
    import json
    token_data = {
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "plant_id": user.plant_id
    }
    access_token = create_access_token(
        subject=json.dumps(token_data), expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
