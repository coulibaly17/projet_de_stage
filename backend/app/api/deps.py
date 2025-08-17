from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.schemas.token import TokenPayload

# Endpoint pour l'authentification OAuth2
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/token"
)

def get_db() -> Generator:
    """
    Dépendance pour obtenir une session de base de données.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    Dépendance pour obtenir l'utilisateur actuel à partir du token JWT.
    """
    print(f"Tentative d'authentification avec token: {token[:15]}...")
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        print(f"Token décodé avec succès: {payload}")
        token_data = TokenPayload(**payload)
        
        # Vérifier que le sujet du token est présent
        if token_data.sub is None:
            print("Erreur: Le token ne contient pas d'ID utilisateur (sub)")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalide: ID utilisateur manquant",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
    except (JWTError, ValidationError) as e:
        print(f"Erreur de décodage du token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Impossible de valider les informations d'identification: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Rechercher l'utilisateur par ID (convertir sub de chaîne en entier)
    try:
        user_id = int(token_data.sub)
        user = db.query(User).filter(User.id == user_id).first()
    except (ValueError, TypeError):
        print(f"Erreur: Impossible de convertir l'ID utilisateur '{token_data.sub}' en entier")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide: ID utilisateur incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user:
        print(f"Utilisateur avec ID {token_data.sub} non trouvé dans la base de données")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé"
        )
    
    print(f"Utilisateur authentifié: {user.email} (ID: {user.id}, Rôle: {user.role})")
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dépendance pour obtenir l'utilisateur actuel et vérifier qu'il est actif.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilisateur inactif"
        )
    return current_user

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dépendance pour obtenir l'utilisateur actuel et vérifier qu'il est un superutilisateur.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privilèges insuffisants"
        )
    return current_user
