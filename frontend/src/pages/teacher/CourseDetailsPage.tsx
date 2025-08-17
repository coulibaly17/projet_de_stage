import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { apiService } from '@/services/api';
import {
  Container, Typography, Box, Paper, Card, CardMedia, 
  CircularProgress, Button, Chip, Divider, Accordion, AccordionSummary, AccordionDetails,
  List, ListItem, ListItemText, ListItemIcon, ListItemButton, Badge, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BookIcon from '@mui/icons-material/Book';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QuizIcon from '@mui/icons-material/Quiz';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';

// Interfaces pour les types de données
interface Lesson {
  id: number;
  title: string;
  description: string;
  type: string;
  duration: number;
  duration_minutes?: number;
  order: number;
  order_index?: number;
  content: string;
  video_url?: string;
  module_id?: number;
}

interface Module {
  id: number;
  title: string;
  description?: string;
  order: number;
  order_index?: number;
  course_id?: number;
  lessons: Lesson[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  image?: string;
  thumbnail_url?: string;
  category?: string | { name: string; id: number; description?: string };
  students_count?: number;
  created_at?: string;
  updated_at?: string;
  modules?: Module[];
}

// Fonction utilitaire pour formater et valider les URLs d'images
const formatImageUrl = (url: string | undefined | null): string => {
  // Vérifier si l'URL est null, undefined ou vide
  if (!url || url.trim() === '') {
    return '/placeholder-course.jpg';
  }
  
  try {
    // Si l'URL est une URL de recherche Bing ou contient "search"
    if (url.includes('bing.com/images/search') || url.includes('search?') || url.includes('view=detailV2')) {
      return '/placeholder-course.jpg';
    }
    
    // Si l'URL ne commence pas par http:// ou https://, ajouter https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  } catch (error) {
    console.error('Erreur lors du formatage de l\'URL de l\'image:', error);
    return '/placeholder-course.jpg';
  }
};

// Fonction pour formater la durée en minutes et secondes
const formatDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  return `${minutes} min ${seconds} sec`;
};

const CourseDetailsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  console.log('CourseDetailsPage - courseId:', courseId);
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  
  // Récupérer les détails du cours au chargement
  useEffect(() => {
    console.log('useEffect pour fetchCourseDetails déclenché, courseId:', courseId);
    
    // Vérifier si l'utilisateur est authentifié
    const authToken = localStorage.getItem('auth_token');
    console.log('Token d\'authentification présent:', authToken ? 'Oui' : 'Non');
    if (authToken) {
      console.log('Token:', authToken.substring(0, 20) + '...');
    }
    
    const fetchCourseDetails = async () => {
      console.log('Fonction fetchCourseDetails exécutée, courseId:', courseId);
      if (!courseId) {
        console.log('Pas de courseId, sortie de la fonction');
        return;
      }
      
      setLoading(true);
      try {
        console.log('Configuration API:', {
          baseURL: axios.defaults.baseURL,
          headers: axios.defaults.headers
        });
        
        // 1. Récupérer les informations de base du cours
        const apiUrl = `teacher/dashboard/courses/${courseId}`;
        console.log('URL API utilisée pour le cours:', apiUrl);
        
        // Utiliser apiService qui gère l'authentification
        const courseData = await apiService.get<any>(apiUrl);
        console.log('Détails du cours:', courseData);
        
        // Formater les données du cours
        const formattedCourse: Course = {
          id: courseData.id,
          title: courseData.title || 'Cours sans titre',
          description: courseData.description || 'Aucune description disponible',
          image: courseData.thumbnail_url || courseData.image,
          thumbnail_url: courseData.thumbnail_url,
          category: courseData.category || 'Non catégorisé',
          students_count: courseData.students_count || 0,
          created_at: courseData.created_at,
          updated_at: courseData.updated_at
        };
        
        setCourse(formattedCourse);
        
        // 2. Récupérer les modules du cours
        const modulesUrl = `teacher/dashboard/courses/${courseId}/modules`;
        console.log('URL API utilisée pour les modules:', modulesUrl);
        
        // Utiliser apiService qui gère l'authentification
        const modulesData = await apiService.get<any>(modulesUrl);
        console.log('Modules du cours:', modulesData);
        
        // Traiter les modules et récupérer les leçons pour chaque module
        const formattedModules: Module[] = [];
        
        // Pour chaque module, récupérer ses leçons
        for (const moduleData of Array.isArray(modulesData) ? modulesData : []) {
          const moduleId = moduleData.id;
          const lessonsUrl = `teacher/dashboard/courses/${courseId}/modules/${moduleId}/lessons`;
          console.log(`URL API utilisée pour les leçons du module ${moduleId}:`, lessonsUrl);
          
          try {
            // Utiliser apiService qui gère l'authentification
            const lessonsData = await apiService.get<any>(lessonsUrl);
            console.log(`Leçons du module ${moduleId}:`, lessonsData);
            
            const formattedLessons = Array.isArray(lessonsData) ? lessonsData.map((lesson: any) => ({
              id: lesson.id,
              title: lesson.title || 'Leçon sans titre',
              description: lesson.description || '',
              type: lesson.video_url ? 'video' : (lesson.type || 'text'),
              duration: lesson.duration_minutes || lesson.duration || 0,
              duration_minutes: lesson.duration_minutes,
              order: lesson.order_index || lesson.order || 0,
              order_index: lesson.order_index,
              content: lesson.content || '',
              video_url: lesson.video_url || '',
              module_id: lesson.module_id || moduleId
            })) : [];
            
            formattedModules.push({
              id: moduleData.id,
              title: moduleData.title || 'Module sans titre',
              description: moduleData.description || '',
              order: moduleData.order_index || moduleData.order || 0,
              order_index: moduleData.order_index,
              course_id: moduleData.course_id || parseInt(courseId),
              lessons: formattedLessons
            });
          } catch (lessonError) {
            console.error(`Erreur lors du chargement des leçons pour le module ${moduleId}:`, lessonError);
            // Ajouter le module même si on n'a pas pu récupérer ses leçons
            formattedModules.push({
              id: moduleData.id,
              title: moduleData.title || 'Module sans titre',
              description: moduleData.description || '',
              order: moduleData.order_index || moduleData.order || 0,
              order_index: moduleData.order_index,
              course_id: moduleData.course_id || parseInt(courseId),
              lessons: []
            });
          }
        }
        
        // Trier les modules par ordre
        formattedModules.sort((a, b) => (a.order_index || a.order) - (b.order_index || b.order));
        setModules(formattedModules);
        setError(null);
      } catch (err: any) {
        console.error('Erreur lors du chargement des détails du cours:', err);
        if (err.response) {
          console.error('Détails de l\'erreur:', {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data
          });
        }
        setError(`Impossible de charger les détails du cours: ${err.message || 'Erreur inconnue'}`);
        toast.error('Erreur lors du chargement des détails du cours');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [courseId]);
  
  // Fonction pour gérer le clic sur une leçon
  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    
    // Si c'est une vidéo, ouvrir dans un nouvel onglet
    if (lesson.video_url) {
      console.log('Ouverture de la vidéo:', lesson.video_url);
      toast.info(`Ouverture de la vidéo: ${lesson.title}`);
      window.open(lesson.video_url, '_blank');
    }
    // Sinon, afficher le contenu de la leçon dans la page
    else {
      // Faire défiler jusqu'au contenu de la leçon
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    }
  };
  
  // Fonction pour revenir à la liste des cours
  const handleBackToCourses = () => {
    navigate('/enseignant/cours');
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Bouton de retour */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleBackToCourses}
        sx={{ mb: 3 }}
      >
        Retour à la liste des cours
      </Button>
      
      {/* Affichage du chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Affichage des erreurs */}
      {error && !loading && (
        <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText', mb: 4 }}>
          <Typography variant="body1">{error}</Typography>
        </Paper>
      )}
      
      {/* Contenu principal - affiché uniquement si le cours est chargé et qu'il n'y a pas d'erreur */}
      {course && !loading && !error && (
        <>
          {/* En-tête du cours */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ width: { xs: '100%', md: '33%' } }}>
                <Card sx={{ height: '100%' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={formatImageUrl(course.image || course.thumbnail_url)}
                    alt={course.title}
                    onError={(e) => {
                      // En cas d'erreur de chargement d'image, utiliser une image de secours
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Éviter les boucles infinies
                      target.src = `/placeholder-course.jpg`;
                    }}
                  />
                </Card>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '67%' } }}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {course.title}
                </Typography>
                <Typography variant="body1" paragraph>
                  {course.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  {typeof course.category === 'object' && course.category?.name ? (
                    <Chip icon={<CategoryIcon />} label={course.category.name} color="primary" variant="outlined" />
                  ) : (
                    <Chip icon={<CategoryIcon />} label={typeof course.category === 'string' ? course.category : 'Non catégorisé'} color="primary" variant="outlined" />
                  )}
                  <Chip icon={<PeopleIcon />} label={`${course.students_count || 0} étudiants`} variant="outlined" />
                  <Chip icon={<CalendarTodayIcon />} label={`Mis à jour le ${new Date(course.updated_at || course.created_at || '').toLocaleDateString()}`} variant="outlined" />
                </Box>
              </Box>
            </Box>
          </Paper>
          
          {/* Liste des modules et leçons */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Contenu du cours
          </Typography>
          
          {modules && modules.length > 0 ? (
            modules.map((module) => (
              <Accordion key={module.id} defaultExpanded={true} sx={{ mb: 2 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls={`module-${module.id}-content`}
                  id={`module-${module.id}-header`}
                  sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }}
                >
                  <Typography variant="h6">
                    Module {module.order_index || module.order}: {module.title}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {module.description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {module.description}
                    </Typography>
                  )}
                  
                  <List>
                    {module.lessons && module.lessons.length > 0 ? (
                      module.lessons
                        .sort((a, b) => (a.order_index || a.order) - (b.order_index || b.order))
                        .map((lesson) => (
                          <ListItem 
                            key={lesson.id} 
                            disablePadding 
                            sx={{ mb: 1 }}
                          >
                            <ListItemButton 
                              onClick={() => handleLessonClick(lesson)}
                              sx={{
                                borderRadius: '4px',
                                border: '1px solid rgba(0, 0, 0, 0.12)',
                                '&:hover': {
                                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                                },
                              }}
                            >
                              <ListItemIcon>
                                {lesson.video_url ? (
                                  <Tooltip title="Leçon vidéo - Cliquez pour regarder">
                                    <Badge color="error" variant="dot">
                                      <OndemandVideoIcon color="primary" />
                                    </Badge>
                                  </Tooltip>
                                ) : lesson.type === 'quiz' ? (
                                  <Tooltip title="Quiz">
                                    <QuizIcon color="secondary" />
                                  </Tooltip>
                                ) : lesson.type === 'assignment' ? (
                                  <Tooltip title="Devoir">
                                    <AssignmentIcon color="action" />
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Leçon textuelle">
                                    <BookIcon />
                                  </Tooltip>
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body1">
                                      {`${lesson.order_index || lesson.order}. ${lesson.title}`}
                                    </Typography>
                                    {lesson.video_url && (
                                      <PlayCircleOutlineIcon 
                                        fontSize="small" 
                                        color="primary" 
                                        sx={{ ml: 1 }} 
                                      />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <>
                                    {lesson.description && <span>{lesson.description}<br /></span>}
                                    {(lesson.duration_minutes || lesson.duration) > 0 && (
                                      <span>Durée: {formatDuration(lesson.duration_minutes || lesson.duration)}</span>
                                    )}
                                  </>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                        ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="Aucune leçon disponible dans ce module" />
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">Aucun module  pour ce cours.</Typography>
            </Paper>
          )}
          
          {/* Affichage du contenu de la leçon sélectionnée (pour les leçons non-vidéo) */}
          {selectedLesson && !selectedLesson.video_url && (
            <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
              <Typography variant="h5" gutterBottom>
                {selectedLesson.title}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default CourseDetailsPage;