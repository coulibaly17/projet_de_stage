from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..services import interaction_service

class PageViewTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Ignorer les requêtes non-GET et les fichiers statiques
        if request.method != 'GET' or any(path in request.url.path for path in ['/static', '/docs', '/redoc', '/openapi.json']):
            return await call_next(request)
        
        # Vérifier si l'utilisateur est authentifié
        user = request.state.user if hasattr(request.state, 'user') else None
        
        if user and user.is_authenticated:
            db = SessionLocal()
            try:
                # Enregistrer la vue de la page
                interaction_svc = interaction_service.InteractionService(db)
                interaction_svc.log_interaction(
                    user_id=user.id,
                    entity_type='page',
                    entity_id=0,  # 0 car c'est une vue de page, pas une entité spécifique
                    interaction_type='view',
                    metadata={
                        'path': request.url.path,
                        'method': request.method,
                        'query_params': dict(request.query_params)
                    }
                )
            except Exception as e:
                # Ne pas échouer la requête en cas d'erreur de suivi
                print(f"Erreur lors du suivi de la page: {e}")
            finally:
                db.close()
        
        # Continuer la requête
        return await call_next(request)
