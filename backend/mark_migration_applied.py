from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def mark_migration_applied():
    # Créer une connexion à la base de données
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Vérifier si la table alembic_version existe
    check_table_sql = """
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'plateforme_educative' 
    AND table_name = 'alembic_version';
    """
    
    with engine.connect() as connection:
        result = connection.execute(text(check_table_sql)).scalar()
        
        if not result:
            # Créer la table alembic_version si elle n'existe pas
            create_table_sql = """
            CREATE TABLE alembic_version (
                version_num VARCHAR(32) NOT NULL,
                PRIMARY KEY (version_num)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """
            connection.execute(text(create_table_sql))
            connection.commit()
            print("Table 'alembic_version' créée avec succès!")
        
        # Vérifier si la migration est déjà marquée comme appliquée
        check_migration_sql = """
        SELECT 1 FROM alembic_version WHERE version_num = '1234abcd5678';
        """
        
        result = connection.execute(text(check_migration_sql)).scalar()
        
        if not result:
            # Marquer la migration comme appliquée
            mark_migration_sql = """
            INSERT INTO alembic_version (version_num) VALUES ('1234abcd5678');
            """
            connection.execute(text(mark_migration_sql))
            connection.commit()
            print("Migration '1234abcd5678' marquée comme appliquée avec succès!")
        else:
            print("La migration '1234abcd5678' est déjà marquée comme appliquée.")

if __name__ == "__main__":
    mark_migration_applied()
