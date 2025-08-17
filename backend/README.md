# Plateforme Éducative - Backend

Ce dépôt contient le backend de la plateforme éducative intelligente, développé avec FastAPI et MySQL.

## Prérequis

- Python 3.9+
- MySQL 8.0+
- pip (gestionnaire de paquets Python)

## Installation

1. Clonez le dépôt :
   ```bash
   git clone <url-du-depot>
   cd plateforme-educative/backend
   ```

2. Créez un environnement virtuel et activez-le :
   ```bash
   # Sur Windows
   python -m venv venv
   .\venv\Scripts\activate
   
   # Sur macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Installez les dépendances :
   ```bash
   pip install -r requirements.txt
   ```

4. Configurez la base de données :
   - Créez une base de données MySQL nommée `plateforme_educative`
   - Copiez le fichier `.env.example` vers `.env` et modifiez les paramètres selon votre configuration

5. Exécutez les migrations (si vous utilisez Alembic) :
   ```bash
   alembic upgrade head
   ```

## Démarrage du serveur

```bash
uvicorn app.main:app --reload
```

Le serveur démarrera à l'adresse `http://localhost:8000`

## Documentation de l'API

Une fois le serveur démarré, vous pouvez accéder à la documentation interactive de l'API aux adresses suivantes :

- Documentation Swagger UI : http://localhost:8000/docs
- Documentation ReDoc : http://localhost:8000/redoc

## Structure du projet

```
backend/
├── app/
│   ├── api/               # Points de terminaison de l'API
│   ├── core/              # Configuration et logique principale
│   ├── models/            # Modèles de données SQLAlchemy
│   ├── schemas/           # Schémas Pydantic
│   └── services/          # Logique métier
├── tests/                 # Tests unitaires et d'intégration
├── alembic/               # Migrations de base de données
├── .env                   # Variables d'environnement (à créer)
├── .env.example          # Exemple de fichier d'environnement
├── requirements.txt       # Dépendances Python
└── README.md             # Ce fichier
```

## Variables d'environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```
# Configuration de la base de données
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe
MYSQL_SERVER=localhost
MYSQL_PORT=3306
MYSQL_DB=plateforme_educative

# Configuration JWT
SECRET_KEY=votre_secret_tres_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 heures

# Configuration de l'application
PROJECT_NAME="Plateforme Éducative"
VERSION="1.0.0"
API_V1_STR="/api/v1"
```

## Tests

Pour exécuter les tests :

```bash
pytest
```

## Déploiement

Pour le déploiement en production, il est recommandé d'utiliser un serveur ASGI comme Uvicorn avec Gunicorn :

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

## Licence

Ce projet est sous licence MIT.
