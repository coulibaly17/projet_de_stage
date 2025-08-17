from datetime import datetime
from typing import Dict, Any, Optional, List, Union
from pydantic import BaseModel, Field, validator
from enum import Enum

class EntityType(str, Enum):
    COURSE = "course"
    LESSON = "lesson"
    QUIZ = "quiz"
    PAGE = "page"
    RECOMMENDATION = "recommendation"

class InteractionType(str, Enum):
    VIEW = "view"
    CLICK = "click"
    COMPLETE = "complete"
    START = "start"
    RATE = "rate"
    SEARCH = "search"
    DOWNLOAD = "download"
    SHARE = "share"

class InteractionBase(BaseModel):
    entity_type: EntityType = Field(..., description="Type d'entité (course, lesson, quiz, etc.)")
    entity_id: int = Field(..., description="ID de l'entité")
    interaction_type: InteractionType = Field(..., description="Type d'interaction (view, click, complete, etc.)")
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict, 
        description="Métadonnées supplémentaires",
        alias="interaction_metadata"
    )

    @validator('metadata')
    def validate_metadata(cls, v):
        # Limiter la taille des métadonnées pour éviter les abus
        if v and len(str(v)) > 1000:
            raise ValueError("Les métadonnées ne doivent pas dépasser 1000 caractères")
        return v

class InteractionCreate(InteractionBase):
    pass

class UserInteraction(InteractionBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UserInteractionStats(BaseModel):
    total_interactions: int
    last_interaction: Optional[datetime]
    interaction_types: Dict[str, int]
    entity_types: Dict[str, int]
