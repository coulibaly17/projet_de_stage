#!/usr/bin/env python3
"""
Script simple pour corriger la progression des leçons.
Utilise l'ORM SQLAlchemy pour éviter les problèmes SQL.
"""

import sys
import os
from datetime import datetime
import random

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db
from app.models import User, Course, Lesson, UserProgress, LessonCompletion

def fix_lesson_progress():
    """Corrige la progression des leçons en créant une entrée par leçon."""
    db = next(get_db())
    
    try:
        print("🚀 Correction de la progression des leçons...")
        
        # Récupérer tous les étudiants
        students = db.query(User).filter(User.role == 'etudiant').all()
        print(f"👥 {len(students)} étudiants trouvés")
        
        # Récupérer les leçons complétées
        completed_lessons = {}
        completions = db.query(LessonCompletion).all()
        for completion in completions:
            completed_lessons[(completion.user_id, completion.lesson_id)] = completion.completed_at
        
        print(f"✅ {len(completed_lessons)} leçons complétées trouvées")
        
        # Nettoyer les anciennes données
        print("🧹 Nettoyage des anciennes données...")
        db.query(UserProgress).delete()
        db.commit()
        
        total_created = 0
        
        # Pour chaque étudiant
        for student in students:
            print(f"\n👤 Traitement de {student.username}")
            
            # Récupérer ses cours inscrits
            enrolled_courses = student.enrolled_courses
            print(f"   📚 {len(enrolled_courses)} cours inscrits")
            
            for course in enrolled_courses:
                # Récupérer toutes les leçons du cours
                lessons = db.query(Lesson).filter(Lesson.course_id == course.id).order_by(
                    Lesson.module_id, Lesson.order_index
                ).all()
                
                print(f"   📖 Cours '{course.title}': {len(lessons)} leçons")
                
                for lesson in lessons:
                    # Vérifier si complétée
                    is_completed = (student.id, lesson.id) in completed_lessons
                    
                    # Calculer progression
                    if is_completed:
                        completion_percentage = 100.0
                        last_accessed = completed_lessons[(student.id, lesson.id)]
                    else:
                        # Progression aléatoire pour simulation
                        if random.random() < 0.7:  # 70% à 0%
                            completion_percentage = 0.0
                        else:  # 30% progression partielle
                            completion_percentage = round(random.uniform(10, 90), 2)
                        last_accessed = datetime.now()
                    
                    # Créer l'entrée
                    progress = UserProgress(
                        user_id=student.id,
                        course_id=course.id,
                        lesson_id=lesson.id,
                        is_completed=is_completed,
                        completion_percentage=completion_percentage,
                        last_accessed=last_accessed,
                        created_at=datetime.now(),
                        updated_at=datetime.now() if completion_percentage > 0 else None
                    )
                    
                    db.add(progress)
                    total_created += 1
                    
                    if is_completed:
                        print(f"      ✅ {lesson.title[:40]}... → 100%")
                    elif completion_percentage > 0:
                        print(f"      🔄 {lesson.title[:40]}... → {completion_percentage}%")
        
        # Sauvegarder
        db.commit()
        print(f"\n🎉 {total_created} entrées de progression créées !")
        
        # Afficher résumé
        print("\n📊 Résumé:")
        for student in students:
            progress_count = db.query(UserProgress).filter(UserProgress.user_id == student.id).count()
            completed_count = db.query(UserProgress).filter(
                UserProgress.user_id == student.id,
                UserProgress.is_completed == True
            ).count()
            
            if progress_count > 0:
                print(f"   👤 {student.username}: {completed_count}/{progress_count} leçons complétées")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🎯 Script de correction des progressions")
    print("=" * 40)
    
    # Demander confirmation
    response = input("Voulez-vous continuer ? (y/N): ").lower().strip()
    if response == 'y':
        fix_lesson_progress()
        print("\n✅ Terminé ! Vous pouvez maintenant rafraîchir votre page.")
    else:
        print("❌ Annulé")
