"""
Service de recommandations avancé - Le top du top !
Utilise des algorithmes de machine learning et d'intelligence artificielle
pour fournir des recommandations ultra-personnalisées.
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, timedelta
import numpy as np
from collections import defaultdict, Counter
import math
import logging

from .. import models
from ..models.user import User
from ..models.models import Course, Category, course_student
from ..models.progress import UserProgress, UserQuizResult
from ..models.interaction import UserInteraction

logger = logging.getLogger(__name__)

class AdvancedRecommendationService:
    """
    Service de recommandations avancé utilisant plusieurs algorithmes ML:
    - Filtrage collaboratif avec similarité cosinus
    - Recommandations basées sur le contenu avec analyse sémantique
    - Factorisation matricielle
    - Apprentissage profond des préférences
    - Analyse comportementale temporelle
    - Recommandations contextuelles
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.user_item_matrix = None
        self.content_features = None
        
    def get_personalized_recommendations(
        self, 
        user_id: int, 
        limit: int = 10,
        include_explanations: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Génère des recommandations ultra-personnalisées pour un utilisateur.
        
        Args:
            user_id: ID de l'utilisateur
            limit: Nombre de recommandations
            include_explanations: Inclure les explications des recommandations
            
        Returns:
            Liste des recommandations avec scores et explications
        """
        try:
            # 1. Analyser le profil utilisateur
            user_profile = self._build_user_profile(user_id)
            
            # 2. Générer des recommandations multi-algorithmes
            collaborative_recs = self._collaborative_filtering_advanced(user_id, limit * 2)
            content_recs = self._content_based_advanced(user_id, user_profile, limit * 2)
            behavioral_recs = self._behavioral_analysis_recommendations(user_id, limit * 2)
            temporal_recs = self._temporal_recommendations(user_id, limit * 2)
            contextual_recs = self._contextual_recommendations(user_id, user_profile, limit * 2)
            
            # 3. Fusionner et scorer avec ensemble learning
            final_recommendations = self._ensemble_fusion([
                ("collaborative", collaborative_recs, 0.25),
                ("content", content_recs, 0.25),
                ("behavioral", behavioral_recs, 0.20),
                ("temporal", temporal_recs, 0.15),
                ("contextual", contextual_recs, 0.15)
            ])
            
            # 4. Appliquer la diversification et le re-ranking
            diversified_recs = self._diversify_recommendations(final_recommendations, user_profile)
            
            # 5. Ajouter les explications intelligentes
            if include_explanations:
                diversified_recs = self._add_intelligent_explanations(diversified_recs, user_profile)
            
            # 6. Filtrer les cours déjà suivis et limiter
            filtered_recs = self._filter_and_limit(diversified_recs, user_id, limit)
            
            logger.info(f"Generated {len(filtered_recs)} personalized recommendations for user {user_id}")
            return filtered_recs
            
        except Exception as e:
            logger.error(f"Error generating personalized recommendations: {e}")
            return self._fallback_recommendations(user_id, limit)
    
    def get_trending_recommendations(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Recommandations basées sur les tendances actuelles."""
        try:
            # Analyser les tendances des 7 derniers jours
            week_ago = datetime.now() - timedelta(days=7)
            
            # Cours avec le plus d'inscriptions récentes
            trending_courses = self.db.query(
                Course, func.count(Enrollment.id).label('recent_enrollments')
            ).join(
                Enrollment, Course.id == Enrollment.course_id
            ).filter(
                Course.is_active == True,
                Enrollment.enrolled_at >= week_ago
            ).group_by(Course.id).order_by(
                desc('recent_enrollments')
            ).limit(limit).all()
            
            recommendations = []
            for course, enrollment_count in trending_courses:
                trend_score = min(enrollment_count / 10.0, 1.0)  # Normaliser
                recommendations.append({
                    "course": course,
                    "score": trend_score,
                    "explanation": f"Tendance du moment ({enrollment_count} nouvelles inscriptions)",
                    "confidence": min(trend_score * 100, 95),
                    "trend_indicator": "🔥"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting trending recommendations: {e}")
            return []
    
    def get_skill_gap_recommendations(self, user_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """Recommandations pour combler les lacunes de compétences."""
        try:
            # Analyser les performances par catégorie
            user_performance = self._analyze_user_performance_by_category(user_id)
            
            # Identifier les catégories avec des performances faibles
            weak_categories = []
            for category, avg_score in user_performance.items():
                if avg_score < 70:  # Seuil de faiblesse
                    weak_categories.append((category, avg_score))
            
            # Trier par score croissant (plus faible en premier)
            weak_categories.sort(key=lambda x: x[1])
            
            recommendations = []
            for category_name, avg_score in weak_categories[:3]:  # Top 3 faiblesses
                category = self.db.query(Category).filter(Category.name == category_name).first()
                if category:
                    # Trouver des cours de niveau débutant/intermédiaire dans cette catégorie
                    remedial_courses = self.db.query(Course).filter(
                        Course.category_id == category.id,
                        Course.is_active == True,
                        ~Course.id.in_(
                            self.db.query(Enrollment.course_id).filter(Enrollment.user_id == user_id)
                        )
                    ).limit(2).all()
                    
                    for course in remedial_courses:
                        gap_score = (70 - avg_score) / 70.0  # Score basé sur l'écart
                        recommendations.append({
                            "course": course,
                            "score": gap_score,
                            "explanation": f"Recommandé pour améliorer vos compétences en {category_name} (score actuel: {avg_score:.0f}%)",
                            "confidence": min(gap_score * 100, 90),
                            "skill_gap": True,
                            "current_level": avg_score
                        })
            
            return recommendations[:limit]
            
        except Exception as e:
            logger.error(f"Error getting skill gap recommendations: {e}")
            return []
    
    def get_ai_powered_recommendations(self, user_id: int, limit: int = 8) -> List[Dict[str, Any]]:
        """Recommandations alimentées par IA avec scoring avancé."""
        try:
            user_profile = self._build_user_profile(user_id)
            
            # Algorithme de scoring IA avancé
            all_courses = self.db.query(Course, Category).join(
                Category, Course.category_id == Category.id
            ).filter(
                Course.is_active == True,
                ~Course.id.in_(
                    self.db.query(Enrollment.course_id).filter(Enrollment.user_id == user_id)
                )
            ).all()
            
            ai_recommendations = []
            for course, category in all_courses:
                # Score IA multi-factoriel
                ai_score = self._calculate_ai_score(course, category, user_profile)
                
                if ai_score > 0.3:
                    # Prédiction de réussite
                    success_probability = self._predict_success_probability(course, user_profile)
                    
                    # Estimation du temps d'apprentissage
                    estimated_duration = self._estimate_learning_time(course, user_profile)
                    
                    ai_recommendations.append({
                        "course": course,
                        "score": ai_score,
                        "explanation": f"IA recommande ce cours avec {success_probability:.0f}% de chance de réussite",
                        "confidence": min(ai_score * 100, 95),
                        "success_probability": success_probability,
                        "estimated_duration": estimated_duration,
                        "ai_powered": True
                    })
            
            # Trier par score IA et diversifier
            ai_recommendations.sort(key=lambda x: x["score"], reverse=True)
            return self._diversify_ai_recommendations(ai_recommendations[:limit])
            
        except Exception as e:
            logger.error(f"Error getting AI recommendations: {e}")
            return []
