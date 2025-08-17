import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import CoursesList from '@/components/dashboard/CoursesList';
import StudentActivities from '@/components/dashboard/StudentActivities';
import { apiService } from '@/services/api';
import { courseService } from '@/services/course.service';
import { StudentProgressOverview } from '@/components/progress/StudentProgressOverview';

// UI Components
import { 
  Box, Container, Typography, TextField, InputAdornment, 
  IconButton, Skeleton, Alert, Card, 
  Avatar, LinearProgress, Button,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  Quiz as QuizIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';

// Import des types
import type { Course } from '@/components/dashboard/CoursesList';
import type { Activity, UpcomingQuiz } from '@/components/dashboard/StudentActivities';

// Ajout du type pour la date dans UpcomingQuiz
interface EnhancedUpcomingQuiz extends UpcomingQuiz {
  date: string;
}

// Définition du type DashboardData spécifique à cette page
interface DashboardData {
  stats: {
    coursesEnrolled: number;
    completedCourses: number;
    hoursSpent: number;
    averageScore: number;
    passedQuizzes: number;
  };
  inProgressCourses: Course[];
  recommendedCourses: Course[];
  recentActivities: Activity[];
  upcomingQuizzes: EnhancedUpcomingQuiz[];
}

// Données par défaut en cas d'erreur de l'API
const defaultDashboardData: DashboardData = {
  stats: {
    coursesEnrolled: 0,
    completedCourses: 0,
    hoursSpent: 0,
    averageScore: 0,
    passedQuizzes: 0
  },
  inProgressCourses: [],
  recommendedCourses: [],
  recentActivities: [],
  upcomingQuizzes: []
};

// Styled components
const SearchInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape?.borderRadius ? `${Number(theme.shape.borderRadius) * 3}px` : '8px',
    backgroundColor: theme.palette.background?.paper ?? '#fff',
    '& fieldset': {
      borderColor: theme.palette.divider ?? '#e0e0e0',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary?.main ?? '#1976d2',
    },
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  marginBottom: theme.spacing(1),
}));

