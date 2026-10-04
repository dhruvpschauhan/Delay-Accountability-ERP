from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from jwt.exceptions import InvalidTokenError as JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.core.config import settings

# This sets up FastAPI's built-in OAuth2 security scheme.
# It tells FastAPI: "If an endpoint requires authentication, look for a Bearer token in the Authorization header."
# The 'tokenUrl' is just documentation for the Swagger UI (http://localhost:8000/docs) 
# so it knows which endpoint to hit when you click the "Authorize" button.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    This is the core Authentication Dependency. 
    It is injected into routers (like @router.get("/", dependencies=[Depends(get_current_user)])).
    
    FastAPI automatically:
    1. Extracts the JWT token from the incoming HTTP request header using `oauth2_scheme`.
    2. Opens a database session using `get_db`.
    """
    
    # We define a standard 401 Unauthorized error to throw if ANYTHING goes wrong.
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # STEP 1: Decode the JWT token cryptographically using our SECRET_KEY.
        # If the token was tampered with by a hacker, or if it has expired, 
        # this will throw a JWTError and immediately reject the request.
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # STEP 2: Extract the user ID from the decoded payload.
        user_id = payload.get("id")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # STEP 3: REPOSITORY LOGIC. Now that we trust the token, we fetch the actual User object
    # from the PostgreSQL database using SQLAlchemy to ensure they haven't been deleted.
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
        
    # STEP 4: Return the SQLAlchemy User object. 
    # Any router function that depends on this will now have access to the fully populated `user` object!
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    """
    A secondary dependency that stacks on top of `get_current_user`.
    It first authenticates the user, and then runs an Authorization check to ensure 
    their account hasn't been disabled (is_active = False) by an admin.
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
