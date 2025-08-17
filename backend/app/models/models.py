from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Table, Float, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database import Base  # Import de Base depuis database.py

# Table de jointion pour les tags de cours
course_tags = Table(
    'course_tags',
    Base.metadata,
    Column('course_id', Integer, ForeignKey('courses.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

# Table de jointion pour la relation many-to-many entre User et Course (étudiants inscrits)
course_student = Table(
    'course_student',
    Base.metadata,
    Column('course_id', Integer, ForeignKey('courses.id')),
    Column('student_id', Integer, ForeignKey('users.id'))
)

# Table de jointion pour les prérequis entre cours
course_prerequisites = Table(
    'course_prerequisites',
    Base.metadata,
    Column('course_id', Integer, ForeignKey('courses.id')),
    Column('prerequisite_id', Integer, ForeignKey('courses.id'))
)

class CourseStatus(str, enum.Enum):
    # Accepter à la fois les valeurs en majuscules et minuscules pour compatibilité
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"
    draft = "draft"
    published = "published"
    archived = "archived"

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    short_description = Column(String(300), nullable=True)
    thumbnail_url = Column(String(255), nullable=True)
    status = Column(Enum(CourseStatus), default=CourseStatus.DRAFT, nullable=False)
    level = Column(String(50), default="beginner", nullable=False)  # Niveau du cours (débutant, intermédiaire, avancé)
    price = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    instructor_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    
    instructor = relationship("User", back_populates="taught_courses", foreign_keys=[instructor_id])
    students = relationship("User", secondary=course_student, back_populates="enrolled_courses")
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")
    prerequisites = relationship(
        "Course",
        secondary=course_prerequisites,
        primaryjoin=(id == course_prerequisites.c.course_id),
        secondaryjoin=(id == course_prerequisites.c.prerequisite_id),
        backref="required_by"
    )
    category = relationship("Category", back_populates="courses")
    tags = relationship("Tag", secondary=course_tags, back_populates="courses")
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    video_url = Column(String(255), nullable=True)
    duration = Column(Integer, default=0)  # Durée en secondes
    order_index = Column(Integer, default=0)
    is_free = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign keys
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    module_id = Column(Integer, ForeignKey('modules.id'), nullable=False)
    
    # Relationships
    course = relationship("Course", back_populates="lessons")
    module = relationship("Module", back_populates="lessons")
    resources = relationship("Resource", back_populates="lesson", cascade="all, delete-orphan")
    completed_by = relationship("LessonCompletion", back_populates="lesson")

class Resource(Base):
    __tablename__ = "resources"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    url = Column(String(255), nullable=False)
    type = Column(String(50))  # pdf, video, link, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    lesson_id = Column(Integer, ForeignKey('lessons.id'), nullable=False)
    
    lesson = relationship("Lesson", back_populates="resources")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    courses = relationship("Course", back_populates="category")

class LessonCompletion(Base):
    __tablename__ = "lesson_completions"
    
    id = Column(Integer, primary_key=True, index=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    lesson_id = Column(Integer, ForeignKey('lessons.id'), nullable=False)
    
    user = relationship("User", back_populates="completed_lessons")
    lesson = relationship("Lesson", back_populates="completed_by")

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relation avec les cours
    courses = relationship("Course", secondary=course_tags, back_populates="tags")

class Module(Base):
    __tablename__ = "modules"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    
    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")

# Mise à jour de la classe User pour inclure les relations
from .user import User

User.enrolled_courses = relationship(
    "Course", 
    secondary=course_student, 
    back_populates="students"
)

User.taught_courses = relationship(
    "Course", 
    back_populates="instructor",
    foreign_keys=[Course.instructor_id]
)

User.completed_lessons = relationship(
    "LessonCompletion", 
    back_populates="user"
)