// Component
const StudentDashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>(defaultDashboardData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { user } = useAuth();
  const navigate = useNavigate();

  // Fonction pour adapter les données de cours du backend au format attendu par CoursesList
  const adaptCoursesData = (courses: any[]): Course[] => {
    return courses.map(course => ({
      id: Number(course.id ?? 0),
      title: course.title ?? '',
      description: course.description ?? '',
      instructor: {
        id: Number(course.instructor?.id ?? 0),
        name: course.instructor?.name ?? 'Instructeur',
        avatar: course.instructor?.avatar ?? '/images/avatar-placeholder.jpg'
      },
      progress: course.progress ?? 0,
      imageUrl: course.coverImage ?? course.image ?? '/images/course-placeholder.jpg',
      duration: course.duration ?? '0h',
      lessonsCount: course.lessonsCount ?? 0,
      completedLessons: course.completedLessons ?? 0,
      tags: course.tags ?? []
    }));
  };

  // Adaptation des données pour correspondre aux types attendus
  const adaptDashboardData = (apiData: any): DashboardData => {
    // Ajouter la propriété date aux quiz si elle n'existe pas
    const enhancedQuizzes = (apiData.upcomingQuizzes ?? []).map((quiz: any) => ({
      ...quiz,
      date: quiz.date ?? new Date().toISOString() // Utiliser la date actuelle si non définie
    }));

    return {
      stats: {
        coursesEnrolled: apiData.stats?.coursesEnrolled ?? 0,
        completedCourses: apiData.stats?.completedCourses ?? 0,
        hoursSpent: apiData.stats?.hoursSpent ?? 0,
        averageScore: apiData.stats?.averageScore ?? 0,
        passedQuizzes: apiData.stats?.passedQuizzes ?? 0
      },
      inProgressCourses: adaptCoursesData(apiData.inProgressCourses ?? []),
      recommendedCourses: adaptCoursesData(apiData.recommendedCourses ?? []),
      recentActivities: apiData.recentActivities ?? [],
      upcomingQuizzes: enhancedQuizzes
    };
  };

  // Fonction pour récupérer les données du tableau de bord
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer les données du backend
      const data = await apiService.get<any>('/student/dashboard');

      // Adapter les données pour le composant
      const adaptedData = adaptDashboardData(data);

      setDashboardData(adaptedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Erreur lors du chargement du tableau de bord:', err);
      // Utiliser les données par défaut en cas d'erreur
      setDashboardData(defaultDashboardData);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer les données au chargement
  useEffect(() => {
    if (user?.role === 'etudiant') {
      fetchDashboardData();
      
      // Mettre à jour les données toutes les 5 minutes
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      
      // Écouter les changements de route pour mettre à jour les données
      const handleRouteChange = () => {
        if (window.location.pathname === '/etudiant') {
          fetchDashboardData();
        }
      };
      
      window.addEventListener('popstate', handleRouteChange);
      return () => {
        clearInterval(interval);
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, [user]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  // View all courses
  const handleViewAllCourses = () => {
    navigate('/courses');
  };
  
  // View all activities
  const handleViewAllActivities = () => {
    navigate('/activities');
  };
  
  // Refresh dashboard data
  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    fetchDashboardData();
  };
  
  // Handle course enrollment
  const handleEnroll = async (courseId: number) => {
    try {
      const result = await courseService.enrollInCourse(courseId);
      
      // Afficher un message de succès
      console.log('Inscription réussie:', result.message);
      
      // Recharger les données du dashboard pour mettre à jour les listes
      await fetchDashboardData();
      
      // Optionnel: afficher une notification à l'utilisateur
      // Vous pouvez ajouter un système de notifications ici
      
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      // Optionnel: afficher un message d'erreur à l'utilisateur
    }
  };
  
  // Loading skeleton
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="text" width={200} height={24} />
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
          gap: 2, 
          mb: 3 
        }}>
          {[1, 2, 3].map((item) => (
            <Box key={item}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 4 }} />
            </Box>
          ))}
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Error message */}
      {error && (
        <Alert severity="info" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            {`Bienvenue, ${user?.username ?? 'Étudiant'}`}
          </Typography>
        </Box>
        
       
        
        {/* Stats summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid sx={{ gridColumn: { xs: 'span 6', md: 'span 3' } }}>
            <Card sx={{ p: 2, borderRadius: 2, height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.light', mr: 1.5 }}>
                  <SchoolIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">{dashboardData.stats.coursesEnrolled}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Cours inscrits</Typography>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ mt: 1.5, height: 4, borderRadius: 2 }} 
              />
            </Card>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 6', md: 'span 3' } }}>
            <Card sx={{ p: 2, borderRadius: 2, height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'success.light', mr: 1.5 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">{dashboardData.stats.completedCourses}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Cours terminés</Typography>
              <LinearProgress 
                variant="determinate" 
                value={(dashboardData.stats.completedCourses / Math.max(1, dashboardData.stats.coursesEnrolled)) * 100} 
                color="success"
                sx={{ mt: 1.5, height: 4, borderRadius: 2 }} 
              />
            </Card>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 6', md: 'span 3' } }}>
            <Card 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                cursor: 'pointer', 
                height: '100%',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }} 
              onClick={() => navigate('/etudiant/quiz-history')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'info.light', mr: 1.5 }}>
                  <QuizIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">{dashboardData.stats.passedQuizzes}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Quiz réussis</Typography>
              <LinearProgress 
                variant="determinate" 
                value={dashboardData.stats.averageScore} 
                color="info"
                sx={{ mt: 1.5, height: 4, borderRadius: 2 }} 
              />
            </Card>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 6', md: 'span 3' } }}>
            <Card 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                cursor: 'pointer', 
                height: '100%',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => navigate('/etudiant/quiz')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar sx={{ bgcolor: 'warning.light', mr: 1.5 }}>
                  <CalendarIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">{dashboardData.upcomingQuizzes.length}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">Quiz à venir</Typography>
              <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {dashboardData.upcomingQuizzes.length > 0 
                    ? `Prochain: ${format(new Date(dashboardData.upcomingQuizzes[0].date), 'dd MMM', { locale: fr })}` 
                    : 'Aucun quiz planifié'}
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
        
        {/* Search and refresh buttons */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <form onSubmit={handleSearch} style={{ flexGrow: 1 }}>
            <SearchInput
              placeholder="Rechercher un cours..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              size="small"
              fullWidth
            />
          </form>
          
          <IconButton 
            color="primary" 
            onClick={handleRefresh}
            sx={{ 
              backgroundColor: (theme) => theme.palette.background.paper,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* In Progress Courses */}
        <Box sx={{ mb: 6 }}>
          <CoursesList
            title="Cours en cours"
            courses={dashboardData.inProgressCourses}
            onViewAll={handleViewAllCourses}
            emptyMessage="Vous n'avez pas encore commencé de cours. Explorez nos cours recommandés ci-dessous."
          />
        </Box>
        
        {/* Recommended Courses */}
        {dashboardData.recommendedCourses.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <CoursesList
              title="Cours recommandés pour vous"
              courses={dashboardData.recommendedCourses}
              onViewAll={handleViewAllCourses}
              onEnroll={handleEnroll}
            />
          </Box>
        )}
        
        {/* Activities and Quizzes */}
        <Box sx={{ mb: 6 }}>
          <SectionTitle variant="h5">
            Activités et quiz
          </SectionTitle>
          <StudentActivities
            recentActivities={dashboardData.recentActivities}
            upcomingQuizzes={dashboardData.upcomingQuizzes}
            onViewAllActivities={handleViewAllActivities}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default StudentDashboardPage;
