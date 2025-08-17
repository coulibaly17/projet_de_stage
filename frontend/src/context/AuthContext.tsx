import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/auth.service';
// Import the User type from auth.service to ensure type compatibility
import type { User, RegisterData } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshUser?: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialiser l'utilisateur au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Vérifier si un token est présent
        const token = localStorage.getItem('authToken');
        console.log('Token trouvé dans localStorage:', !!token);
        
        if (token) {
          // Récupérer les informations utilisateur du localStorage
          const userJson = localStorage.getItem('user');
          console.log('Données utilisateur trouvées dans localStorage:', !!userJson);
          
          if (userJson) {
            try {
              const userData = JSON.parse(userJson);
              console.log('Rôle utilisateur:', userData.role);
              setUser(userData);
            } catch (e) {
              console.error('Erreur lors du parsing des données utilisateur:', e);
            }
          } else {
            // Si pas d'informations utilisateur mais un token valide, essayer de les récupérer
            try {
              const currentUser = await authService.getCurrentUser();
              if (currentUser) {
                console.log('Utilisateur récupéré depuis l\'API:', currentUser);
                setUser(currentUser);
                // Stocker les informations utilisateur
                localStorage.setItem('user', JSON.stringify(currentUser));
              }
            } catch (fetchError) {
              console.error('Erreur lors de la récupération de l\'utilisateur:', fetchError);
              authService.logout();
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Rediriger après connexion uniquement si nécessaire
  const [redirected, setRedirected] = useState(false);
  
  useEffect(() => {
    // Ne pas rediriger si on est en train de charger ou s'il n'y a pas d'utilisateur
    if (isLoading || !user) {
      console.log('⏳ Pas de redirection - En attente de chargement ou utilisateur non connecté');
      return;
    }
    
    const currentPath = location.pathname;
    const isAuthPage = ['/connexion', '/inscription', '/mot-de-passe-oublie'].includes(currentPath);
    
    // Vérifier si on vient du dashboard admin pour inviter un enseignant
    const urlParams = new URLSearchParams(location.search);
    const fromAdmin = urlParams.get('from') === 'admin';
    
    console.log('🔍 Logique de redirection - État:', {
      isLoading,
      userExists: !!user,
      userRole: user?.role,
      redirected,
      currentPath,
      isAuthPage,
      fromAdmin,
      fromState: location.state?.from?.pathname
    });
    
    // Ne rediriger que si on est sur une page d'authentification et qu'on n'est pas en train de gérer une erreur
    if (!redirected && isAuthPage && !(currentPath === '/inscription' && fromAdmin)) {
      const redirectPath = location.state?.from?.pathname || getDefaultRoute(user.role);
      console.log('🚀 Redirection déclenchée vers:', redirectPath, '- Rôle utilisateur:', user.role);
      setRedirected(true);
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, navigate, location, redirected]);

  // Obtenir la route par défaut en fonction du rôle
  const getDefaultRoute = (role: string): string => {
    console.log('🔄 getDefaultRoute appelée avec le rôle:', role, 'Type:', typeof role);
    let route;
    
    // Normaliser le rôle (enlever les espaces et mettre en minuscules)
    const normalizedRole = role?.toString().trim().toLowerCase();
    console.log('🧹 Rôle normalisé:', normalizedRole);
    
    switch (normalizedRole) {
      case 'admin':
        route = '/admin';
        break;
      case 'enseignant':
        route = '/enseignant';
        break;
      case 'etudiant':
        route = '/etudiant';
        break;
      default:
        console.warn('⚠️ Rôle non reconnu:', role, '- Redirection vers /');
        route = '/';
        break;
    }
    console.log('🎯 Route déterminée:', route, 'pour le rôle normalisé:', normalizedRole);
    return route;
  };

  // Se connecter
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔑 Tentative de connexion pour:', email);
      setIsLoading(true);
      const response = await authService.login({ email, password });
      
      if (response?.user) {
        console.log('✅ Connexion réussie - Utilisateur reçu:', {
          id: response.user.id,
          role: response.user.role,
          email: response.user.email
        });
        setUser(response.user);
        console.log('📝 État utilisateur mis à jour dans AuthContext');
        return true; // Connexion réussie
      } else {
        console.error('❌ Aucun utilisateur dans la réponse de connexion');
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('❌ Échec de la connexion:', error);
      // Ne pas définir l'utilisateur en cas d'échec
      setUser(null);
      // Supprimer les données d'authentification en cas d'erreur
      authService.logout();
      return false; // Échec de la connexion
    } finally {
      setIsLoading(false);
    }
  }, []);

  // S'inscrire
  const register = useCallback(async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      // Appeler le service d'inscription sans connecter automatiquement l'utilisateur
      await authService.register(userData);
      // Ne pas définir setUser pour éviter la connexion automatique
      // L'utilisateur sera redirigé vers la page de connexion depuis RegisterPage
    } catch (error) {
      console.error('Échec de l\'inscription:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Se déconnecter
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setRedirected(false); // Réinitialiser le flag de redirection
    // Rediriger vers la page d'accueil au lieu de la page de connexion
    navigate('/');
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}
