"""
Script de test pour le service de recommandations avancé
"""

import asyncio
import sys
import os

# Ajouter le chemin du backend au PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal
from app.services.advanced_recommendation_service import AdvancedRecommendationService
from app.services.recommendation_utils import RecommendationUtils

async def test_recommendation_service():
    """Test basique du service de recommandations."""
    print("🚀 Test du service de recommandations avancé")
    print("=" * 50)
    
    # Créer une session de base de données
    db = SessionLocal()
    
    try:
        # Initialiser le service
        service = AdvancedRecommendationService()
        
        # Test 1: Profil utilisateur
        print("\n📊 Test 1: Construction du profil utilisateur")
        user_id = 1  # Utiliser un ID d'utilisateur existant
        
        try:
            profile = RecommendationUtils.build_user_profile(db, user_id)
            print(f"✅ Profil utilisateur créé pour l'utilisateur {user_id}")
            print(f"   - Catégories préférées: {profile.get('category_preferences', {})}")
            print(f"   - Performance moyenne: {profile.get('avg_performance', 0):.1f}%")
            print(f"   - Vélocité d'apprentissage: {profile.get('learning_velocity', 1.0):.2f}")
            print(f"   - Score d'engagement: {profile.get('engagement_score', 0.5):.2f}")
        except Exception as e:
            print(f"❌ Erreur lors de la création du profil: {str(e)}")
        
        # Test 2: Recommandations ensemble
        print("\n🎯 Test 2: Génération de recommandations ensemble")
        try:
            recommendations = await service.get_ensemble_recommendations(db, user_id, 5)
            print(f"✅ {len(recommendations)} recommandations générées")
            
            for i, rec in enumerate(recommendations[:3], 1):
                course = rec.get("course")
                if course:
                    print(f"   {i}. {course.title}")
                    print(f"      Score: {rec.get('score', 0):.2f}")
                    print(f"      Algorithme: {rec.get('algorithm', 'unknown')}")
                    print(f"      Raison: {rec.get('reason', 'N/A')}")
                else:
                    print(f"   {i}. Cours non trouvé")
        except Exception as e:
            print(f"❌ Erreur lors de la génération des recommandations: {str(e)}")
        
        # Test 3: Recommandations collaboratives
        print("\n👥 Test 3: Recommandations collaboratives")
        try:
            collab_recs = await service.get_collaborative_recommendations(db, user_id, 3)
            print(f"✅ {len(collab_recs)} recommandations collaboratives générées")
            
            for i, rec in enumerate(collab_recs, 1):
                course = rec.get("course")
                if course:
                    print(f"   {i}. {course.title} (Score: {rec.get('score', 0):.2f})")
        except Exception as e:
            print(f"❌ Erreur lors des recommandations collaboratives: {str(e)}")
        
        # Test 4: Recommandations basées sur le contenu
        print("\n📚 Test 4: Recommandations basées sur le contenu")
        try:
            content_recs = await service.get_content_based_recommendations(db, user_id, 3)
            print(f"✅ {len(content_recs)} recommandations de contenu générées")
            
            for i, rec in enumerate(content_recs, 1):
                course = rec.get("course")
                if course:
                    print(f"   {i}. {course.title} (Score: {rec.get('score', 0):.2f})")
        except Exception as e:
            print(f"❌ Erreur lors des recommandations de contenu: {str(e)}")
        
        # Test 5: Cours tendances
        print("\n📈 Test 5: Cours tendances")
        try:
            trending = await service.get_trending_courses(db, 3)
            print(f"✅ {len(trending)} cours tendances trouvés")
            
            for i, item in enumerate(trending, 1):
                course = item.get("course")
                if course:
                    print(f"   {i}. {course.title}")
                    print(f"      Croissance: {item.get('growth_rate', 0):.1f}%")
                    print(f"      Inscriptions: {item.get('current_enrollments', 0)}")
        except Exception as e:
            print(f"❌ Erreur lors de la récupération des tendances: {str(e)}")
        
        print("\n🎉 Tests terminés !")
        
    except Exception as e:
        print(f"❌ Erreur générale: {str(e)}")
    
    finally:
        db.close()

def test_utils():
    """Test des utilitaires de recommandation."""
    print("\n🔧 Test des utilitaires")
    print("=" * 30)
    
    # Test de la similarité cosinus
    vector1 = {1: 0.5, 2: 0.8, 3: 0.2}
    vector2 = {1: 0.3, 2: 0.9, 3: 0.1}
    
    similarity = RecommendationUtils.cosine_similarity(vector1, vector2)
    print(f"✅ Similarité cosinus calculée: {similarity:.3f}")
    
    # Test de conversion de difficulté
    difficulties = ["beginner", "intermediate", "advanced"]
    for diff in difficulties:
        num = RecommendationUtils.difficulty_to_num(diff)
        print(f"✅ {diff} -> {num}")

if __name__ == "__main__":
    print("🧪 TESTS DU SYSTÈME DE RECOMMANDATIONS AVANCÉ")
    print("=" * 60)
    
    # Tests des utilitaires (synchrones)
    test_utils()
    
    # Tests du service (asynchrones)
    asyncio.run(test_recommendation_service())
    
    print("\n✨ Tous les tests sont terminés !")
