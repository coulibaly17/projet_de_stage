"""
Utilitaires pour le service de recommandations avancé
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import numpy as np
from collections import defaultdict, Counter
import math

from ..models.user import User
from ..models.models import Course, Category, course_student
from ..models.progress import UserProgress, UserQuizResult
from ..models.interaction import UserInteraction

class RecommendationUtils:
    """Classe utilitaire pour les calculs de recommandations."""
    
    @staticmethod
    def build_user_profile(db: Session, user_id: int) -> Dict[str, Any]:
        """Construit un profil utilisateur détaillé."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}
        
        # Analyser les cours suivis
        enrollments = db.query(Course, Category).join(
            course_student, Course.id == course_student.c.course_id
        ).join(
            Category, Course.category_id == Category.id
        ).filter(course_student.c.student_id == user_id).all()
        
        # Analyser les performances aux quiz
        quiz_results = db.query(UserQuizResult).filter(
            UserQuizResult.user_id == user_id
        ).all()
        
        # Analyser les interactions
        interactions = db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id
        ).order_by(desc(UserInteraction.timestamp)).limit(1000).all()
        
        # Calculer les préférences par catégorie
        category_preferences = defaultdict(float)
        category_performance = defaultdict(list)
        
        for course, category in enrollments:
            category_preferences[category.name] += 1.0
            
        for quiz_result in quiz_results:
            if hasattr(quiz_result, 'quiz') and quiz_result.quiz:
                quiz_course = db.query(Course, Category).join(
                    Category, Course.category_id == Category.id
                ).filter(Course.id == quiz_result.quiz.course_id).first()
                
                if quiz_course:
                    category_performance[quiz_course[1].name].append(quiz_result.score)
        
        # Analyser les patterns temporels
        interaction_times = [i.timestamp.hour for i in interactions if i.timestamp]
        preferred_time = max(set(interaction_times), key=interaction_times.count) if interaction_times else 14
        
        # Analyser la difficulté préférée
        avg_performance = np.mean([r.score for r in quiz_results]) if quiz_results else 70.0
        preferred_difficulty = "intermediate"
        if avg_performance > 85:
            preferred_difficulty = "advanced"
        elif avg_performance < 60:
            preferred_difficulty = "beginner"
        
        return {
            "user_id": user_id,
            "category_preferences": dict(category_preferences),
            "category_performance": {k: np.mean(v) for k, v in category_performance.items()},
            "preferred_time": preferred_time,
            "preferred_difficulty": preferred_difficulty,
            "avg_performance": avg_performance,
            "total_courses": len(enrollments),
            "total_interactions": len(interactions),
            "learning_velocity": RecommendationUtils.calculate_learning_velocity(db, user_id),
            "engagement_score": RecommendationUtils.calculate_engagement_score(interactions),
            "learning_style": RecommendationUtils.infer_learning_style(interactions, quiz_results)
        }
    
    @staticmethod
    def collaborative_filtering_advanced(db: Session, user_id: int, limit: int) -> List[Dict[str, Any]]:
        """Filtrage collaboratif avancé avec similarité cosinus."""
        try:
            # Construire la matrice utilisateur-cours
            user_course_matrix = RecommendationUtils.build_user_course_matrix(db)
            
            if user_id not in user_course_matrix:
                return []
            
            # Calculer les similarités avec tous les autres utilisateurs
            user_similarities = {}
            target_user_vector = user_course_matrix[user_id]
            
            for other_user_id, other_vector in user_course_matrix.items():
                if other_user_id != user_id:
                    similarity = RecommendationUtils.cosine_similarity(target_user_vector, other_vector)
                    if similarity > 0.1:  # Seuil de similarité
                        user_similarities[other_user_id] = similarity
            
            # Recommander les cours des utilisateurs similaires
            course_scores = defaultdict(float)
            for similar_user_id, similarity in user_similarities.items():
                for course_id, rating in user_course_matrix[similar_user_id].items():
                    if course_id not in target_user_vector and rating > 0:
                        course_scores[course_id] += similarity * rating
            
            # Convertir en recommandations
            recommendations = []
            for course_id, score in sorted(course_scores.items(), key=lambda x: x[1], reverse=True)[:limit]:
                course = db.query(Course).filter(Course.id == course_id).first()
                if course:
                    recommendations.append({
                        "course": course,
                        "score": min(score, 1.0),
                        "algorithm": "collaborative",
                        "reason": f"Utilisateurs similaires ont apprécié ce cours (score: {score:.2f})"
                    })
            
            return recommendations
            
        except Exception as e:
            return []
    
    @staticmethod
    def content_based_advanced(db: Session, user_id: int, user_profile: Dict, limit: int) -> List[Dict[str, Any]]:
        """Recommandations basées sur le contenu avec analyse sémantique."""
        try:
            # Analyser les préférences de contenu de l'utilisateur
            preferred_categories = user_profile.get("category_preferences", {})
            preferred_difficulty = user_profile.get("preferred_difficulty", "intermediate")
            
            # Récupérer tous les cours disponibles
            available_courses = db.query(Course, Category).join(
                Category, Course.category_id == Category.id
            ).filter(
                Course.status == "published",
                ~Course.id.in_(
                    db.query(course_student.c.course_id).filter(course_student.c.student_id == user_id)
                )
            ).all()
            
            recommendations = []
            for course, category in available_courses:
                # Calculer le score de similarité de contenu
                content_score = 0.0
                
                # Score basé sur la catégorie
                if category.name in preferred_categories:
                    content_score += preferred_categories[category.name] * 0.4
                
                # Score basé sur la difficulté
                course_difficulty = RecommendationUtils.infer_course_difficulty(course)
                if course_difficulty == preferred_difficulty:
                    content_score += 0.3
                elif abs(RecommendationUtils.difficulty_to_num(course_difficulty) - 
                        RecommendationUtils.difficulty_to_num(preferred_difficulty)) == 1:
                    content_score += 0.15
                
                # Score basé sur la popularité
                popularity_score = RecommendationUtils.calculate_course_popularity(db, course.id)
                content_score += popularity_score * 0.2
                
                # Score basé sur la description
                semantic_score = RecommendationUtils.calculate_semantic_similarity(course, user_profile)
                content_score += semantic_score * 0.1
                
                if content_score > 0.1:
                    recommendations.append({
                        "course": course,
                        "score": min(content_score, 1.0),
                        "algorithm": "content",
                        "reason": f"Correspond à vos préférences ({category.name}, {course_difficulty})"
                    })
            
            # Trier et limiter
            recommendations.sort(key=lambda x: x["score"], reverse=True)
            return recommendations[:limit]
            
        except Exception as e:
            return []
    
    @staticmethod
    def calculate_ai_score(course: Course, category: Category, user_profile: Dict) -> float:
        """Calcule un score IA avancé pour un cours."""
        try:
            ai_score = 0.0
            
            # Facteur 1: Correspondance avec les préférences de catégorie
            category_preferences = user_profile.get("category_preferences", {})
            if category.name in category_preferences:
                ai_score += category_preferences[category.name] * 0.3
            
            # Facteur 2: Niveau de difficulté adapté
            course_difficulty = RecommendationUtils.infer_course_difficulty(course)
            preferred_difficulty = user_profile.get("preferred_difficulty", "intermediate")
            
            if course_difficulty == preferred_difficulty:
                ai_score += 0.25
            elif abs(RecommendationUtils.difficulty_to_num(course_difficulty) - 
                    RecommendationUtils.difficulty_to_num(preferred_difficulty)) == 1:
                ai_score += 0.15
            
            # Facteur 3: Performance historique dans la catégorie
            category_performance = user_profile.get("category_performance", {})
            if category.name in category_performance:
                performance = category_performance[category.name]
                if performance > 80:
                    ai_score += 0.2  # Bon dans cette catégorie
                elif performance < 60:
                    ai_score += 0.1  # Besoin d'amélioration
            
            # Facteur 4: Vélocité d'apprentissage
            learning_velocity = user_profile.get("learning_velocity", 1.0)
            if learning_velocity > 1.5:
                # Apprenant rapide -> cours plus avancés
                if course_difficulty in ["intermediate", "advanced"]:
                    ai_score += 0.15
            elif learning_velocity < 0.7:
                # Apprenant plus lent -> cours plus accessibles
                if course_difficulty in ["beginner", "intermediate"]:
                    ai_score += 0.15
            
            # Facteur 5: Style d'apprentissage
            learning_style = user_profile.get("learning_style", "balanced")
            course_style_match = RecommendationUtils.match_learning_style(course, learning_style)
            ai_score += course_style_match * 0.1
            
            return min(ai_score, 1.0)
            
        except Exception:
            return 0.5  # Score par défaut
    
    @staticmethod
    def predict_success_probability(course: Course, user_profile: Dict) -> float:
        """Prédit la probabilité de réussite d'un utilisateur pour un cours."""
        try:
            base_probability = 70.0  # Probabilité de base
            
            # Ajuster selon la performance moyenne
            avg_performance = user_profile.get("avg_performance", 70.0)
            performance_factor = (avg_performance - 50) / 50  # Normaliser autour de 50%
            base_probability += performance_factor * 20
            
            # Ajuster selon la difficulté du cours
            course_difficulty = RecommendationUtils.infer_course_difficulty(course)
            preferred_difficulty = user_profile.get("preferred_difficulty", "intermediate")
            
            if course_difficulty == preferred_difficulty:
                base_probability += 10
            elif abs(RecommendationUtils.difficulty_to_num(course_difficulty) - 
                    RecommendationUtils.difficulty_to_num(preferred_difficulty)) == 2:
                base_probability -= 15
            
            # Ajuster selon l'engagement
            engagement_score = user_profile.get("engagement_score", 0.5)
            base_probability += (engagement_score - 0.5) * 20
            
            # Ajuster selon la vélocité d'apprentissage
            learning_velocity = user_profile.get("learning_velocity", 1.0)
            base_probability += (learning_velocity - 1.0) * 10
            
            return max(30, min(95, base_probability))  # Limiter entre 30% et 95%
            
        except Exception:
            return 70.0  # Probabilité par défaut
    
    @staticmethod
    def estimate_learning_time(course: Course, user_profile: Dict) -> str:
        """Estime le temps d'apprentissage pour un cours."""
        try:
            # Estimation de base selon la difficulté
            base_hours = {
                "beginner": 15,
                "intermediate": 25,
                "advanced": 40
            }
            
            course_difficulty = RecommendationUtils.infer_course_difficulty(course)
            estimated_hours = base_hours.get(course_difficulty, 25)
            
            # Ajuster selon la vélocité d'apprentissage
            learning_velocity = user_profile.get("learning_velocity", 1.0)
            adjusted_hours = estimated_hours / learning_velocity
            
            # Formater la réponse
            if adjusted_hours < 10:
                return f"{adjusted_hours:.0f} heures"
            elif adjusted_hours < 50:
                return f"{adjusted_hours:.0f} heures ({adjusted_hours/7:.0f} semaines à 1h/jour)"
            else:
                return f"{adjusted_hours:.0f} heures ({adjusted_hours/14:.0f} semaines à 2h/jour)"
                
        except Exception:
            return "20-30 heures"
    
    # Méthodes utilitaires de base
    
    @staticmethod
    def build_user_course_matrix(db: Session) -> Dict[int, Dict[int, float]]:
        """Construit la matrice utilisateur-cours."""
        matrix = defaultdict(lambda: defaultdict(float))
        
        # Utiliser les inscriptions comme base
        enrollments = db.query(course_student).all()
        for enrollment in enrollments:
            matrix[enrollment.student_id][enrollment.course_id] = 1.0
        
        # Ajuster avec les résultats de quiz
        quiz_results = db.query(UserQuizResult).all()
        for result in quiz_results:
            if hasattr(result, 'quiz') and result.quiz and hasattr(result.quiz, 'course_id'):
                normalized_score = result.score / 100.0
                matrix[result.user_id][result.quiz.course_id] = max(
                    matrix[result.user_id][result.quiz.course_id],
                    normalized_score
                )
        
        return dict(matrix)
    
    @staticmethod
    def cosine_similarity(vector1: Dict, vector2: Dict) -> float:
        """Calcule la similarité cosinus entre deux vecteurs."""
        common_items = set(vector1.keys()) & set(vector2.keys())
        if not common_items:
            return 0.0
        
        sum1 = sum(vector1[item] * vector2[item] for item in common_items)
        sum2 = math.sqrt(sum(vector1[item] ** 2 for item in common_items))
        sum3 = math.sqrt(sum(vector2[item] ** 2 for item in common_items))
        
        if sum2 == 0 or sum3 == 0:
            return 0.0
        
        return sum1 / (sum2 * sum3)
    
    @staticmethod
    def calculate_learning_velocity(db: Session, user_id: int) -> float:
        """Calcule la vélocité d'apprentissage."""
        progress_records = db.query(UserProgress).filter(
            UserProgress.user_id == user_id
        ).order_by(UserProgress.last_accessed).all()
        
        if len(progress_records) < 2:
            return 1.0
        
        total_progress = sum(p.progress_percentage for p in progress_records)
        time_span = (progress_records[-1].last_accessed - progress_records[0].last_accessed).days
        
        if time_span == 0:
            return 1.0
        
        velocity = total_progress / time_span / 100.0
        return min(max(velocity, 0.1), 3.0)
    
    @staticmethod
    def calculate_engagement_score(interactions: List) -> float:
        """Calcule le score d'engagement."""
        if not interactions:
            return 0.5
        
        interaction_types = [i.interaction_type for i in interactions if hasattr(i, 'interaction_type') and i.interaction_type]
        unique_types = len(set(interaction_types))
        total_interactions = len(interactions)
        
        diversity_score = min(unique_types / 5.0, 1.0)
        frequency_score = min(total_interactions / 100.0, 1.0)
        
        return (diversity_score + frequency_score) / 2.0
    
    @staticmethod
    def infer_learning_style(interactions: List, quiz_results: List) -> str:
        """Infère le style d'apprentissage."""
        if not interactions:
            return "balanced"
        
        interaction_types = [i.interaction_type for i in interactions if hasattr(i, 'interaction_type') and i.interaction_type]
        type_counts = Counter(interaction_types)
        
        avg_quiz_score = np.mean([r.score for r in quiz_results]) if quiz_results else 70
        
        if type_counts.get("video_watch", 0) > type_counts.get("text_read", 0):
            return "visual"
        elif type_counts.get("quiz_attempt", 0) > len(interactions) * 0.3:
            return "kinesthetic"
        elif avg_quiz_score > 85:
            return "analytical"
        else:
            return "balanced"
    
    @staticmethod
    def infer_course_difficulty(course: Course) -> str:
        """Infère la difficulté d'un cours."""
        text = f"{course.title} {course.description}".lower()
        
        beginner_keywords = ["débutant", "introduction", "bases", "fondamentaux", "initiation"]
        advanced_keywords = ["avancé", "expert", "maîtrise", "professionnel", "spécialisé"]
        
        beginner_count = sum(1 for keyword in beginner_keywords if keyword in text)
        advanced_count = sum(1 for keyword in advanced_keywords if keyword in text)
        
        if beginner_count > advanced_count:
            return "beginner"
        elif advanced_count > beginner_count:
            return "advanced"
        else:
            return "intermediate"
    
    @staticmethod
    def difficulty_to_num(difficulty: str) -> int:
        """Convertit la difficulté en nombre."""
        mapping = {"beginner": 1, "intermediate": 2, "advanced": 3}
        return mapping.get(difficulty, 2)
    
    @staticmethod
    def calculate_course_popularity(db: Session, course_id: int) -> float:
        """Calcule la popularité d'un cours."""
        enrollment_count = db.query(course_student).filter(
            course_student.c.course_id == course_id
        ).count()
        
        return min(enrollment_count / 100.0, 1.0)
    
    @staticmethod
    def calculate_semantic_similarity(course: Course, user_profile: Dict) -> float:
        """Calcule la similarité sémantique."""
        course_text = f"{course.title} {course.description}".lower()
        category_preferences = user_profile.get("category_preferences", {})
        
        # Recherche de mots-clés liés aux préférences
        similarity_score = 0.0
        for category, preference_strength in category_preferences.items():
            if category.lower() in course_text:
                similarity_score += preference_strength * 0.1
        
        return min(similarity_score, 1.0)
    
    @staticmethod
    def match_learning_style(course: Course, learning_style: str) -> float:
        """Évalue la correspondance entre un cours et un style d'apprentissage."""
        course_text = f"{course.title} {course.description}".lower()
        
        style_keywords = {
            "visual": ["vidéo", "graphique", "image", "visuel", "schéma"],
            "kinesthetic": ["pratique", "exercice", "projet", "hands-on", "interactif"],
            "analytical": ["théorie", "analyse", "concept", "principe", "méthodologie"],
            "balanced": ["complet", "varié", "équilibré", "multiple", "diversifié"]
        }
        
        keywords = style_keywords.get(learning_style, [])
        matches = sum(1 for keyword in keywords if keyword in course_text)
        
        return min(matches / len(keywords), 1.0) if keywords else 0.5
