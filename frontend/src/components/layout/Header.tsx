import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, GraduationCap, LogIn, UserPlus, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Utiliser les routes configurées dans config/routes.ts
import { getRoutesByRole } from '@/config/routes';
import type { RouteConfig } from '@/config/routes';


export interface HeaderProps {
  title?: string;
  isSidebarOpen?: boolean;
  onMenuClick?: () => void;
  isPublic?: boolean;
}

export function Header({ 
  title: propTitle = 'ABLOSMART', 
  isSidebarOpen = true, 
  onMenuClick, 
  isPublic = false
}: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/connexion';
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  
  // Déterminer le titre en fonction du rôle de l'utilisateur
  const getAppTitle = () => {
    if (!user) return propTitle;
    
    console.log("Détermination du titre pour le rôle:", user.role);
    
    switch(user.role) {
      case 'admin':
        return 'EduSmart Admin';
      case 'enseignant':
        return 'EduSmart Enseignant';
      case 'etudiant':
        return 'EduSmart Étudiant';
      default:
        return propTitle;
    }
  };
  
  const title = getAppTitle();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (onMenuClick) onMenuClick();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getProfileRoute = () => {
    if (!user) return '/profil';
    
    switch(user.role) {
      case 'admin':
        return '/admin/profil';
      case 'enseignant':
        return '/enseignant/profil';
      case 'etudiant':
        return '/etudiant/profil';
      default:
        return '/profil';
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header 
      className={cn(
        "fixed w-full z-50 transition-all duration-300",
        isScrolled ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm py-2" : "bg-white dark:bg-gray-900 py-3"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link 
            to={user ? getProfileRoute() : "/"} 
            className="flex items-center group"
            onClick={scrollToTop}
          >
            <motion.div 
              className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <GraduationCap className="text-white text-xl" />
            </motion.div>
            <span className="ml-3 text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-blue-400">
              {title}
            </span>
          </Link>
          
          {/* Desktop Navigation - Only show for logged in users and non-public pages */}
          {user && !isPublic && (
            <nav className="hidden md:flex items-center space-x-1">
              {user.role && getRoutesByRole(user.role).map((item: RouteConfig) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 rounded-lg font-medium flex items-center transition-colors",
                    "text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-white",
                    "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {item.icon && <span className="mr-2">{React.createElement(item.icon)}</span>}
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
          

          
{/* Bouton de menu pour mobile et desktop - ne pas afficher sur les pages publiques */}
          {!isPublic && (
            <div className="flex items-center">
              <button 
                className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={onMenuClick ? onMenuClick : toggleMobileMenu}
                aria-label="Menu"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          )}
          
          {/* Mobile Auth Buttons - Only show when menu is open */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 bg-black/50 z-40 mt-16" onClick={closeMobileMenu}>
              <div className="bg-white dark:bg-gray-900 p-4 shadow-lg" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col space-y-2">
                  {user ? (
                    // Si l'utilisateur est connecté
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          handleLogout();
                          closeMobileMenu();
                        }}
                        className="w-full justify-start"
                      >
                        Déconnexion
                      </Button>
                      <Link 
                        to={getProfileRoute()} 
                        className="w-full"
                        onClick={closeMobileMenu}
                      >
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <User className="h-4 w-4 mr-2" />
                          Mon Profil
                        </Button>
                      </Link>
                    </>
                  ) : !isLoginPage ? (
                    // Si l'utilisateur n'est pas connecté et n'est pas sur la page de connexion
                    <>
                      <Link 
                        to="/connexion" 
                        className="w-full"
                        onClick={closeMobileMenu}
                      >
                        <Button variant="ghost" className="w-full justify-start">
                          <LogIn className="h-4 w-4 mr-2" />
                          Connexion
                        </Button>
                      </Link>
                      <Link 
                        to="/inscription" 
                        className="w-full"
                        onClick={closeMobileMenu}
                      >
                        <Button className="w-full justify-start">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Inscription
                        </Button>
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              // Si l'utilisateur est connecté
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-sm"
                >
                  Déconnexion
                </Button>
                <Link to={getProfileRoute()} aria-label="Profil utilisateur">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full"
                    aria-label="Profil"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : !isLoginPage ? (
              // Si l'utilisateur n'est pas connecté et n'est pas sur la page de connexion
              <>
                <Link to="/connexion">
                  <Button variant="ghost" className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Connexion
                  </Button>
                </Link>
                <Link to="/inscription">
                  <Button className="flex items-center">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Inscription
                  </Button>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
