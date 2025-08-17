from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Literal
from datetime import datetime

# Types pour les rôles utilisateur
UserRole = Literal['etudiant', 'enseignant', 'admin']

# Schémas pour les utilisateurs
class UserBase(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r'^[a-zA-Z0-9_]+$',
        description="Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des underscores"
    )
    email: EmailStr
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    role: UserRole = 'etudiant'

    @validator('username')
    def username_to_lowercase(cls, v):
        return v.lower()

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None

class UserInDBBase(UserBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class User(UserInDBBase):
    full_name: Optional[str] = None
    is_active: bool = True
    is_superuser: bool = False
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
    
    @classmethod
    def from_orm(cls, obj):
        # Créer un dictionnaire avec les données de base
        data = {
            'id': obj.id,
            'username': obj.username,
            'email': obj.email,
            'first_name': obj.first_name,
            'last_name': obj.last_name,
            'role': obj.role,
            'is_active': getattr(obj, 'is_active', True)
        }
        
        # Ajouter les champs de date s'ils existent
        if hasattr(obj, 'created_at') and obj.created_at is not None:
            data['created_at'] = obj.created_at
        if hasattr(obj, 'updated_at') and obj.updated_at is not None:
            data['updated_at'] = obj.updated_at
            
        # Créer une instance du modèle
        user = cls(**data)
        
        # Définir les propriétés calculées
        user.full_name = f"{obj.first_name or ''} {obj.last_name or ''}".strip()
        user.is_superuser = obj.role == 'admin'
        return user

class UserInDB(UserInDBBase):
    password_hash: str

# Schémas pour l'authentification
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    username: Optional[str] = None
    
class UserLogin(BaseModel):
    email: str = Field(..., description="Email ou nom d'utilisateur")
    password: str = Field(..., min_length=8, max_length=100)
