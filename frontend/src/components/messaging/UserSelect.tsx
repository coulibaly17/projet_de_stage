import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { userService, type User, type UserListParams } from '@/services/user.service';

// Cache pour stocker les utilisateurs déjà chargés
const usersCache = new Map<string, { data: User[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes de cache

interface UserSelectProps {
  value: string[];
  onChange: (value: string[], users?: User[]) => void;
  className?: string;
  id?: string;
  currentUserId?: string; // Pour exclure l'utilisateur actuel de la liste
  roles?: ('student' | 'teacher' | 'admin')[]; // Pour filtrer par rôles
  searchTerm?: string; // Pour la recherche d'utilisateurs
  [key: string]: unknown;
}

export function UserSelect({ 
  value = [], 
  onChange, 
  className, 
  currentUserId,
  roles = [],
  searchTerm = '',
  ...props 
}: Readonly<UserSelectProps>) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Créer une clé de cache basée sur les paramètres de la requête
  const cacheKey = useMemo(() => {
    return JSON.stringify({ roles, searchTerm, currentUserId });
  }, [roles, searchTerm, currentUserId]);

  // Utilisation de useCallback pour mémoriser la fonction fetchUsers
  const fetchUsers = useCallback(async () => {
    let isMounted = true;
    
    try {
      // Vérifier le cache d'abord
      const cachedData = usersCache.get(cacheKey);
      const now = Date.now();
      
      if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
        console.log('Utilisation des utilisateurs en cache');
        setUsers(cachedData.data);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Vérifier si l'utilisateur est authentifié
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('Aucun token d\'authentification trouvé');
        setError('Vous devez être connecté pour accéder à cette fonctionnalité');
        return;
      }
      
      // Préparer les paramètres de requête
      const params: UserListParams = {};
      if (roles.length > 0) {
        params.role = roles[0];
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      console.log('Chargement des utilisateurs avec les paramètres:', params);
      
      // Récupérer les utilisateurs depuis l'API
      const users = await userService.getUsers(params);
      
      if (!isMounted) return;
      
      // Filtrer l'utilisateur actuel si nécessaire
      const filteredUsers = currentUserId 
        ? users.filter(user => user.id !== currentUserId)
        : users;
      
      // Mettre à jour le cache
      usersCache.set(cacheKey, {
        data: filteredUsers,
        timestamp: Date.now()
      });
        
      console.log('Utilisateurs chargés avec succès:', filteredUsers.length);
      setUsers(filteredUsers);
      
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      
      if (!isMounted) return;
      
      if (err.statusCode === 401 || err.statusCode === 403) {
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        // Redirection gérée par le service
        return;
      }
      
      setError(err.message ?? 'Impossible de charger la liste des utilisateurs. Veuillez réessayer.');
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, [cacheKey, currentUserId, roles, searchTerm]);

  // Utilisation de useEffect avec un tableau de dépendances plus précis
  useEffect(() => {
    let isMounted = true;
    
    // Fonction pour gérer le debounce
    const debouncedFetch = () => {
      if (isMounted) {
        fetchUsers();
      }
    };
    
    // Démarrer un nouveau timer
    const debounceTimer = setTimeout(debouncedFetch, 500);
    
    // Nettoyage
    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [fetchUsers]);

  const selectedUsers = users.filter(user => value.includes(user.id));

  const handleSelect = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter(id => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  // Rendu conditionnel
  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground flex items-center">
          <span>Chargement des utilisateurs...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      );
    }
    
    if (users.length === 0) {
      return (
        <div className="rounded-md border border-input bg-background p-3 text-sm text-muted-foreground">
          Aucun utilisateur trouvé.
        </div>
      );
    }
    
    return (
      <>
        <select
          ref={selectRef}
          multiple
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            // Trouver les utilisateurs complets correspondant aux IDs sélectionnés
            const selectedUsers = users.filter(user => 
              selectedOptions.includes(user.id.toString())
            );
            onChange(selectedOptions, selectedUsers);
          }}
          disabled={loading}
          className={cn(
            'w-full min-h-10 p-2 text-sm border rounded-md bg-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:opacity-70 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        >
          {users
            .filter(user => user.first_name || user.last_name) // Filtrer les utilisateurs sans nom
            .map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name} {user.email ? `(${user.email})` : ''}
              </option>
            ))}
        </select>
        <ChevronsUpDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </>
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {renderContent()}
      </div>

      {!loading && selectedUsers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedUsers
            .filter(user => user.first_name || user.last_name) // Filtrer les utilisateurs sans nom
            .map(user => (
              <Badge 
                key={user.id} 
                variant="secondary" 
                className="flex items-center gap-1"
              >
                <span>{user.first_name} {user.last_name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(user.id);
                }}
                className="ml-1 rounded-full hover:bg-accent/50 p-0.5"
                aria-label={`Retirer ${user.first_name} ${user.last_name}`}
              >
                <span className="sr-only">Retirer</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="12" 
                  height="12" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
