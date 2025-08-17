from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.models import Course, Category
from app.services.auth_service import get_current_active_user
from app.services.advanced_recommendation_service import AdvancedRecommendationService
from pydantic import BaseModel
from datetime import datetime
import logging

# Configuration du logger
logger = logging.getLogger(__name__)

router = APIRouter()

# Schémas Pydantic pour les recommandations
class CourseRecommendation(BaseModel):
    id: int
    title: str
    description: str
    imageUrl: Optional[str] = None
    instructor: str
    category: str
    level: str
    duration: int  # en heures
    rating: float
    enrolledCount: int
    isSaved: bool = False
    matchScore: float
    matchReason: str
    algorithm: str
    confidence: float
    successProbability: Optional[float] = None
    estimatedTime: Optional[str] = None

class RecommendationResponse(BaseModel):
    recommendations: List[CourseRecommendation]
    totalCount: int
    algorithms: List[str]
    generatedAt: datetime
    userProfile: Optional[Dict[str, Any]] = None

# Endpoint racine pour les recommandations
@router.get("/", response_model=RecommendationResponse)
async def get_recommendations_root(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(default=10, ge=1, le=50),
    include_metadata: bool = Query(default=True, alias="includeMetadata"),
    sort_by: str = Query(default="score", alias="sortBy"),
    saved_only: bool = Query(default=False, alias="savedOnly")
):
    """
    Endpoint racine pour les recommandations - redirige vers les recommandations de cours.
    """
    # Rediriger vers l'endpoint des cours avec les mêmes paramètres
    return await get_course_recommendations(
        db=db,
        current_user=current_user,
        limit=limit,
        algorithm="ensemble",  # Utiliser l'algorithme ensemble par défaut
        include_profile=include_metadata
    )

class TrendingCourse(BaseModel):
    id: int
    title: str
    category: str
    enrollmentGrowth: float
    currentEnrollments: int
    rating: float

class SkillGap(BaseModel):
    skill: str
    currentLevel: float
    targetLevel: float
    gap: float
    recommendedCourses: List[int]

# Constantes pour éviter la duplication
LEVEL_BEGINNER = "Débutant"
LEVEL_INTERMEDIATE = "Intermédiaire"
LEVEL_ADVANCED = "Avancé"

# Le service sera instancié dans chaque fonction avec la session DB

@router.get("/courses", response_model=RecommendationResponse)
async def get_course_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(default=10, ge=1, le=50),
    algorithm: Optional[str] = Query(default=None, description="Algorithm to use: collaborative, content, behavioral, temporal, contextual, ensemble"),
    include_profile: bool = Query(default=False, description="Include user profile in response")
):
    """
    Récupère les recommandations de cours avancées pour l'utilisateur.
    """
    try:
        logger.info(f"Generating recommendations for user {current_user.id} with algorithm {algorithm}")
        
        # Utiliser la logique simple des cours recommandés du dashboard
        from app.models.models import course_student
        
        # Récupérer les cours auxquels l'utilisateur n'est pas inscrit
        enrolled_course_ids = db.query(course_student.c.course_id).filter(
            course_student.c.student_id == current_user.id
        ).all()
        enrolled_ids = [course_id for (course_id,) in enrolled_course_ids]
        
        if enrolled_ids:
            recommended_courses = db.query(Course).filter(
                ~Course.id.in_(enrolled_ids)
            ).limit(limit).all()
        else:
            recommended_courses = db.query(Course).limit(limit).all()
        
        # Convertir en format attendu par le service
        raw_recommendations = []
        for course in recommended_courses:
            raw_recommendations.append({
                "course": course,
                "score": 0.8,  # Score par défaut
                "explanation": "Cours recommandé pour vous",
                "confidence": 80.0,
                "success_probability": 85.0,
                "estimated_duration": "2-4 semaines",
                "algorithm": "content_based"
            })
        
        # Convertir en format API
        recommendations = []
        for rec in raw_recommendations:
            course = rec["course"]
            category = db.query(Category).filter(Category.id == course.category_id).first()
            
            recommendations.append(CourseRecommendation(
                id=course.id,
                title=course.title,
                description=course.description or "",
                imageUrl=course.thumbnail_url,
                instructor="Instructeur",  # Le modèle Course n'a pas d'attribut instructor
                category=category.name if category else "Général",
                level=course.level or "beginner",
                duration=20,  # Durée par défaut en heures
                rating=4.5,  # TODO: Calculer depuis les évaluations réelles
                enrolledCount=0,  # TODO: Calculer le nombre d'inscriptions
                isSaved=False,  # TODO: Vérifier les favoris utilisateur
                matchScore=rec["score"],
                matchReason=rec["explanation"],
                algorithm=rec["algorithm"],
                confidence=rec.get("confidence", 0.8),
                successProbability=rec.get("success_probability"),
                estimatedTime=rec.get("estimated_duration")
            ))
        
        # Construire la réponse
        response_data = {
            "recommendations": recommendations,
            "totalCount": len(recommendations),
            "algorithms": ["content_based"],  # Algorithme utilisé pour la génération
            "generatedAt": datetime.now()
        }
        
        # Inclure le profil utilisateur si demandé (version simplifiée)
        if include_profile:
            response_data["userProfile"] = {
                "userId": current_user.id,
                "email": current_user.email,
                "fullName": f"{current_user.first_name} {current_user.last_name}",
                "enrolledCoursesCount": len(enrolled_ids)
            }
        
        return RecommendationResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error generating recommendations for user {current_user.id}: {str(e)}", exc_info=True)
        # Retourner une réponse vide en cas d'erreur
        return RecommendationResponse(
            recommendations=[],
            totalCount=0,
            algorithms=[],
            generatedAt=datetime.now()
        )

