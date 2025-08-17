"""
Module de sécurité pour la gestion des mots de passe et des tokens
"""
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional

def get_password_hash(password: str) -> str:
    """
    Crée un hash du mot de passe en utilisant SHA-256
    Dans un environnement de production, il serait préférable d'utiliser bcrypt ou Argon2
    """
    # Ajouter un sel pour renforcer la sécurité
    salt = secrets.token_hex(8)
    # Combiner le sel et le mot de passe
    salted_password = salt + password
    # Créer le hash
    password_hash = hashlib.sha256(salted_password.encode()).hexdigest()
    # Retourner le sel et le hash séparés par un $
    return f"{salt}${password_hash}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si un mot de passe correspond à son hash
    """
    # Extraire le sel et le hash
    salt, stored_hash = hashed_password.split('$')
    # Combiner le sel et le mot de passe fourni
    salted_password = salt + plain_password
    # Calculer le hash
    calculated_hash = hashlib.sha256(salted_password.encode()).hexdigest()
    # Comparer les hash
    return secrets.compare_digest(calculated_hash, stored_hash)
