import { apiService } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role?: 'etudiant' | 'enseignant' | 'admin';
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  role: 'etudiant' | 'enseignant' | 'admin';
  isActive: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string | null;
  isSuperuser?: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthResponse extends TokenResponse {
  user: User;
}

// Interface pour la réponse brute de l'API
interface ApiUserResponse {
  id: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  is_active?: boolean;
  avatar?: string;
  created_at?: string;
  updated_at?: string | null;
  is_superuser?: boolean;
}

class AuthService {
  private static instance: AuthService;
  
  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      
      console.log('Tentative de connexion avec:', {
        username: credentials.email,
        password: '[PROTECTED]'
      });
      
      // Utiliser le service API pour la requête avec un timeout plus long
      const tokenData = await apiService.post<TokenResponse>(
        '/auth/token',
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          timeout: 60000, // Augmenter le timeout à 60 secondes pour la connexion
        }
      );
      
      if (tokenData?.access_token) {
        // Stocker le token
        apiService.setAuthToken(tokenData.access_token);
        console.log('Connexion réussie, token défini');
        
        // Récupérer les informations de l'utilisateur
        const userResponse = await apiService.get<User>('/auth/me');
        
        // Stocker les informations de l'utilisateur dans le localStorage
        if (userResponse) {
          localStorage.setItem('user', JSON.stringify(userResponse));
          console.log('Informations utilisateur stockées dans localStorage:', {
            id: userResponse.id,
            role: userResponse.role,
            email: userResponse.email
          });
        }
        
        // Retourner la réponse formatée avec l'utilisateur
        return {
          access_token: tokenData.access_token,
          token_type: tokenData.token_type,
          user: userResponse
        };
      } else {
        console.error('Aucun token reçu dans la réponse');
        throw new Error('Aucun token reçu du serveur');
      }
    } catch (error: any) {
      console.error('Erreur détaillée de connexion:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // Vérifier si c'est une erreur de compte désactivé (403 avec le bon code)
      if (error.response?.status === 403) {
        const errorDetail = error.response?.data?.detail ?? 'Votre compte a été désactivé';
        console.log('Erreur 403 détectée avec détail:', errorDetail);
        
        // Créer une nouvelle erreur avec le message du serveur
        const errorWithMessage = new Error(errorDetail);
        // Conserver les informations de la réponse
        (errorWithMessage as any).response = error.response;
        throw errorWithMessage;
      }
      
      // Pour les erreurs 401 (mauvais identifiants)
      if (error.response?.status === 401) {
        throw new Error('Identifiants incorrects. Veuillez réessayer.');
      }
      
      // Pour les autres erreurs
      const errorDetail = error.response?.data?.detail ?? error.response?.data?.message ?? error.message;
      throw new Error(errorDetail ?? 'Échec de la connexion. Veuillez réessayer plus tard.');
    }
  }

  public async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      // Convertir les données de l'utilisateur en format snake_case pour l'API
      const registerData = {
        email: userData.email,
        username: userData.username,
        first_name: userData.firstName, // Utiliser firstName au lieu de first_name
        last_name: userData.lastName,   // Utiliser lastName au lieu de last_name
        role: userData.role || 'etudiant',
        password: userData.password
      };

      // Envoyer la requête d'inscription
      const userDataResponse = await apiService.post<User>(
        '/auth/register',
        registerData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      // Retourner une réponse sans connexion automatique
      // L'utilisateur devra se connecter manuellement après l'inscription
      return {
        access_token: '',
        token_type: 'bearer',
        user: userDataResponse as User
      };
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error);
      throw new Error(error.message || "Une erreur est survenue lors de l'inscription");
    }
  }

  // La méthode getCurrentUser est implémentée plus bas

  public logout(): void {
    console.log(' Déconnexion en cours...');
    
    // Supprimer le token d'authentification
    apiService.setAuthToken(null);
    
    // Nettoyer le localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    console.log('Déconnexion terminée - localStorage nettoyé');
  }

  public isAuthenticated(): boolean {
    return !!apiService.getAuthToken();
  }
  
  /**
   * Récupère les informations de l'utilisateur actuellement connecté
   * Essaie d'abord de récupérer depuis le localStorage, puis depuis l'API si nécessaire
   */
  public async getCurrentUser(): Promise<User | null> {
    try {
      // D'abord, essayer de récupérer depuis le localStorage
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          console.log('Utilisateur récupéré depuis localStorage:', {
            id: userData.id,
            role: userData.role,
            email: userData.email
          });
          return userData;
        } catch (e) {
          console.error('Erreur lors du parsing des données utilisateur:', e);
        }
      }
      
      // Si pas dans localStorage ou parsing échoué, essayer depuis l'API
      if (this.isAuthenticated()) {
        console.log('Tentative de récupération de l\'utilisateur depuis l\'API');
        const userResponse = await apiService.get<User>('/auth/me');
        if (userResponse) {
          // Stocker dans localStorage pour les prochaines fois
          localStorage.setItem('user', JSON.stringify(userResponse));
          console.log('Utilisateur récupéré depuis API et stocké:', {
            id: userResponse.id,
            role: userResponse.role,
            email: userResponse.email
          });
          return userResponse;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }
}

export const authService = AuthService.getInstance();
