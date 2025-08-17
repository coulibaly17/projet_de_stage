#!/usr/bin/env python3
"""
Script pour peupler la table user_progress avec la progression de chaque leçon individuellement.
Ce script corrige le problème où seules certaines leçons ont des entrées de progression.
"""

import sys
import os
from datetime import datetime
import random

# Ajouter le répertoire parent au path pour importer les modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db
from app.models import User, Course, Lesson, UserProgress, LessonCompletion
from sqlalchemy.orm import Session
from sqlalchemy import text

def populate_lesson_progress():
    """
    Peuple la table user_progress avec une entrée pour chaque leçon de chaque cours inscrit.
    Utilise les données existantes de lesson_completions pour déterminer les leçons terminées.
    """
    db = next(get_db())
    
    try:
        print("🚀 Début de la population des progressions de leçons...")
        
        # Récupérer tous les étudiants inscrits à des cours
        students_courses = db.execute(text("""
            SELECT DISTINCT cs.student_id, cs.course_id 
            FROM course_student cs
            JOIN users u ON cs.student_id = u.id 
            WHERE u.role = 'etudiant'
        """)).fetchall()
        
        print(f"📚 Trouvé {len(students_courses)} inscriptions étudiant-cours")
        
        # Récupérer toutes les leçons complétées existantes
        completed_lessons = {}
        completions = db.query(LessonCompletion).all()
        for completion in completions:
            key = (completion.user_id, completion.lesson_id)
            completed_lessons[key] = completion.completed_at
        
        print(f"✅ Trouvé {len(completed_lessons)} leçons complétées existantes")
        
        # Supprimer les anciennes entrées user_progress pour éviter les doublons
        print("🧹 Nettoyage des anciennes entrées user_progress...")
        db.query(UserProgress).delete()
        db.commit()
        
        total_created = 0
        
        # Pour chaque inscription étudiant-cours
        for student_id, course_id in students_courses:
            print(f"\n👤 Traitement étudiant {student_id}, cours {course_id}")
            
            # Récupérer toutes les leçons du cours
            lessons = db.query(Lesson).filter(
                Lesson.course_id == course_id
            ).order_by(Lesson.module_id, Lesson.order_index).all()
            
            print(f"   📖 {len(lessons)} leçons trouvées")
            
            for lesson in lessons:
                # Vérifier si la leçon est complétée
                completion_key = (student_id, lesson.id)
                is_completed = completion_key in completed_lessons
                
                # Calculer la progression
                if is_completed:
                    completion_percentage = 100.0
                    last_accessed = completed_lessons[completion_key]
                else:
                    # Progression aléatoire réaliste pour les leçons non complétées
                    # 70% des leçons non complétées ont 0% de progression
                    # 30% ont une progression partielle (10-90%)
                    if random.random() < 0.7:
                        completion_percentage = 0.0
                    else:
                        completion_percentage = round(random.uniform(10, 90), 2)
                    last_accessed = datetime.now()
                
                # Créer l'entrée user_progress
                progress_entry = UserProgress(
                    user_id=student_id,
                    course_id=course_id,
                    lesson_id=lesson.id,
                    is_completed=is_completed,
                    completion_percentage=completion_percentage,
                    last_accessed=last_accessed,
                    created_at=datetime.now(),
                    updated_at=datetime.now() if completion_percentage > 0 else None
                )
                
                db.add(progress_entry)
                total_created += 1
                
                if is_completed:
                    print(f"   ✅ Leçon {lesson.id}: {lesson.title[:30]}... → 100%")
                elif completion_percentage > 0:
                    print(f"   🔄 Leçon {lesson.id}: {lesson.title[:30]}... → {completion_percentage}%")
        
        # Sauvegarder toutes les modifications
        db.commit()
        print(f"\n🎉 Terminé ! {total_created} entrées de progression créées")
        
        # Afficher un résumé
        print("\n📊 Résumé par utilisateur:")
        summary = db.execute(text("""
            SELECT 
                u.username,
                c.title as course_title,
                COUNT(*) as total_lessons,
                SUM(CASE WHEN up.is_completed = 1 THEN 1 ELSE 0 END) as completed_lessons,
                ROUND(AVG(up.completion_percentage), 2) as avg_progress
            FROM user_progress up
            JOIN users u ON up.user_id = u.id
            JOIN courses c ON up.course_id = c.id
            GROUP BY u.id, c.id
            ORDER BY u.username, c.title
        """)).fetchall()
        
        for row in summary:
            print(f"   👤 {row.username} - {row.course_title}")
            print(f"      📚 {row.completed_lessons}/{row.total_lessons} leçons complétées")
            print(f"      📊 Progression moyenne: {row.avg_progress}%")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def verify_progress_data():
    """
    Vérifie que les données de progression sont correctement créées.
    """
    db = next(get_db())
    
    try:
        print("\n🔍 Vérification des données de progression...")
        
        # Compter les entrées par utilisateur
        result = db.execute(text("""
            SELECT 
                u.username,
                COUNT(up.id) as progress_entries,
                SUM(CASE WHEN up.is_completed = 1 THEN 1 ELSE 0 END) as completed,
                COUNT(DISTINCT up.course_id) as courses
            FROM users u
            LEFT JOIN user_progress up ON u.id = up.user_id
            WHERE u.role = 'etudiant'
            GROUP BY u.id, u.username
            ORDER BY u.username
        """)).fetchall()
        
        for row in result:
            print(f"   👤 {row.username}: {row.progress_entries} leçons, {row.completed} complétées, {row.courses} cours")
        
        # Vérifier la cohérence avec lesson_completions
        inconsistencies = db.execute(text("""
            SELECT 
                lc.user_id,
                lc.lesson_id,
                up.completion_percentage
            FROM lesson_completions lc
            LEFT JOIN user_progress up ON lc.user_id = up.user_id AND lc.lesson_id = up.lesson_id
            WHERE up.completion_percentage != 100 OR up.is_completed != 1
        """)).fetchall()
        
        if inconsistencies:
            print(f"⚠️  {len(inconsistencies)} incohérences détectées entre lesson_completions et user_progress")
        else:
            print("✅ Cohérence parfaite entre lesson_completions et user_progress")
            
    finally:
        db.close()

if __name__ == "__main__":
    print("🎯 Script de population des progressions de leçons")
    print("=" * 50)
    
    # Demander confirmation
    response = input("Voulez-vous continuer ? (y/N): ").lower().strip()
    if response != 'y':
        print("❌ Opération annulée")
        sys.exit(0)
    
    # Exécuter la population
    populate_lesson_progress()
    
    # Vérifier les résultats
    verify_progress_data()
    
    print("\n🎉 Script terminé avec succès !")
