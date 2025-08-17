import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  /**
   * Rôle requis pour accéder à la route
   * Si non spécifié, seul l'authentification est requise
   */
  requiredRole?: string;
  /**
   * URL de redirection si l'utilisateur n'est pas authentifié
   * @default '/login'
   */
  redirectTo?: string;
  /**
   * URL de redirection si l'utilisateur n'a pas le rôle requis
   * @default '/'
   */
  unauthorizedRedirectTo?: string;
  /**
   * Afficher un message d'erreur à l'utilisateur
   * @default true
   */
  showErrorToast?: boolean;
}

/**
 * Composant pour protéger les routes qui nécessitent une authentification
 * et/ou des autorisations spécifiques.
 */
export default function ProtectedRoute({ 
  requiredRole, 
  redirectTo = '/login',
  unauthorizedRedirectTo = '/',
  showErrorToast = true
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Effet pour afficher un message d'erreur si l'accès est refusé
  useEffect(() => {
    if (!isLoading && !isAuthenticated && showErrorToast) {
      toast.error('Veuillez vous connecter pour accéder à cette page');
    } else if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole && showErrorToast) {
      toast.error('Vous n\'avez pas les autorisations nécessaires pour accéder à cette page');
    }
  }, [isLoading, isAuthenticated, requiredRole, user, showErrorToast]);

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Vérifier si un rôle est requis et si l'utilisateur a le bon rôle
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={unauthorizedRedirectTo} state={{ from: location }} replace />;
  }

  // Rendre les routes enfants si toutes les vérifications sont passées
  return <Outlet />;
}