@router.get("/trending", response_model=List[TrendingCourse])
async def get_trending_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    limit: int = Query(default=10, ge=1, le=20)
):
    """
    Récupère les cours tendances basés sur les inscriptions récentes.
    """
    try:
        # Récupérer les cours les plus populaires (par nombre d'inscriptions)
        from sqlalchemy import func, desc
        
        # Calculer la date d'il y a 7 jours
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        # Requête pour obtenir les cours avec le plus d'inscriptions récentes
        trending_courses = db.query(
            Course,
            func.count(course_student.c.student_id).label('enrollment_count')
        ).join(
            course_student,
            Course.id == course_student.c.course_id
        ).filter(
            course_student.c.enrolled_at >= week_ago
        ).group_by(
            Course.id
        ).order_by(
            desc('enrollment_count')
        ).limit(limit).all()
        
        # Construire la réponse
        result = []
        for course, enrollment_count in trending_courses:
            category = db.query(Category).filter(Category.id == course.category_id).first()
            
            # Calculer le taux de croissance (simplifié pour l'exemple)
            # Dans une vraie implémentation, on comparerait avec la période précédente
            growth_rate = 0.1  # 10% par défaut
            
            # Récupérer la note moyenne du cours (simplifié)
            avg_rating = 4.5  # À remplacer par une vraie requête sur les évaluations
            
            result.append(TrendingCourse(
                id=course.id,
                title=course.title,
                category=category.name if category else "Général",
                enrollmentGrowth=growth_rate,
                currentEnrollments=enrollment_count,
                rating=avg_rating
            ))
            
        return result
        
    except Exception as e:
        logger.error(f"Error fetching trending courses: {str(e)}", exc_info=True)
        # Retourner une liste vide en cas d'erreur plutôt que de lever une exception
        return []

@router.get("/skill-gaps", response_model=List[SkillGap])
async def get_skill_gaps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Identifie les lacunes de compétences de l'utilisateur.
    """
    try:
        recommendation_service = AdvancedRecommendationService(db)
        gaps_data = await recommendation_service.identify_skill_gaps(current_user.id)
        
        skill_gaps = []
        for gap in gaps_data:
            skill_gaps.append(SkillGap(
                skill=gap["skill"],
                currentLevel=gap["current_level"],
                targetLevel=gap["target_level"],
                gap=gap["gap"],
                recommendedCourses=gap["recommended_courses"]
            ))
        
        return skill_gaps
        
    except Exception as e:
        logger.error(f"Error identifying skill gaps for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'identification des lacunes de compétences"
        )

@router.post("/refresh")
async def refresh_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Force le rafraîchissement du cache des recommandations.
    """
    try:
        recommendation_service = AdvancedRecommendationService(db)
        
        # Vider le cache pour cet utilisateur
        await recommendation_service.clear_user_cache(current_user.id)
        
        # Générer de nouvelles recommandations
        fresh_recommendations = await recommendation_service.get_ensemble_recommendations(
            current_user.id, 10
        )
        
        return {
            "message": "Recommandations rafraîchies avec succès",
            "count": len(fresh_recommendations),
            "refreshedAt": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error refreshing recommendations for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du rafraîchissement des recommandations"
        )

@router.get("/profile")
async def get_user_recommendation_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère le profil de recommandation de l'utilisateur.
    """
    try:
        recommendation_service = AdvancedRecommendationService(db)
        profile = await recommendation_service.get_user_profile(current_user.id)
        return profile
        
    except Exception as e:
        logger.error(f"Error getting user profile for {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération du profil utilisateur"
        )

@router.get("/explain/{course_id}")
async def explain_recommendation(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Explique pourquoi un cours spécifique est recommandé à l'utilisateur.
    """
    try:
        recommendation_service = AdvancedRecommendationService(db)
        explanation = await recommendation_service.explain_recommendation(
            current_user.id, course_id
        )
        
        return {
            "courseId": course_id,
            "explanation": explanation,
            "generatedAt": datetime.now()
        }
        
    except Exception as e:
        logger.error(f"Error explaining recommendation for course {course_id} to user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'explication de la recommandation"
        )
