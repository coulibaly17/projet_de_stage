import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface RoleBasedRouteProps {
  children?: React.ReactNode;
  /**
   * Rôles autorisés à accéder à cette route
   * @default ['etudiant', 'enseignant', 'admin']
   */
  allowedRoles?: string[];
  /**
   * URL de redirection si l'utilisateur n'a pas les droits
   * @default Redirection vers le tableau de bord approprié selon le rôle
   */
  redirectTo?: string;
  /**
   * Chemin de redirection pour les étudiants
   * Utilisé uniquement si children n'est pas fourni
   */
  studentPath?: string;
  /**
   * Chemin de redirection pour les enseignants
   * Utilisé uniquement si children n'est pas fourni
   */
  teacherPath?: string;
  /**
   * Chemin de redirection pour les administrateurs
   * Utilisé uniquement si children n'est pas fourni
   */
  adminPath?: string;
}

/**
 * Composant pour protéger les routes en fonction du rôle de l'utilisateur
 * Redirige vers la page de connexion ou une page non autorisée si l'utilisateur n'a pas les droits
 * Si aucun enfant n'est fourni, redirige automatiquement vers le tableau de bord approprié
 */
export function RoleBasedRoute({
  children,
  allowedRoles = ['etudiant', 'enseignant', 'admin'],
  redirectTo,
  studentPath = '/etudiant',
  teacherPath = '/enseignant',
  adminPath = '/admin',
}: RoleBasedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Vérifier l'état de l'authentification et les données utilisateur
  console.log('RoleBasedRoute - État d\'authentification:', { 
    isAuthenticated, 
    userExists: !!user,
    currentPath: location.pathname,
    allowedRoles
  });
  
  if (user) {
    console.log('RoleBasedRoute - Informations utilisateur:', {
      id: user.id,
      role: user.role,
      email: user.email
    });
  } else {
    // Vérifier manuellement le localStorage
    const token = localStorage.getItem('authToken');
    const userJson = localStorage.getItem('user');
    console.log('RoleBasedRoute - Vérification localStorage:', { 
      tokenExists: !!token, 
      userDataExists: !!userJson 
    });
    
    if (userJson) {
      try {
        const userData = JSON.parse(userJson);
        console.log('RoleBasedRoute - Données utilisateur dans localStorage:', {
          id: userData.id,
          role: userData.role,
          email: userData.email
        });
      } catch (e) {
        console.error('Erreur lors du parsing des données utilisateur:', e);
      }
    }
  }

  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!isAuthenticated) {
    console.log('RoleBasedRoute - Utilisateur non authentifié, redirection vers /connexion');
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Si aucun enfant n'est fourni, rediriger vers le tableau de bord approprié
  if (!children) {
    let redirectPath = studentPath; // Par défaut
    
    if (user) {
      console.log("RoleBasedRoute - Rôle de l'utilisateur:", user.role, 'Type:', typeof user.role);
      
      // Normaliser le rôle pour éviter les problèmes de casse ou d'espaces
      const normalizedRole = user.role?.toString().trim().toLowerCase();
      console.log("RoleBasedRoute - Rôle normalisé:", normalizedRole);
      
      if (normalizedRole === 'admin' && adminPath) {
        redirectPath = adminPath;
        console.log("✅ Redirection vers le tableau de bord admin:", adminPath);
      } else if (normalizedRole === 'enseignant' && teacherPath) {
        redirectPath = teacherPath;
        console.log("✅ Redirection vers le tableau de bord enseignant:", teacherPath);
      } else if (normalizedRole === 'etudiant' && studentPath) {
        redirectPath = studentPath;
        console.log("✅ Redirection vers le tableau de bord étudiant:", studentPath);
      } else {
        console.warn("⚠️ Rôle non reconnu ou chemin manquant:", {
          originalRole: user.role,
          normalizedRole,
          adminPath,
          teacherPath,
          studentPath
        });
      }
    } else {
      console.warn("⚠️ Aucun utilisateur trouvé dans RoleBasedRoute");
    }
    
    console.log('🚀 RoleBasedRoute - Redirection automatique vers:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Vérifier si l'utilisateur a un rôle autorisé
  const hasRequiredRole = user && allowedRoles.includes(user.role);
  console.log('RoleBasedRoute - Vérification des rôles:', { 
    hasRequiredRole, 
    userRole: user?.role, 
    allowedRoles 
  });

  if (!hasRequiredRole) {
    // Afficher un message d'erreur
    toast.error("Vous n'avez pas les droits nécessaires pour accéder à cette page");
    
    // Rediriger vers la page spécifiée ou vers le tableau de bord par défaut
    const redirectPath = redirectTo || 
      (user?.role === 'admin' ? (adminPath || '/admin') : 
       user?.role === 'enseignant' ? (teacherPath || '/enseignant') : 
       studentPath || '/etudiant');
    
    console.log('RoleBasedRoute - Redirection pour rôle non autorisé vers:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
