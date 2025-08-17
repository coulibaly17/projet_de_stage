from sqlalchemy import create_engine, text
from app.database import SQLALCHEMY_DATABASE_URL

def create_interactions_table():
    # Créer une connexion à la base de données
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Requête SQL pour créer la table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS user_interactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        interaction_type VARCHAR(50) NOT NULL,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_entity (user_id, entity_type, entity_id),
        INDEX idx_user_interaction_type (user_id, interaction_type),
        INDEX idx_entity_interactions (entity_type, entity_id),
        INDEX idx_interaction_created (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """
    
    # Exécuter la requête
    with engine.connect() as connection:
        connection.execute(text(create_table_sql))
        connection.commit()
    
    print("Table 'user_interactions' créée avec succès!")

if __name__ == "__main__":
    create_interactions_table()
