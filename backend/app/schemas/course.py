from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Schémas pour les catégories
class CategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None

class Category(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

# Schémas pour les cours
class TagBase(BaseModel):
    name: str = Field(..., max_length=50)

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    
    class Config:
        from_attributes = True

class LessonBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    duration: Optional[int] = None
    order_index: int

class LessonCreate(LessonBase):
    pass

class Lesson(LessonBase):
    id: int
    module_id: int
    
    class Config:
        from_attributes = True

class ModuleBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    order_index: int

class ModuleCreate(ModuleBase):
    pass

class Module(ModuleBase):
    id: int
    course_id: int
    lessons: List[Lesson] = []
    
    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    level: str
    duration: Optional[int] = None
    is_published: bool = False

class CourseCreate(CourseBase):
    tags: List[str] = []

class CourseUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    level: Optional[str] = None
    duration: Optional[int] = None
    is_published: Optional[bool] = None

class Course(CourseBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    tags: List[Tag] = []
    modules: List[Module] = []
    category: Optional[Category] = None
    
    class Config:
        from_attributes = True

class CourseWithProgress(Course):
    progress: Optional[float] = 0.0
    is_enrolled: bool = False
