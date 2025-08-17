import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  PlusCircle,
  Award,
  MessageSquare
} from 'lucide-react';

export interface RouteConfig {
  name: string;
  path: string;
  icon: any;
  roles?: string[];
  children?: RouteConfig[];
}

// Routes pour les étudiants
export const studentRoutes: RouteConfig[] = [
  {
    name: 'Tableau de bord',
    path: '/etudiant',
    icon: LayoutDashboard,
  },
  {
    name: 'Mes cours',
    path: '/etudiant/cours',
    icon: BookOpen,
  },
  {
    name: 'Quiz',
    path: '/etudiant/quiz',
    icon: ClipboardCheck,
  },
  {
    name: 'Historique des quiz',
    path: '/etudiant/quiz-history',
    icon: ClipboardCheck,
  },
  {
    name: 'Devoirs',
    path: '/etudiant/devoirs',
    icon: ClipboardCheck,
  },
  {
    name: 'Discussions',
    path: '/etudiant/discussions',
    icon: Users,
  },
  {
    name: 'Ma progression',
    path: '/etudiant/progression',
    icon: Award,
  },
  {
    name: 'Recommandations',
    path: '/etudiant/recommandations',
    icon: Award,
  },
  {
    name: 'Messagerie',
    path: '/etudiant/messagerie',
    icon: MessageSquare,
  },
];

// Routes pour les enseignants
export const teacherRoutes: RouteConfig[] = [
  {
    name: 'Tableau de bord',
    path: '/enseignant',
    icon: LayoutDashboard,
  },
  {
    name: 'Mes cours',
    path: '/enseignant/cours',
    icon: BookOpen,
  },
  {
    name: 'Créer un cours',
    path: '/enseignant/cours/workflow',
    icon: PlusCircle,
  },
  {
    name: 'Quiz',
    path: '/enseignant/quiz',
    icon: ClipboardCheck,
  },

  {
    name: 'Étudiants',
    path: '/enseignant/etudiants',
    icon: Users,
  },
  {
    name: 'Messagerie',
    path: '/enseignant/messagerie',
    icon: MessageSquare,
  },
];

// Routes pour les administrateurs
export const adminRoutes: RouteConfig[] = [
  {
    name: 'Tableau de bord',
    path: '/admin',
    icon: LayoutDashboard,
  },
];

// Fonction pour obtenir les routes en fonction du rôle
export const getRoutesByRole = (role?: string): RouteConfig[] => {
  console.log("getRoutesByRole appelé avec le rôle:", role);
  
  switch (role) {
    case 'admin':
      console.log("Retourne les routes admin");
      return adminRoutes;
    case 'enseignant':
      console.log("Retourne les routes enseignant");
      return teacherRoutes;
    case 'etudiant':
      console.log("Retourne les routes étudiant");
      return studentRoutes;
    default:
      console.log("Rôle non reconnu, retourne les routes étudiant par défaut");
      return studentRoutes;
  }
};

// Fonction pour vérifier si un chemin est actif (pour la navigation)
export const isActiveRoute = (currentPath: string, routePath: string): boolean => {
  // Exact match
  if (currentPath === routePath) return true;
  
  // Check if it's a parent route (e.g. /enseignant is parent of /enseignant/cours)
  if (routePath !== '/' && currentPath.startsWith(routePath)) return true;
  
  return false;
};
