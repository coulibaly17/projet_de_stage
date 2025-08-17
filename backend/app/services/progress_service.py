from typing import Dict, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models import UserProgress, Course, Lesson, Module
from ..schemas.progress import ProgressUpdate, UserProgressResponse, CourseProgress, ModuleProgress, LessonProgress

class ProgressService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_course_progress(self, user_id: int, course_id: int) -> Optional[UserProgress]:
        """Récupère la progression d'un utilisateur pour un cours spécifique"""
        return self.db.query(UserProgress).filter(
            and_(
                UserProgress.user_id == user_id,
                UserProgress.course_id == course_id,
                UserProgress.lesson_id.is_(None)  # Progression globale du cours
            )
        ).first()

    def get_user_lesson_progress(self, user_id: int, course_id: int, lesson_id: int) -> Optional[UserProgress]:
        """Récupère la progression d'un utilisateur pour une leçon spécifique"""
        return self.db.query(UserProgress).filter(
            and_(
                UserProgress.user_id == user_id,
                UserProgress.course_id == course_id,
                UserProgress.lesson_id == lesson_id
            )
        ).first()

    def update_lesson_progress(
        self, 
        user_id: int, 
        course_id: int, 
        lesson_id: int, 
        progress_data: ProgressUpdate
    ) -> UserProgress:
        """Met à jour la progression d'une leçon pour un utilisateur"""
        # Vérifier si le cours et la leçon existent
        course = self.db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Cours non trouvé")
            
        lesson = self.db.query(Lesson).filter(
            and_(
                Lesson.id == lesson_id,
                Lesson.course_id == course_id
            )
        ).first()
        
        if not lesson:
            raise HTTPException(status_code=404, detail="Leçon non trouvée")

        # Vérifier si l'utilisateur est inscrit au cours
        is_enrolled = any(student.id == user_id for student in course.students)
        if not is_enrolled:
            raise HTTPException(
                status_code=403,
                detail="Vous devez être inscrit à ce cours pour mettre à jour la progression"
            )

        # Récupérer ou créer l'entrée de progression
        progress = self.get_user_lesson_progress(user_id, course_id, lesson_id)
        
        if not progress:
            progress = UserProgress(
                user_id=user_id,
                course_id=course_id,
                lesson_id=lesson_id,
                is_completed=progress_data.is_completed,
                completion_percentage=progress_data.completion_percentage or 0.0
            )
            self.db.add(progress)
        else:
            if progress_data.is_completed is not None:
                progress.is_completed = progress_data.is_completed
            if progress_data.completion_percentage is not None:
                progress.completion_percentage = progress_data.completion_percentage
            progress.updated_at = datetime.utcnow()

        # Mettre à jour la progression globale du cours
        self._update_course_progress(user_id, course_id)
        
        self.db.commit()
        self.db.refresh(progress)
        return progress

    def _update_course_progress(self, user_id: int, course_id: int) -> None:
        """Met à jour la progression globale d'un cours"""
        # Récupérer toutes les leçons du cours
        lessons = self.db.query(Lesson).filter(Lesson.course_id == course_id).all()
        if not lessons:
            return
            
        # Récupérer toutes les progressions des leçons pour cet utilisateur
        lesson_progresses = self.db.query(UserProgress).filter(
            and_(
                UserProgress.user_id == user_id,
                UserProgress.course_id == course_id,
                UserProgress.lesson_id.isnot(None)
            )
        ).all()
        
        # Calculer la progression globale
        total_lessons = len(lessons)
        if total_lessons == 0:
            return
            
        completed_lessons = sum(1 for p in lesson_progresses if p.is_completed)
        completion_percentage = (completed_lessons / total_lessons) * 100
        
        # Mettre à jour ou créer la progression globale du cours
        course_progress = self.get_user_course_progress(user_id, course_id)
        
        if not course_progress:
            course_progress = UserProgress(
                user_id=user_id,
                course_id=course_id,
                is_completed=completion_percentage >= 100,
                completion_percentage=completion_percentage
            )
            self.db.add(course_progress)
        else:
            course_progress.completion_percentage = completion_percentage
            course_progress.is_completed = completion_percentage >= 100
            course_progress.updated_at = datetime.utcnow()
        
        self.db.commit()

    def get_course_progress_details(
        self, 
        user_id: int, 
        course_id: int
    ) -> UserProgressResponse:
        """Récupère les détails de progression d'un cours pour un utilisateur"""
        # Vérifier si le cours existe
        course = self.db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Cours non trouvé")
            
        # Vérifier si l'utilisateur est inscrit au cours
        is_enrolled = any(student.id == user_id for student in course.students)
        if not is_enrolled:
            raise HTTPException(
                status_code=403,
                detail="Vous devez être inscrit à ce cours pour voir la progression"
            )
        
        # Récupérer la progression globale du cours
        course_progress = self.get_user_course_progress(user_id, course_id)
        
        # Récupérer tous les modules et leçons du cours
        modules = self.db.query(Module).filter(Module.course_id == course_id).order_by(Module.order_index).all()
        
        # Préparer la réponse
        response = UserProgressResponse(
            course_id=course_id,
            course_title=course.title,
            progress_percentage=course_progress.completion_percentage if course_progress else 0.0,
            is_completed=course_progress.is_completed if course_progress else False,
            modules=[]
        )
        
        # Pour chaque module, récupérer les leçons et leur progression
        for module in modules:
            module_progress = ModuleProgress(
                module_id=module.id,
                module_title=module.title,
                order_index=module.order_index,
                lessons=[],
                completed_lessons=0,
                total_lessons=len(module.lessons)
            )
            
            for lesson in module.lessons:
                lesson_progress = self.get_user_lesson_progress(user_id, course_id, lesson.id)
                
                lesson_progress_data = LessonProgress(
                    lesson_id=lesson.id,
                    lesson_title=lesson.title,
                    order_index=lesson.order_index,
                    is_completed=lesson_progress.is_completed if lesson_progress else False,
                    completion_percentage=lesson_progress.completion_percentage if lesson_progress else 0.0,
                    last_accessed=lesson_progress.last_accessed if lesson_progress else None
                )
                
                if lesson_progress and lesson_progress.is_completed:
                    module_progress.completed_lessons += 1
                    
                module_progress.lessons.append(lesson_progress_data)
            
            response.modules.append(module_progress)
        
        return response
