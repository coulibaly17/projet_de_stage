from sqlalchemy import create_engine, inspect, Table, Column, Integer, ForeignKey, MetaData
from sqlalchemy.ext.declarative import declarative_base
from .database import SQLALCHEMY_DATABASE_URL

# Créer une connexion à la base de données
engine = create_engine(SQLALCHEMY_DATABASE_URL)
metadata = MetaData()

# Vérifier si la table course_student existe
inspector = inspect(engine)
if 'course_student' in inspector.get_table_names():
    # Si la table existe, vérifier ses colonnes
    columns = [column['name'] for column in inspector.get_columns('course_student')]
    
    # Si la colonne user_id n'existe pas, la créer
    if 'user_id' not in columns:
        # Créer une connexion
        with engine.connect() as connection:
            # Ajouter la colonne user_id
            connection.execute("ALTER TABLE course_student ADD COLUMN user_id INTEGER")
            connection.execute("ALTER TABLE course_student ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id)")
            print("Colonne user_id ajoutée à la table course_student")
    else:
        print("La colonne user_id existe déjà dans la table course_student")
else:
    # Si la table n'existe pas, la créer
    course_student = Table(
        'course_student',
        metadata,
        Column('course_id', Integer, ForeignKey('courses.id')),
        Column('user_id', Integer, ForeignKey('users.id'))
    )
    metadata.create_all(engine)
    print("Table course_student créée")

print("Vérification terminée")
