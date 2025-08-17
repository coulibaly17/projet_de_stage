import * as React from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'etudiant' | 'enseignant' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  avatar?: string;
  isSuperuser?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role?: 'etudiant' | 'enseignant' | 'admin';
  password: string;
}

// API
const authApi = {
  login: async (credentials: LoginCredentials) => {
    return authService.login({
      email: credentials.email,
      password: credentials.password
    });
  },

  register: async (data: RegisterData) => {
    // Convertir les données de l'utilisateur en format snake_case pour l'API
    const registerData = {
      email: data.email,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      password: data.password
    };
    
    return authService.register(registerData);
  },
  
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return null;
      
      // S'assurer que l'utilisateur a le format attendu
      return {
        ...user,
        username: user.username || user.email.split('@')[0],
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        role: user.role || 'etudiant',
        isActive: user.isActive ?? true,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || null,
        isSuperuser: user.isSuperuser || false,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<User>;
  refetchUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: authApi.getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Appeler l'API de connexion
      await authApi.login({ email, password });
      
      // Forcer le rechargement des données utilisateur
      const user = await queryClient.fetchQuery({
        queryKey: ['user'],
        queryFn: authApi.getCurrentUser,
        staleTime: 0, // Toujours récupérer les données fraîches
      });
      
      // Mettre à jour le cache avec les nouvelles données
      queryClient.setQueryData(['user'], user);
      
      // Ne rien retourner pour correspondre à l'interface AuthContextType
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }, [queryClient]);

  const register = useCallback(async (data: RegisterData): Promise<User> => {
    // Créer un objet avec les données au format attendu par l'API (snake_case)
    const apiData = {
      email: data.email,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      role: data.role || 'etudiant',
    };

    // Appeler l'API d'inscription avec les données au format camelCase
    // La conversion en snake_case sera gérée par le service d'authentification
    const response = await authApi.register(apiData);

    if (response?.user) {
      // Se connecter après l'inscription
      await login(data.email, data.password);
      
      // Récupérer les données fraîches de l'utilisateur
      const currentUser = await authApi.getCurrentUser();
      if (currentUser) {
        return currentUser;
      }
      
      // Si on ne peut pas récupérer l'utilisateur, utiliser les données de la réponse
      const user = response.user;
      return {
        id: user.id,
        email: user.email,
        username: user.username || data.username,
        firstName: user.firstName || data.firstName || null,
        lastName: user.lastName || data.lastName || null,
        role: (user.role || data.role || 'etudiant') as 'etudiant' | 'enseignant' | 'admin',
        isActive: user.isActive ?? true,
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || null,
        isSuperuser: user.isSuperuser || false,
      };
    }
    
    // Si on n'a pas de réponse utilisateur, essayer de récupérer l'utilisateur actuel
    const currentUser = await authApi.getCurrentUser();
    if (currentUser) {
      return currentUser;
    }
    
    throw new Error('Erreur lors de l\'inscription : impossible de récupérer les informations de l\'utilisateur');
  }, [login]);

  const logout = useCallback(() => {
    authService.logout();
    queryClient.setQueryData(['user'], null);
    navigate('/login');
  }, [navigate, queryClient]);
  
  const refetchUser = useCallback(async (): Promise<User | null> => {
    const user = await authApi.getCurrentUser();
    queryClient.setQueryData(['user'], user);
    return user;
  }, [queryClient]);

  const isAdmin = useMemo(() => {
    return user?.isSuperuser || false;
  }, [user]);

  const value = useMemo(() => ({
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    login,
    logout,
    register,
    refetchUser,
  }), [user, isLoading, isAdmin, login, logout, register, refetchUser]);

  // Si en cours de chargement, afficher un indicateur de chargement simple
  if (isLoading) {
    return React.createElement(
      'div', 
      { 
        className: 'flex items-center justify-center min-h-screen' 
      },
      React.createElement(
        'div', 
        { 
          className: 'w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin' 
        }
      )
    );
  }

  return React.createElement(AuthContext.Provider, { value }, children);
}
