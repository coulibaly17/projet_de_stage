from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from .. import models, schemas
from ..models.models import Module  # Import direct du modèle Module

class CourseService:
    @staticmethod
    def get_course(db: Session, course_id: int) -> models.Course:
        """Récupère un cours par son ID avec une structure cohérente"""
        from sqlalchemy.orm import joinedload
        
        # Charger le cours avec toutes les relations nécessaires
        db_course = db.query(models.Course).options(
            joinedload(models.Course.modules)
            .joinedload(models.Module.lessons),
            joinedload(models.Course.category),
            joinedload(models.Course.tags)
        ).filter(models.Course.id == course_id).first()
        
        if not db_course:
            raise HTTPException(status_code=404, detail="Cours non trouvé")
        
        # Si le cours a des leçons directes et aucun module, créer un module par défaut
        if hasattr(db_course, 'lessons') and db_course.lessons and not db_course.modules:
            from datetime import datetime
            
            # Créer un module par défaut
            default_module = models.Module(
                title="Contenu du cours",
                description="Toutes les leçons de ce cours",
                order_index=1,
                course_id=db_course.id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # Déplacer les leçons vers le module
            for lesson in db_course.lessons:
                lesson.module = default_module
            
            # Ajouter le module au cours
            if not hasattr(db_course, 'modules') or db_course.modules is None:
                db_course.modules = []
                
            db_course.modules.append(default_module)
            
            # Nettoyer les leçons directes pour éviter la redondance
            db_course.lessons = []
            
            # Sauvegarder les changements
            db.add(default_module)
            db.commit()
            db.refresh(db_course)
        
        return db_course
    
    @staticmethod
    def get_courses(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        level: Optional[str] = None,
        tag: Optional[str] = None,
        search: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> List[models.Course]:
        """Récupère une liste de cours avec filtres optionnels et progression utilisateur"""
        from sqlalchemy.orm import joinedload, contains_eager
        from sqlalchemy import or_
        
        print(f"\n--- SERVICE COURSE ---")
        print(f"Paramètres reçus: skip={skip}, limit={limit}, level={level}, tag={tag}, search={search}, user_id={user_id}")
        
        # Requête de base pour les cours
        query = db.query(models.Course)
        print(f"Requête de base créée")
        
        # Chargement des relations
        query = query.options(
            joinedload(models.Course.category),
            joinedload(models.Course.tags),
            joinedload(models.Course.modules)
            .joinedload(models.Module.lessons)
            .joinedload(models.Lesson.completed_by)
        )
        
        # Filtrage par niveau
        if level:
            query = query.filter(models.Course.level == level)
            
        # Filtrage par tag
        if tag:
            query = query.join(models.Course.tags).filter(models.Tag.name == tag)
            
        # Recherche par mot-clé
        if search:
            search = f"%{search}%"
            query = query.filter(
                (models.Course.title.ilike(search)) | 
                (models.Course.description.ilike(search))
            )
        
        # Exécution de la requête
        print(f"Exécution de la requête avec offset={skip}, limit={limit}")
        courses = query.offset(skip).limit(limit).all()
        print(f"Nombre de cours récupérés de la DB: {len(courses)}")
        
        if courses:
            print(f"Cours trouvés: {[(c.id, c.title) for c in courses[:3]]}")
        else:
            print("Aucun cours trouvé dans la base de données")
            # Vérifions s'il y a des cours du tout
            total_courses = db.query(models.Course).count()
            print(f"Nombre total de cours dans la DB: {total_courses}")
        
        # Si un user_id est fourni, marquer les leçons complétées
        if user_id is not None:
            print(f"Marquage des leçons complétées pour l'utilisateur {user_id}")
            for course in courses:
                for module in course.modules:
                    for lesson in module.lessons:
                        # Vérifier si la leçon est complétée par l'utilisateur
                        lesson.is_completed = any(
                            completion.user_id == user_id 
                            for completion in lesson.completed_by
                        )
        
        print(f"--- FIN SERVICE COURSE ---\n")
        return courses
    
    @staticmethod
    def create_course(db: Session, course: schemas.CourseCreate) -> models.Course:
        """Crée un nouveau cours"""
        # Vérifie si un cours avec le même titre existe déjà
        db_course = db.query(models.Course).filter(
            models.Course.title == course.title
        ).first()
        
        if db_course:
            raise HTTPException(
                status_code=400,
                detail="Un cours avec ce titre existe déjà"
            )
        
        # Crée le cours
        db_course = models.Course(
            title=course.title,
            description=course.description,
            thumbnail_url=course.thumbnail_url,
            level=course.level,
            duration=course.duration,
            is_published=course.is_published
        )
        
        # Ajoute les tags
        for tag_name in course.tags:
            # Vérifie si le tag existe déjà
            db_tag = db.query(models.Tag).filter(
                models.Tag.name == tag_name
            ).first()
            
            if not db_tag:
                # Crée un nouveau tag s'il n'existe pas
                db_tag = models.Tag(name=tag_name)
                db.add(db_tag)
                db.commit()
                db.refresh(db_tag)
            
            db_course.tags.append(db_tag)
        
        db.add(db_course)
        db.commit()
        db.refresh(db_course)
        
        return db_course
    
    @staticmethod
    def update_course(
        db: Session, 
        course_id: int, 
        course_update: schemas.CourseUpdate
    ) -> models.Course:
        """Met à jour un cours existant"""
        db_course = CourseService.get_course(db, course_id)
        
        # Met à jour les champs fournis
        update_data = course_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_course, field, value)
        
        db.commit()
        db.refresh(db_course)
        return db_course
    
    @staticmethod
    def delete_course(db: Session, course_id: int) -> bool:
        """Supprime un cours"""
        db_course = CourseService.get_course(db, course_id)
        db.delete(db_course)
        db.commit()
        return True
    
    @staticmethod
    def create_module(
        db: Session, 
        course_id: int, 
        module: schemas.ModuleCreate
    ) -> Module:
        """Crée un nouveau module pour un cours"""
        # Vérifie si le cours existe
        db_course = CourseService.get_course(db, course_id)
        
        # Vérifie si un module avec le même ordre existe déjà
        db_module = db.query(Module).filter(
            Module.course_id == course_id,
            Module.order_index == module.order
        ).first()
        
        if db_module:
            raise HTTPException(
                status_code=400,
                detail="Un module avec cet ordre existe déjà pour ce cours"
            )
        
        # Crée le module
        db_module = Module(
            title=module.title,
            description=module.description,
            order=module.order,
            course_id=course_id
        )
        
        db.add(db_module)
        db.commit()
        db.refresh(db_module)
        
        return db_module
    
    @staticmethod
    def create_lesson(
        db: Session, 
        module_id: int, 
        lesson: schemas.LessonCreate
    ) -> models.Lesson:
        """Crée une nouvelle leçon pour un module"""
        # Vérifie si le module existe
        db_module = db.query(models.Module).filter(
            models.Module.id == module_id
        ).first()
        
        if not db_module:
            raise HTTPException(status_code=404, detail="Module non trouvé")
        
        # Vérifie si une leçon avec le même ordre existe déjà
        db_lesson = db.query(models.Lesson).filter(
            models.Lesson.module_id == module_id,
            models.Lesson.order == lesson.order
        ).first()
        
        if db_lesson:
            raise HTTPException(
                status_code=400,
                detail="Une leçon avec cet ordre existe déjà pour ce module"
            )
        
        # Crée la leçon
        db_lesson = models.Lesson(
            title=lesson.title,
            description=lesson.description,
            content=lesson.content,
            video_url=lesson.video_url,
            duration=lesson.duration,
            order=lesson.order,
            module_id=module_id
        )
        
        db.add(db_lesson)
        db.commit()
        db.refresh(db_lesson)
        
        return db_lesson
    
    @staticmethod
    def get_course_with_progress(
        db: Session, 
        course_id: int, 
        user_id: int
    ) -> schemas.CourseWithProgress:
        """Récupère un cours avec les informations de progression de l'utilisateur"""
        from sqlalchemy.orm import joinedload
        
        # Récupère le cours avec une structure normalisée
        db_course = CourseService.get_course(db, course_id)
        
        # Vérifie si l'utilisateur est inscrit au cours
        user_progress = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == user_id,
            models.UserProgress.course_id == course_id
        ).first()
        
        # Calcule la progression globale du cours
        progress = 0.0
        is_enrolled = user_progress is not None
        
        if is_enrolled and user_progress:
            progress = user_progress.completion_percentage
        
        # Marquer les leçons complétées par l'utilisateur
        if is_enrolled and hasattr(db_course, 'modules'):
            completed_lessons = db.query(models.LessonCompletion.lesson_id).filter(
                models.LessonCompletion.user_id == user_id
            ).all()
            completed_lesson_ids = {lesson_id for (lesson_id,) in completed_lessons}
            
            for module in db_course.modules:
                for lesson in module.lessons:
                    lesson.is_completed = lesson.id in completed_lesson_ids
        
        # Convertit le modèle en Pydantic avec les informations de progression
        course_dict = db_course.__dict__
        course_dict["progress"] = progress
        course_dict["is_enrolled"] = is_enrolled
        
        return schemas.CourseWithProgress(**course_dict)
