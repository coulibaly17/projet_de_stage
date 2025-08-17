import { apiService } from './api';
import type { LoginCredentials, RegisterData, AuthResponse, User } from '@/types/auth';

class AuthService {
  private static instance: AuthService;
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Enregistrer un nouvel utilisateur
  public async register(userData: RegisterData): Promise<User> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/register', userData);
      this.setAuthData(response);
      return response.user;
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  // Se connecter
  public async login(credentials: LoginCredentials): Promise<User> {
    try {
      const formData = new FormData();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      
      const response = await apiService.post<AuthResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      this.setAuthData(response);
      return response.user;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  // Se déconnecter
  public logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    apiService.clearAuthToken();
  }

  // Récupérer l'utilisateur actuel
  public getCurrentUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  // Vérifier si l'utilisateur est authentifié
  public isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Rafraîchir les données utilisateur
  public async refreshUser(): Promise<User | null> {
    try {
      const response = await apiService.get<User>('/auth/me');
      if (response) {
        localStorage.setItem(this.userKey, JSON.stringify(response));
        return response;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données utilisateur:', error);
      this.logout();
      return null;
    }
  }

  // Définir les données d'authentification
  private setAuthData(authData: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authData.access_token);
    localStorage.setItem(this.userKey, JSON.stringify(authData.user));
    apiService.setAuthToken(authData.access_token);
  }
}

export const authService = AuthService.getInstance();
