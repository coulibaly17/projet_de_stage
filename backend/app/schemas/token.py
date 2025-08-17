from pydantic import BaseModel
from typing import Optional, Dict, Any
from .user import User


class TokenResponse(BaseModel):
    """Schema for JWT token response with user data."""
    access_token: str
    token_type: str
    user: User  # Utilisation du modèle User défini dans user.py

class TokenData(BaseModel):
    """Schema for token data."""
    username: Optional[str] = None

class TokenPayload(BaseModel):
    """Schema for JWT token payload."""
    sub: Optional[str] = None  # Subject (user id as string)
    exp: Optional[int] = None  # Expiration time
    iat: Optional[int] = None  # Issued at

# Alias pour la rétrocompatibilité
Token = TokenResponse
