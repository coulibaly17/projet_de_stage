from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class DashboardStats(BaseModel):
    coursesEnrolled: int
    completedCourses: int
    hoursSpent: int
    averageScore: int
    passedQuizzes: int

class InstructorInfo(BaseModel):
    id: int
    name: str
    avatar: str

class CourseInfo(BaseModel):
    id: int
    title: str

class CourseResponse(BaseModel):
    id: int
    title: str
    description: str
    imageUrl: str
    instructor: InstructorInfo
    progress: int
    duration: str
    lessonsCount: int
    completedLessons: int
    tags: List[str]
    isRecommended: Optional[bool] = None

class ActivityResponse(BaseModel):
    id: int
    type: str  # 'quiz', 'course', 'message', 'assignment', 'certificate'
    title: str
    description: str
    time: str
    course: Optional[CourseInfo] = None

class UpcomingQuizResponse(BaseModel):
    id: int
    title: str
    courseTitle: str
    courseId: int
    dueDate: str
    timeRemaining: str
    isImportant: bool

class LessonResponse(BaseModel):
    id: int
    title: str
    type: str  # 'video', 'quiz', 'text', 'assignment'
    duration: str
    isCompleted: bool
    isLocked: bool
    progress: Optional[int] = None
    isCurrent: Optional[bool] = None

class AttachmentResponse(BaseModel):
    id: int
    name: str
    url: str
    type: str

class LessonContentResponse(BaseModel):
    id: int
    title: str
    type: str
    content: str
    duration: str
    description: str
    attachments: Optional[List[AttachmentResponse]] = None

class CourseDetailResponse(BaseModel):
    course: CourseResponse
    lessons: List[LessonResponse]

class LessonCompleteResponse(BaseModel):
    success: bool
    message: str
    courseProgress: float
