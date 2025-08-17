from app.database import SessionLocal
from app.models.models import Course, Module, Lesson

def check_courses():
    db = SessionLocal()
    try:
        # Lister tous les cours
        print("Liste de tous les cours:")
        courses = db.query(Course).all()
        for course in courses:
            print(f"Cours: {course.title}, ID: {course.id}")
        
        # Vérifier spécifiquement le cours Python
        python_course = db.query(Course).filter(Course.title.like('%Python%')).first()
        if python_course:
            print(f"\nCours Python trouvé: {python_course.title}, ID: {python_course.id}")
            
            # Vérifier les modules de ce cours
            modules = db.query(Module).filter(Module.course_id == python_course.id).all()
            print(f"Nombre de modules: {len(modules)}")
            
            for module in modules:
                print(f"Module ID: {module.id}, Titre: {module.title}")
                
                # Vérifier les leçons de ce module
                lessons = db.query(Lesson).filter(Lesson.module_id == module.id).all()
                print(f"  Nombre de leçons: {len(lessons)}")
                
                for lesson in lessons:
                    # Afficher les attributs disponibles pour comprendre la structure
                    print(f"  Leçon ID: {lesson.id}, Titre: {lesson.title}")
                    print(f"  Attributs disponibles: {dir(lesson)}")
                    # Vérifier si l'attribut existe avant de l'utiliser
                    if hasattr(lesson, 'type'):
                        print(f"  Type: {lesson.type}")
                    elif hasattr(lesson, 'content_type'):
                        print(f"  Type: {lesson.content_type}")
                    else:
                        print("  Type: non défini")
        else:
            print("Aucun cours Python trouvé")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_courses()
