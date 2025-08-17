import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  useMediaQuery,
  useTheme,
  Breadcrumbs
} from '@mui/material';

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  Forum as ForumIcon,
  TrendingUp as ProgressIcon,
  Recommend as RecommendIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';

import { useAuth } from '@/context/AuthContext';

// Largeur du drawer
const drawerWidth = 240;

// Style pour le contenu principal
interface MainProps {
  open?: boolean;
}

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<MainProps>(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
    [theme.breakpoints.down('md')]: {
      marginLeft: 0,
      padding: theme.spacing(2),
    },
  }),
);

// Style pour la barre d'outils
const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  // Nécessaire pour que le contenu soit sous la barre d'application
  ...theme.mixins.toolbar,
}));

// Interface pour les props du layout étudiant
type StudentLayoutProps = {
  children: ReactNode;
};

// Définition des onglets principaux pour la navigation
interface TabItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const tabs: TabItem[] = [
  { label: 'Tableau de bord', path: '/etudiant', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Mes cours', path: '/etudiant/cours', icon: <SchoolIcon fontSize="small" /> },
  { label: 'Quiz', path: '/etudiant/quiz', icon: <QuizIcon fontSize="small" /> },
  { label: 'Historique', path: '/etudiant/quiz-history', icon: <QuizIcon fontSize="small" /> },
];

// Items de la sidebar
const sidebarItems = [
  { text: 'Tableau de bord', path: '/etudiant', icon: <DashboardIcon /> },
  { text: 'Mes cours', path: '/etudiant/cours', icon: <SchoolIcon /> },
  { text: 'Quiz', path: '/etudiant/quiz', icon: <QuizIcon /> },
  { text: 'Historique des quiz', path: '/etudiant/quiz-history', icon: <QuizIcon /> },
  { text: 'Discussions', path: '/etudiant/discussions', icon: <ForumIcon /> },
  { text: 'Recommandations', path: '/etudiant/recommandations', icon: <RecommendIcon /> },
];

// Fonction pour obtenir le titre de la page actuelle
const getPageTitle = (pathname: string): string => {
  const path = pathname.split('/').filter(Boolean);
  if (path.length === 1) return 'Tableau de bord';
  
  const pageTitles: Record<string, string> = {
    'cours': 'Mes cours',
    'quiz': 'Quiz',
    'quiz-history': 'Historique des quiz',
    'quiz-results': 'Détails du résultat',
    'discussions': 'Forums de discussion',
    'recommandations': 'Cours recommandés',
    'profil': 'Mon profil'
  };
  
  return pageTitles[path[1]] || 'Page étudiant';
};

// Fonction pour générer les breadcrumbs
const generateBreadcrumbs = (pathname: string) => {
  const paths = pathname.split('/').filter(Boolean);
  let breadcrumbs = [];
  let currentPath = '';
  
  // Toujours commencer par l'accueil
  breadcrumbs.push({ name: 'Accueil', path: '/' });
  
  if (paths.length > 0 && paths[0] === 'etudiant') {
    currentPath = `/${paths[0]}`;
    breadcrumbs.push({ name: 'Espace étudiant', path: currentPath });
    
    for (let i = 1; i < paths.length; i++) {
      currentPath += `/${paths[i]}`;
      const name = paths[i].includes('-') 
        ? paths[i].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : paths[i].charAt(0).toUpperCase() + paths[i].slice(1);
      breadcrumbs.push({ name, path: currentPath });
    }
  }
  
  return breadcrumbs;
};

export function StudentLayout({ children }: StudentLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Utiliser une propriété sûre pour l'avatar
  const userInitial = user && typeof user === 'object' ? (user.email?.charAt(0) || 'U').toUpperCase() : 'U';
  
  // Fermer le drawer sur mobile lors d'un changement de route
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  // Déterminer l'onglet actif
  const activeTab = tabs.findIndex(tab => 
    location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`)
  );
  
  // Gérer le changement d'onglet
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(tabs[newValue].path);
  };
  
  // Gérer l'ouverture du menu profil
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Gérer la fermeture du menu profil
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Gérer la déconnexion
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };
  
  // Générer les breadcrumbs
  const breadcrumbs = generateBreadcrumbs(location.pathname);
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Barre d'application */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: '#fff',
          color: '#333',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
        }}
      >
        <StyledToolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="ouvrir le menu"
              onClick={() => setOpen(!open)}
              edge="start"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              AbloAI
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Paramètres">
              <IconButton color="inherit">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Profil">
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                  {userInitial}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </StyledToolbar>
        
        {/* Menu profil */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={() => navigate('/etudiant/profil')}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            Mon profil
          </MenuItem>
          <MenuItem onClick={() => navigate('/etudiant/parametres')}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Paramètres
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Déconnexion
          </MenuItem>
        </Menu>
      </AppBar>
      
      {/* Drawer latéral */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: ['48px', '56px', '64px'],
            height: 'auto',
            bottom: 0,
          },
        }}
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
      >
        <List>
          {sidebarItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? '#1976d2' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiListItemText-primary': { 
                      fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                      color: location.pathname === item.path ? '#1976d2' : 'inherit'
                    } 
                  }} 
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      {/* Contenu principal */}
      <Main sx={{ marginLeft: open ? `${drawerWidth}px` : 0 }}>
        <StyledToolbar />
        
        {/* Breadcrumbs */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 2, mt: 1 }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return isLast ? (
              <Typography key={crumb.path} color="text.primary" fontWeight="medium">
                {crumb.name}
              </Typography>
            ) : (
              <Link 
                key={crumb.path} 
                to={crumb.path}
                style={{ textDecoration: 'none', color: '#1976d2' }}
              >
                {crumb.name}
              </Link>
            );
          })}
        </Breadcrumbs>
        
        {/* Titre de la page */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          {getPageTitle(location.pathname)}
        </Typography>
        
        {/* Onglets de navigation (uniquement sur certaines pages) */}
        {activeTab !== -1 && (
          <Tabs 
            value={activeTab !== -1 ? activeTab : 0} 
            onChange={handleTabChange}
            aria-label="navigation étudiante"
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            {tabs.map((tab) => (
              <Tab 
                key={tab.path} 
                label={tab.label} 
                icon={tab.icon as React.ReactElement} 
                iconPosition="start"
              />
            ))}
          </Tabs>
        )}
        
        {/* Contenu de la page */}
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          {children}
        </Box>
      </Main>
    </Box>
  );
}

export default StudentLayout;
