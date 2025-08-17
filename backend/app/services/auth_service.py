from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from ..models.user import User
from ..database import get_db
from ..schemas.token import TokenData
from ..config import settings

# Configuration for password hashing
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__default_rounds=12
)

# Fonction pour vérifier le mot de passe avec plus de logs
def verify_password_debug(plain_password: str, hashed_password: str) -> bool:
    """Vérifie un mot de passe avec des logs détaillés."""
    print(f"\n=== DÉBUT VÉRIFICATION MOT DE PASSE ===")
    print(f"Mot de passe fourni: {plain_password}")
    print(f"Hash stocké: {hashed_password}")
    
    # Vérifier si le hash commence par $2b$
    if not hashed_password.startswith('$2b$'):
        print("ERREUR: Le hash ne commence pas par $2b$")
        return False
    
    # Vérifier le format du hash
    try:
        # Essayer de vérifier le mot de passe
        is_valid = pwd_context.verify(plain_password, hashed_password)
        print(f"Résultat de la vérification: {'SUCCÈS' if is_valid else 'ÉCHEC'}")
        
        # Si échec, essayer de générer un nouveau hash pour débogage
        if not is_valid:
            print("\nEssai de génération d'un nouveau hash avec le même mot de passe:")
            new_hash = pwd_context.hash(plain_password)
            print(f"Nouveau hash généré: {new_hash}")
            print(f"Ancien hash: {hashed_password}")
            print(f"Les hashes sont-ils identiques? {new_hash == hashed_password}")
            
            # Essayer de vérifier avec le nouveau hash
            print("\nEssai de vérification avec le nouveau hash:")
            is_new_hash_valid = pwd_context.verify(plain_password, new_hash)
            print(f"Le nouveau hash est {'valide' if is_new_hash_valid else 'invalide'}")
            
        return is_valid
    except Exception as e:
        print(f"ERREUR lors de la vérification du mot de passe: {str(e)}")
        return False

# Remplacer la fonction verify_password existante par notre version de débogage
verify_password = verify_password_debug

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

# Configuration for JWT
# Utiliser la clé secrète définie dans settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

def get_password_hash(password: str) -> str:
    """Generate a password hash."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with user information."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # Ajouter des informations supplémentaires au jeton
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Get the current user from the token with enhanced error handling."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Décoder le token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        
        if not user_id_str:
            print("Aucun ID utilisateur trouvé dans le token")
            raise credentials_exception
            
        # Vérifier le type de token
        if payload.get("type") != "access":
            print(f"Type de token invalide: {payload.get('type')}")
            raise credentials_exception
            
        # Convertir l'ID utilisateur en entier
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            print(f"Erreur: Impossible de convertir l'ID utilisateur '{user_id_str}' en entier")
            raise credentials_exception
            
        # Rechercher l'utilisateur par ID
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            print(f"Aucun utilisateur trouvé avec l'ID: {user_id}")
            raise credentials_exception
            
        # Retourner directement l'utilisateur SQLAlchemy
        # La conversion en Pydantic sera gérée par la route
        return user
        
    except JWTError as e:
        print(f"Erreur JWT: {str(e)}")
        raise credentials_exception
    except Exception as e:
        print(f"Erreur inattendue lors de la récupération de l'utilisateur: {str(e)}")
        raise credentials_exception

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get the current active user."""
    from app.schemas.user import User as UserSchema
    
    # Message d'erreur pour utilisateur inactif
    inactive_error = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Votre compte a été désactivé. Veuillez contacter l'administrateur pour plus d'informations.",
        headers={"WWW-Authenticate": "Bearer"}
    )
    
    # Si l'utilisateur est déjà un modèle Pydantic, vérifier s'il est actif
    if isinstance(current_user, UserSchema):
        if not current_user.is_active:
            print(f"Tentative d'accès refusée: compte désactivé pour l'utilisateur {current_user.email}")
            raise inactive_error
        return current_user
    
    # Si c'est un modèle SQLAlchemy, vérifier s'il est actif
    if not current_user.is_active:
        print(f"Tentative d'accès refusée: compte désactivé pour l'utilisateur {current_user.email}")
        raise inactive_error
    
    return UserSchema.from_orm(current_user)

def authenticate_user(db: Session, email: str, password: str):
    """
    Authenticate a user with email and password.
    Vérifie également si le compte utilisateur est actif.
    """
    from fastapi import HTTPException
    from fastapi import status
    
    print(f"Tentative d'authentification pour l'email: {email}")
    
    # Recherche par email ou nom d'utilisateur
    user = db.query(User).filter(
        (User.email == email) | (User.username == email)
    ).first()
    
    if not user:
        print(f"Aucun utilisateur trouvé avec l'email/nom d'utilisateur: {email}")
        return False
    
    print(f"Utilisateur trouvé: {user.email} (ID: {user.id})")
    print(f"Statut actif: {'Oui' if user.is_active else 'Non'}")
    
    # Vérifier si le compte est actif avant de vérifier le mot de passe
    if not user.is_active:
        print(f"Tentative de connexion refusée: le compte est désactivé pour l'utilisateur {email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte a été désactivé",
            headers={"X-Error-Code": "ACCOUNT_DISABLED"}
        )
    
    print(f"Hash du mot de passe stocké: {user.password_hash}")
    
    # Vérifier le mot de passe
    if not verify_password(password, user.password_hash):
        print("Échec de la vérification du mot de passe")
        return False
    
    print("Authentification réussie!")
    return user

def create_user(db: Session, user_data: dict):
    """Create a new user with hashed password."""
    # Vérifier si l'utilisateur existe déjà
    existing_user = db.query(User).filter(
        (User.email == user_data["email"]) | 
        (User.username == user_data.get("username"))
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )
    
    # Créer un nouvel utilisateur
    hashed_password = get_password_hash(user_data["password"])
    db_user = User(
        username=user_data.get("username") or user_data["email"].split('@')[0],
        email=user_data["email"],
        password_hash=hashed_password,
        first_name=user_data.get("first_name", ""),
        last_name=user_data.get("last_name", ""),
        role=user_data.get("role", "etudiant"),
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
