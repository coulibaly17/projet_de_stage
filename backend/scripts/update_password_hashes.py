#!/usr/bin/env python3
"""
Script pour mettre à jour les hashes de mots de passe en utilisant bcrypt
"""
import pymysql
import bcrypt
import logging

# Configurer le logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Paramètres de connexion MySQL
USERNAME = "root"
PASSWORD = ""
HOST = "localhost"
PORT = 3307
DATABASE = "plateforme_educative"

def get_bcrypt_hash(password):
    """Génère un hash bcrypt pour un mot de passe"""
    # Convertir le mot de passe en bytes si ce n'est pas déjà le cas
    if isinstance(password, str):
        password = password.encode('utf-8')
    
    # Générer un salt et hasher le mot de passe
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password, salt)
    
    # Retourner le hash en format string
    return hashed.decode('utf-8')

def update_password_hashes():
    """Met à jour les hashes de mots de passe dans la base de données"""
    try:
        # Connexion à MySQL
        logger.info(f"Connexion à MySQL sur {HOST}:{PORT} avec l'utilisateur {USERNAME}...")
        connection = pymysql.connect(
            host=HOST,
            user=USERNAME,
            password=PASSWORD,
            port=PORT,
            database=DATABASE,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        logger.info("Connexion à MySQL réussie!")
        
        # Créer un curseur
        cursor = connection.cursor()
        
        # Récupérer tous les utilisateurs
        cursor.execute("SELECT id, username FROM users")
        users = cursor.fetchall()
        
        # Définir les mots de passe par défaut selon le rôle
        default_passwords = {
            "admin": "admin123",
            "prof_math": "teacher123",
            "prof_info": "teacher123",
            "etudiant1": "student123",
            "etudiant2": "student123"
        }
        
        # Mettre à jour les hashes de mots de passe
        for user in users:
            user_id = user["id"]
            username = user["username"]
            
            # Utiliser le mot de passe par défaut ou "password123" si l'utilisateur n'est pas dans la liste
            password = default_passwords.get(username, "password123")
            
            # Générer un nouveau hash bcrypt
            bcrypt_hash = get_bcrypt_hash(password)
            
            # Mettre à jour le hash dans la base de données
            logger.info(f"Mise à jour du hash pour l'utilisateur {username} (ID: {user_id})...")
            cursor.execute(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (bcrypt_hash, user_id)
            )
        
        # Valider les changements
        connection.commit()
        
        # Vérifier les mises à jour
        cursor.execute("SELECT id, username, password_hash FROM users")
        updated_users = cursor.fetchall()
        
        logger.info("Hashes de mots de passe mis à jour:")
        for user in updated_users:
            logger.info(f"- {user['username']} (ID: {user['id']}): {user['password_hash'][:20]}...")
        
        # Fermer la connexion
        cursor.close()
        connection.close()
        
        logger.info("Mise à jour des hashes de mots de passe terminée avec succès!")
        return True
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour des hashes de mots de passe: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if update_password_hashes():
        logger.info("Hashes de mots de passe mis à jour avec succès!")
    else:
        logger.error("Échec de la mise à jour des hashes de mots de passe.")
