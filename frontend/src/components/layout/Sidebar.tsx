import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRoutesByRole, isActiveRoute } from '@/config/routes';

// Nous utilisons maintenant la configuration centralisée des routes depuis config/routes.ts

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ className, isOpen = true, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavItems = () => {
    if (!user) return [];
    // Assurer que le rôle est correctement utilisé pour obtenir les routes
    console.log("Rôle de l'utilisateur dans Sidebar:", user.role);
    return getRoutesByRole(user.role);
  };

  const navItems = getNavItems();

  // Ne rien afficher si la sidebar est fermée
  if (!isOpen) return null;
  
  // Ne rien afficher si aucun élément de navigation n'est disponible
  if (navItems.length === 0) {
    console.error("Aucun élément de navigation disponible pour le rôle:", user?.role);
    return null;
  }

  return (
    <div className={cn("flex flex-col w-64 border-r bg-white dark:bg-gray-900", className)}>
      <div className="flex flex-col h-full">
        <div className="flex h-16 items-center border-b px-4">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">AbloAI</span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = isActiveRoute(location.pathname, item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose?.()}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                  'group'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={logout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
}

// Composant Link manquant
function Link({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={to} className={className}>
      {children}
    </a>
  );
}
