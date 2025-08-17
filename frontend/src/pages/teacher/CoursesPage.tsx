import React, { useState, useEffect } from 'react';
import { 
  Typography, Button, Box, Grid, Card, CardContent, 
  CardMedia, CardActions, Chip, CircularProgress, Snackbar, Alert
} from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { UnifiedDashboard } from '@/components/dashboard/UnifiedDashboard';
import { apiService } from '@/services/api';
import { API_CONFIG } from '@/config/api';
import { useNavigate } from 'react-router-dom';

import CourseModulesModal from '@/components/course/CourseModulesModal';

interface Course {
  id: number;
  title: string;
  description: string;
  image?: string;
  thumbnail_url?: string;
  category: string;
  students: number;
  students_count?: number;
  progress: number;
  lastUpdated: string;
  created_at?: string;
  updated_at?: string;
  tags?: Array<{ id: number; name: string }>;
}

// Fonctions utilitaires pour réduire la complexité cognitive
const getCategoryName = (course: any, isMinimalData: boolean): string => {
  if (course.category?.name) {
    return course.category.name;
  }
  if (typeof course.category === 'string') {
    return course.category;
  }
  if (course.category_id) {
    return `Catégorie ${course.category_id}`;
  }
  return isMinimalData ? 'Général' : 'Non catégorisé';
};

const getStudentCount = (course: any): number => {
  if (Array.isArray(course.students)) {
    return course.students.length;
  }
  if (course.enrolled_students) {
    return course.enrolled_students.length;
  }
  return course.student_count ?? 0;
};

// Fonction utilitaire pour formater et valider les URLs d'images
const formatImageUrl = (url: string | undefined | null): string | null => {
  // Vérifier si l'URL est null, undefined ou vide
  if (!url || url.trim() === '') {
    return null;
  }
  
  try {
    // Si l'URL est une URL de recherche Bing ou contient "search"
    if (url.includes('bing.com/images/search') || url.includes('search?') || url.includes('view=detailV2')) {
      return null;
    }
    
    // Si l'URL ne commence pas par http:// ou https://, ajouter https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  } catch (error) {
    console.error('Erreur lors du formatage de l\'URL de l\'image:', error);
    return null;
  }
};

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // États supprimés car les boutons Voir, Détails et Modifier ont été retirés
  
  // État pour le modal des modules
  const [modulesModalOpen, setModulesModalOpen] = useState(false);
  const [selectedCourseForModules, setSelectedCourseForModules] = useState<{ id: number; title: string } | null>(null);


  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await apiService.get<any>(API_CONFIG.ENDPOINTS.TEACHER.COURSES_COMPLETE);
        console.log('Courses response:', response);
  
        const formattedCourses: Course[] = [];
  
        if (Array.isArray(response)) {
          for (const course of response) {
            try {
              // Vérifie si l’enseignant a accès au cours (appel de vérification)
              await apiService.get(`teacher/dashboard/courses/${course.id}`);
  
              // Traitement normal si le cours est accessible
              const isMinimalData = !course.description && !course.category;
              let defaultDescription = 'Aucune description disponible';
              if (isMinimalData && (course.title || course.name)) {
                const courseTitle = course.title ?? course.name;
                defaultDescription = `Ce cours de ${courseTitle} vous permettra d'acquérir les compétences fondamentales dans ce domaine.`;
              }
  
              formattedCourses.push({
                id: course.id,
                title: course.title ?? course.name ?? 'Sans titre',
                description: course.description ?? course.short_description ?? defaultDescription,
                image: formatImageUrl(course.thumbnail_url ?? course.image) ??
                       `https://source.unsplash.com/random/800x600?${(course.title ?? course.name ?? 'education').replace(/\s+/g, '+')}`,
                category: getCategoryName(course, isMinimalData),
                students: getStudentCount(course),
                progress: 0,
                lastUpdated: course.updated_at ?? course.created_at ?? new Date().toISOString().split('T')[0]
              });
            } catch (accessErr) {
              console.warn(`Cours ignoré (accès refusé) — ID: ${course.id}`, accessErr);
              continue;
            }
          }
        }
  
        setCourses(formattedCourses);
      } catch (err) {
        console.error('Erreur lors du chargement des cours', err);
        setError('Impossible de charger les cours. Veuillez réessayer plus tard.');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCourses();
  }, []);
  
  const handleNewCourse = () => {
    navigate('/teacher/courses/new');
  };

  const handleNewCourseWorkflow = () => {
    navigate('/enseignant/cours/workflow');
  };



  // Fonction pour ouvrir le modal des modules
  const handleOpenModulesModal = (course: Course) => {
    setSelectedCourseForModules({ id: course.id, title: course.title });
    setModulesModalOpen(true);
  };

  // Données de démonstration si aucun cours n'est disponible
  const demoCourses: Course[] = [
  
  ];

  // Utiliser les données de démonstration si aucun cours n'est disponible
  const displayCourses = courses.length > 0 ? courses : demoCourses;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <UnifiedDashboard
      title="Mes Cours"
      subtitle="Gérez vos cours et leur contenu"
      stats={{
        students: displayCourses.reduce((acc, course) => acc + (course.students || 0), 0),
        courses: displayCourses.length,
        assignments: 0,
        quizzes: 0
      }}
      role="teacher"
    >
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2">
          Liste des cours
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleNewCourseWorkflow}
          >
            nouveau cours
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {displayCourses.map((course) => (
          <Grid key={course.id} sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                }
              }}
            >
              <Box sx={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
                <CardMedia
                  component="img"
                  sx={{
                    width: '100%',
                    height: '140px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                  image={course.image || `https://source.unsplash.com/random/400x140?${course.title.replace(/\s+/g, '+')}`}
                  alt={course.title}
                  onError={(e) => {
                    // En cas d'erreur de chargement d'image, utiliser une image de secours
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Éviter les boucles infinies
                    target.src = `https://source.unsplash.com/random/400x140?education,${course.title.replace(/\s+/g, '+')}`;                  
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography gutterBottom variant="h6" component="div" sx={{ mb: 0 }}>
                    {course.title}
                  </Typography>
                  {course.category && (
                    <Chip 
                      label={course.category} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {course.description ?? 'Aucune description disponible'}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {course.students} étudiants
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mis à jour: {course.lastUpdated}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions sx={{ mt: 'auto', justifyContent: 'center' }}>
                <Button 
                  variant="contained"
                  color="primary" 
                  onClick={() => handleOpenModulesModal(course)}
                  title="Voir modules et leçons"
                  startIcon={<ViewModuleIcon />}
                  sx={{ minWidth: 140 }}
                >
                  Voir Modules
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {selectedCourseForModules && (
        <CourseModulesModal
          open={modulesModalOpen}
          onClose={() => setModulesModalOpen(false)}
          courseId={selectedCourseForModules.id}
          courseTitle={selectedCourseForModules.title}
        />
      )}
    </UnifiedDashboard>
  );
};

export default CoursesPage;
