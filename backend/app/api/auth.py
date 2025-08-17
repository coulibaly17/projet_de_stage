from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import schemas, models
from ..database import get_db
from ..services import auth_service
from ..config import settings

router = APIRouter()

@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Crée un nouveau compte utilisateur.
    """
    try:
        # Convertir le schéma Pydantic en dictionnaire
        user_data = user.model_dump()
        # Créer l'utilisateur via le service
        db_user = auth_service.create_user(db=db, user_data=user_data)
        # Retourner l'utilisateur créé (sans le mot de passe)
        return db_user
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de créer l'utilisateur"
        )

from ..schemas.token import TokenResponse  # Import spécifique pour éviter la confusion

@router.post("/token", response_model=TokenResponse, include_in_schema=False)
@router.post("/login", response_model=TokenResponse)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authentifie un utilisateur et renvoie un jeton d'accès.
    Accepte à la fois /login et /token pour la compatibilité.
    """
    print(f"Tentative de connexion pour l'utilisateur: {form_data.username}")
    
    # Authentifier l'utilisateur avec email/username et mot de passe
    user = auth_service.authenticate_user(
        db, 
        email=form_data.username,  # Peut être un email ou un nom d'utilisateur
        password=form_data.password
    )
    
    if not user:
        print(f"Échec de l'authentification pour l'utilisateur: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crée un jeton d'accès avec plus d'informations
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_service.create_access_token(
        data={
            "sub": str(user.id),   # Sujet du token (ID de l'utilisateur converti en chaîne)
            "username": user.username,  # Nom d'utilisateur
            "email": user.email,   # Email de l'utilisateur
            "role": user.role,     # Rôle de l'utilisateur
        },
        expires_delta=access_token_expires
    )
    
    print(f"Connexion réussie pour l'utilisateur: {user.username} (ID: {user.id})")
    
    # Retourner le token et les informations de l'utilisateur
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_superuser": user.role == 'admin'
        }
    }

@router.get("/me", response_model=schemas.User)
async def read_users_me(
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Renvoie les informations de l'utilisateur actuellement connecté.
    """
    print(f"Récupération des informations pour l'utilisateur: {current_user.username} (ID: {current_user.id})")
    
    # Convertir l'utilisateur SQLAlchemy en modèle Pydantic
    user_schema = schemas.User.from_orm(current_user)
    return user_schema
