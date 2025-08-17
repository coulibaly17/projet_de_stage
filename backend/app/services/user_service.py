from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from .. import models, schemas

class UserService:
    @staticmethod
    def get_user(db: Session, user_id: int) -> models.User:
        """Récupère un utilisateur par son ID"""
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        return db_user
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
        """Récupère un utilisateur par son email"""
        return db.query(models.User).filter(models.User.email == email).first()
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
        """Récupère une liste d'utilisateurs avec pagination"""
        return db.query(models.User).offset(skip).limit(limit).all()
    
    @staticmethod
    def update_user(
        db: Session, 
        user_id: int, 
        user_update: schemas.UserUpdate,
        current_user: models.User
    ) -> models.User:
        """Met à jour les informations d'un utilisateur"""
        # Seul l'utilisateur lui-même ou un admin peut mettre à jour le profil
        if current_user.id != user_id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'êtes pas autorisé à modifier ce profil"
            )
        
        db_user = UserService.get_user(db, user_id)
        
        # Met à jour uniquement les champs fournis
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def delete_user(db: Session, user_id: int, current_user: models.User) -> dict:
        """
        Désactive un utilisateur (soft delete)
        
        Args:
            db: Session de la base de données
            user_id: ID de l'utilisateur à désactiver
            current_user: Utilisateur effectuant l'action (doit être admin)
            
        Returns:
            dict: Un message de confirmation
            
        Raises:
            HTTPException: Si l'utilisateur n'a pas les droits ou si une erreur survient
        """
        # Seul un admin peut désactiver un utilisateur
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Action non autorisée"
            )
        
        db_user = UserService.get_user(db, user_id)
        
        # Vérifier si c'est un enseignant avec des cours
        if db_user.role == 'enseignant' and db_user.taught_courses:
            # Désactiver l'enseignant mais conserver ses cours
            db_user.is_active = False
            db.commit()
            return {"message": "L'enseignant a été désactivé. Ses cours restent accessibles mais il ne pourra plus se connecter."}
        
        # Pour les autres utilisateurs (étudiants, admins)
        db_user.is_active = False
        db.commit()
        return {"message": "L'utilisateur a été désactivé avec succès."}
    
    @staticmethod
    def get_user_progress(db: Session, user_id: int) -> schemas.LearningStats:
        """Récupère les statistiques d'apprentissage d'un utilisateur"""
        # Compte le nombre total de cours
        total_courses = db.query(models.Course).count()
        
        # Compte le nombre de cours complétés
        completed_courses = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == user_id,
            models.UserProgress.is_completed == True
        ).count()
        
        # Compte le nombre de cours en cours
        in_progress_courses = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == user_id,
            models.UserProgress.is_completed == False
        ).count()
        
        # Compte le nombre total de leçons
        total_lessons = db.query(models.Lesson).count()
        
        # Compte le nombre de leçons complétées
        completed_lessons = db.query(models.UserProgress).filter(
            models.UserProgress.user_id == user_id,
            models.UserProgress.lesson_id.isnot(None)
        ).count()
        
        # Calcule le temps d'étude total (en minutes)
        # Note: Cette partie est un exemple et nécessiterait un suivi réel du temps d'étude
        total_study_time = completed_lessons * 30  # Estimation: 30 minutes par leçon
        
        return schemas.LearningStats(
            total_courses=total_courses,
            completed_courses=completed_courses,
            in_progress_courses=in_progress_courses,
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            total_study_time=total_study_time
        )
