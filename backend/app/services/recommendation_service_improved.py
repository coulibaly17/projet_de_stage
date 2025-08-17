from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from .. import models

class RecommendationService:
    """Service pour gérer les recommandations de cours."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_content_based_recommendations(
        self, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Récupère des recommandations basées sur le contenu.
        
        Args:
            limit: Nombre maximum de recommandations
            
        Returns:
            Liste des recommandations avec scores
        """
        # Implémentation basique - retourne les cours les plus populaires
        courses = (
            self.db.query(models.Course)
            .filter(models.Course.is_active == True)
            .order_by(desc(models.Course.created_at))
            .limit(limit)
            .all()
        )
        
        return [
            {
                "course": course,
                "score": 0.8,
                "reason": "Recommandé pour vous"
            }
            for course in courses
        ]
    
    def get_collaborative_filtering_recommendations(
        self, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Récupère des recommandations collaboratives.
        
        Args:
            limit: Nombre maximum de recommandations
            
        Returns:
            Liste des recommandations avec scores
        """
        # Implémentation basique - retourne les cours les plus populaires
        courses = (
            self.db.query(models.Course)
            .filter(models.Course.is_active == True)
            .order_by(desc(models.Course.created_at))
            .limit(limit)
            .all()
        )
        
        return [
            {
                "course": course,
                "score": 0.7,
                "reason": "Populaire parmi les utilisateurs similaires"
            }
            for course in courses
        ]
    
    def get_hybrid_recommendations(
        self, 
        user_id: str, 
        limit: int = 5, 
        content_weight: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Récupère des recommandations hybrides.
        
        Args:
            user_id: ID de l'utilisateur
            limit: Nombre maximum de recommandations
            content_weight: Poids du contenu vs collaboratif
            
        Returns:
            Liste des recommandations avec scores
        """
        # Implémentation basique - combine les deux approches
        content_recs = self.get_content_based_recommendations(limit // 2)
        collab_recs = self.get_collaborative_recommendations(user_id, limit - len(content_recs))
        
        # Combine et ajuste les scores
        all_recs = []
        for rec in content_recs:
            rec["score"] = rec["score"] * content_weight
            all_recs.append(rec)
        
        for rec in collab_recs:
            rec["score"] = rec["score"] * (1 - content_weight)
            all_recs.append(rec)
        
        # Trie par score et limite
        all_recs.sort(key=lambda x: x["score"], reverse=True)
        return all_recs[:limit]
    
    def get_popular_courses(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Récupère les cours les plus populaires.
        
        Args:
            limit: Nombre maximum de cours
            
        Returns:
            Liste des cours populaires
        """
        courses = (
            self.db.query(models.Course)
            .filter(models.Course.is_active == True)
            .order_by(desc(models.Course.created_at))
            .limit(limit)
            .all()
        )
        
        return [
            {
                "course": course,
                "score": 1.0,
                "reason": "Cours populaire"
            }
            for course in courses
        ]