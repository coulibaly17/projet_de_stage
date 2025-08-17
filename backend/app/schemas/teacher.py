from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DashboardStats(BaseModel):
    students: int
    courses: int
    assignments: int
    engagement: int

class StudentProgressResponse(BaseModel):
    id: int
    name: str
    email: str
    avatar: str
    course: str
    progress: int
    lastActivity: str

class RecommendationResponse(BaseModel):
    id: int
    type: str  # 'student', 'class', 'resource'
    title: str
    description: str
    actionText: str
    icon: str  # 'robot', 'chart', 'book'

class CourseCompletionItem(BaseModel):
    id: int
    name: str
    completion: int
    color: str

class CourseCompletionResponse(BaseModel):
    courses: List[CourseCompletionItem]
    overall: int

class ActivityResponse(BaseModel):
    id: int
    type: str  # 'assignment', 'submission', 'message', 'resource'
    title: str
    description: str
    time: str

class TaskResponse(BaseModel):
    id: int
    title: str
    deadline: str
    priority: str  # 'high', 'medium', 'low', 'normal'
    completed: bool

class TaskUpdateRequest(BaseModel):
    completed: Optional[bool] = None
    title: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None

class RecommendationActionRequest(BaseModel):
    action: str
