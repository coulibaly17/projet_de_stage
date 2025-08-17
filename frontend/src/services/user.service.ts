import { apiService } from './api';
import axios from 'axios';

export type UserRole = 'student' | 'teacher' | 'admin' | 'etudiant' | 'enseignant';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  name?: string; // Champ optionnel pour la compatibilité avec d'autres composants
  is_active: boolean;
}

export interface UserListParams {
  role?: UserRole;
  search?: string;
  limit?: number;
  offset?: number;
}

export class UserError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'UserError';
    this.statusCode = statusCode;
  }
}

/**
 * Service pour la gestion des utilisateurs
 */
class UserService {
  /**
   * Récupère la liste des utilisateurs
   * @param params Paramètres de filtrage et de pagination
   */
  async getUsers(params?: UserListParams): Promise<User[]> {
    try {
      console.log('Récupération des utilisateurs avec les paramètres:', params);
      
      // Le token est déjà géré par l'intercepteur axios
      const response = await apiService.get('/users', { 
        params,
        // Ne pas ajouter les en-têtes ici, ils sont gérés par l'intercepteur
      });
      
      console.log('Réponse de l\'API (users):', response);
      
      if (!response) {
        console.error('Réponse vide de l\'API');
        return [];
      }
      
      // Gérer différents formats de réponse
      let rawUsers: any[] = [];
      if (Array.isArray(response)) {
        rawUsers = response;
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        rawUsers = response.data;
      } else if (response && typeof response === 'object' && 'users' in response && Array.isArray(response.users)) {
        rawUsers = response.users;
      }
      
      // Mapper les rôles du backend vers le frontend
      const users: User[] = rawUsers.map((user: any) => {
        let mappedRole: 'student' | 'teacher' | 'admin' = user.role;
        
        // Mapping explicite des rôles
        if (user.role === 'etudiant') {
          mappedRole = 'student';
        } else if (user.role === 'enseignant') {
          mappedRole = 'teacher';
        } else if (user.role === 'admin') {
          mappedRole = 'admin';
        }
        
        return {
          ...user,
          role: mappedRole
        };
      });
      
      console.log('Utilisateurs récupérés:', users.length);
      console.log('Rôles mappés:', users.map(u => ({ 
        id: u.id,
        email: u.email,
        originalRole: rawUsers.find(ru => ru.id === u.id)?.role, 
        mappedRole: u.role 
      })));
      return users;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status ?? 500;
        const message = error.response?.data?.message ?? 'Erreur lors de la récupération des utilisateurs';
        
        if (statusCode === 401 || statusCode === 403) {
          console.error('Erreur d\'authentification - Redirection vers la page de connexion');
          // Rediriger vers la page de connexion
          window.location.href = '/login';
        }
        
        throw new UserError(message, statusCode);
      }
      
      throw new UserError('Une erreur inattendue est survenue lors de la récupération des utilisateurs', 500);
    }
  }

  /**
   * Récupère un utilisateur par son ID
   * @param userId ID de l'utilisateur
   */
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await apiService.get(`/users/${userId}`);
      // Supposons que la réponse est directement l'objet utilisateur
      return response as User;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        const statusCode = error.response?.status ?? 500;
        const message = error.response?.data?.message ?? 'Erreur lors de la récupération de l\'utilisateur';
        throw new UserError(message, statusCode);
      }
      throw new UserError('Une erreur inattendue est survenue', 500);
    }
  }

  /**
   * Récupère l'utilisateur connecté
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiService.get('/users/me');
      // Supposons que la réponse est directement l'objet utilisateur
      return response as User;
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        const statusCode = error.response?.status ?? 500;
        const message = error.response?.data?.message ?? 'Erreur lors de la récupération de l\'utilisateur connecté';
        throw new UserError(message, statusCode);
      }
      throw new UserError('Une erreur inattendue est survenue', 500);
    }
  }

  /**
   * Active ou désactive un utilisateur par son ID
   * @param userId ID de l'utilisateur à activer/désactiver
   * @param active État souhaité (true pour activer, false pour désactiver)
   */
  async toggleUserStatus(userId: string, active: boolean): Promise<{ success: boolean; message: string }> {
    try {
      await apiService.patch(`/users/${userId}/status`, { active });
      return { 
        success: true, 
        message: active 
          ? 'Utilisateur activé avec succès' 
          : 'Utilisateur désactivé avec succès' 
      };
    } catch (error) {
      console.error(`Erreur lors de la ${active ? 'désactivation' : 'activation'} de l'utilisateur:`, error);
      
      if (axios.isAxiosError<{ message?: string }>(error)) {
        const statusCode = error.response?.status ?? 500;
        const message = error.response?.data?.message ?? `Erreur lors de la ${active ? 'désactivation' : 'activation'} de l'utilisateur`;
        
        if (statusCode === 401 || statusCode === 403) {
          console.error('Erreur d\'authentification - Redirection vers la page de connexion');
          window.location.href = '/login';
        }
        
        return { success: false, message };
      }
      
      return { 
        success: false, 
        message: `Une erreur inattendue est survenue lors de la ${active ? 'désactivation' : 'activation'}` 
      };
    }
  }
}

export const userService = new UserService();
