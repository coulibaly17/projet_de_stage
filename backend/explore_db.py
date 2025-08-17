from app.database import SessionLocal
from app.models.models import Course, Module, Lesson
from app.models.user import User

# Créer une session de base de données
db = SessionLocal()

try:
    # Trouver l'enseignant connecté (pour simplifier, on prend le premier enseignant)
    current_user = db.query(User).filter(User.role == 'enseignant').first()
    print('\nEnseignant connecté:')
    if current_user:
        print(f"ID: {current_user.id}, Email: {current_user.email}, Nom: {current_user.first_name} {current_user.last_name}")
    else:
        print('Aucun enseignant trouvé dans la base de données')
    
    # Récupérer tous les cours
    print('\nTous les cours dans la base de données:')
    all_courses = db.query(Course).all()
    for course in all_courses:
        print(f"ID: {course.id}, Titre: {course.title}, Instructeur ID: {course.instructor_id}")
    
    # Récupérer les cours de l'enseignant connecté
    if current_user:
        print(f'\nCours de l\'enseignant {current_user.email}:')
        teacher_courses = db.query(Course).filter(Course.instructor_id == current_user.id).all()
        if teacher_courses:
            for course in teacher_courses:
                print(f"ID: {course.id}, Titre: {course.title}")
                
                # Afficher les modules de ce cours
                modules = db.query(Module).filter(Module.course_id == course.id).order_by(Module.order_index).all()
                print(f"  Modules ({len(modules)}):")  
                for module in modules:
                    print(f"    ID: {module.id}, Titre: {module.title}, Ordre: {module.order_index}")
                    
                    # Afficher les leçons de ce module
                    lessons = db.query(Lesson).filter(Lesson.module_id == module.id).order_by(Lesson.order_index).all()
                    print(f"      Leçons ({len(lessons)}):")  
                    for lesson in lessons:
                        print(f"        ID: {lesson.id}, Titre: {lesson.title}, Ordre: {lesson.order_index}")
        else:
            print("Aucun cours trouvé pour cet enseignant")

finally:
    # Fermer la session
    db.close()
