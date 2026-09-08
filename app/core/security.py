from datetime import datetime, timedelta, timezone
from typing import Optional, Any, Union
import jwt
from passlib.context import CryptContext
from .config import settings

# This CryptContext sets up the hashing algorithm we use for passwords.
# We are using 'bcrypt', which is an industry standard for securely hashing passwords.
# 'deprecated="auto"' allows passlib to automatically handle older password hashes if we ever upgrade the algorithm.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Takes a raw password provided by the user (e.g., during login) and securely compares it 
    against the hashed password stored in the database.
    Returns True if they match, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Takes a plain text password and securely hashes it using bcrypt.
    This is used when creating a new user or changing a password, ensuring that 
    the raw password is never stored in the database.
    """
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], extra_claims: dict = None, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generates a secure JSON Web Token (JWT) that acts as the user's "digital ID card".
    
    Args:
        subject: The primary identifier (e.g., user ID) stored in the 'sub' claim.
        extra_claims: Optional dict of additional claims (id, name, role, plant_id) 
                      embedded as top-level JWT fields for easy frontend decoding.
        expires_delta: Optional duration for how long the token should remain valid.
        
    Returns:
        The encoded JWT string that the frontend client will use in the Authorization header.
    """
    # 1. Determine exactly when this token should expire
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    # 2. Build the payload with expiration and subject
    to_encode = {"exp": expire, "sub": str(subject)}
    
    # 3. Merge any extra claims (id, name, role, plant_id) as top-level fields
    if extra_claims:
        to_encode.update(extra_claims)
    
    # 4. Cryptographically sign the token using our SECRET_KEY
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt
