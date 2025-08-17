import {
  useState,
  useEffect,
  useContext,
  createContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

import type { User as AuthUser } from '@/types/auth';

type AppUserRole = 'etudiant' | 'enseignant' | 'admin';

export interface User extends Omit<AuthUser, 'role' | 'isActive' | 'createdAt' | 'updatedAt'> {
  role: AppUserRole;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      try {
        setLoading(true);
        const userData = authService.getCurrentUser();
        if (userData?.firstName && userData?.lastName) {
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Erreur auth (checkAuth):', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authService.login({ email, password });
      if (userData?.firstName && userData?.lastName) {
        setUser(userData);
        navigate('/dashboard');
      } else {
        throw new Error('Données utilisateur incomplètes');
      }
    } catch (err) {
      console.error('Erreur de connexion :', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la connexion'
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      authService.logout();
      setUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
      throw err;
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      login,
      logout,
      loading,
      error,
      isAuthenticated: !!user,
    }),
    [user, loading, error, navigate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
}
