// ✅ Version corrigée et typée de CourseViewPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_CONFIG } from '../../config/api.config';
import {
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Skeleton,
  Alert,
  Button,
  Divider,
  Box,
  Link,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  Home, 
  ChevronRight, 
  Book, 
  Lock as LockIcon, 
  PlayCircle as PlayCircleIcon, 
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';
import { toast } from 'sonner';

import VideoPlayer from '../../components/courses/VideoPlayer';
import LessonsList from '../../components/courses/LessonsList';
import apiService from '../../services/api.service';

import type { Course, Module, Lesson } from '../../types/course.types';

const CourseViewPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [courseData, setCourseData] = useState<Course | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { 
    data: course, 
    isLoading, 
    isError, 
    error 
  } = useQuery<Course, Error>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('ID du cours requis');
      console.log('Récupération des données du cours avec ID:', courseId);
      try {
        // Utilisation de l'endpoint étudiant pour les cours
        const res = await apiService.get<Course>(`/student/courses/${courseId}`);
        console.log('Réponse complète de l\'API:', res);
        
        if (!res.data) {
          throw new Error('Aucune donnée reçue du serveur');
        }
        
        // Les données sont directement dans res.data (pas de res.data.data)
        const courseData = {
          ...res.data,
          modules: res.data.modules || []
        };
        
        console.log('Données du cours transformées:', courseData);
        
        console.log('Cours transformé:', courseData);
        return courseData;
      } catch (err) {
        console.error('Erreur lors de la récupération du cours:', err);
        throw err;
      }
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  });

  // Mettre à jour les modules quand le cours change
  useEffect(() => {
    if (course) {
      setCourseData(course);
      const mods = (course.modules || []).map((module) => ({
        ...module,
        lessons: (module.lessons || []).map(lesson => ({
          ...lesson,
          duration: lesson.duration || 0
        }))
      }));
      setModules(mods);
    }
  }, [course]);

  // Gérer la sélection de la leçon initiale ou courante
  useEffect(() => {
    if (course && modules.length > 0) {
      const allLessons = modules.flatMap(m => m.lessons);
      console.log('All lessons:', allLessons);
      
      if (allLessons.length > 0) {
        // Si on a un lessonId dans l'URL, on l'utilise, sinon on prend la première leçon
        const selectedLesson = lessonId 
          ? allLessons.find(l => l.id === Number(lessonId))
          : allLessons[0];
        
        if (selectedLesson) {
          console.log('Selected lesson:', selectedLesson);
          // Mettre à jour l'URL si nécessaire
          const expectedPath = `/etudiant/cours/${courseId}/lecons/${selectedLesson.id}`;
          if (window.location.pathname !== expectedPath) {
            console.log('Updating URL to:', expectedPath);
            navigate(expectedPath, { replace: true });
          }
          // Mettre à jour la leçon courante
          setCurrentLesson(selectedLesson);
        } else if (allLessons.length > 0) {
          // Si la leçon n'est pas trouvée mais qu'il y a des leçons, on redirige vers la première
          console.log('Lesson not found, redirecting to first lesson');
          navigate(`/etudiant/cours/${courseId}/lecons/${allLessons[0].id}`, { replace: true });
        }
      } else {
        console.log('No lessons available for this course');
        setCurrentLesson(null);
      }
    }
  }, [course, modules, lessonId, courseId, navigate]);

  const fetchLessonContent = async (id: string | number) => {
    console.log('Fetching lesson content for ID:', id, 'dans le cours:', courseId);
    setIsLoadingLesson(true);
    try {
      // Vérifier d'abord si les IDs sont valides
      if (!courseId || !id) {
        throw new Error('ID de cours ou de leçon manquant');
      }
      
      // Utilisation du bon endpoint pour récupérer les détails d'une leçon
      const url = API_CONFIG.endpoints.studentLesson(id);
      console.log('Appel API vers:', url);
      const res = await apiService.get<any>(url);
      console.log('Réponse API complète:', res);
      
      if (!res || !res.data) {
        throw new Error('Réponse API invalide');
      }
      
      // La réponse contient directement les données de la leçon
      const lessonData = res.data.data || res.data;
      console.log('Données de la leçon reçues:', lessonData);
      
      if (!lessonData) {
        throw new Error('Aucune donnée de leçon reçue');
      }
      
      // Déterminer le type de contenu
      let lessonType = lessonData.type || 'text';
      
      // Si pas de type défini mais qu'il y a une URL vidéo, on suppose que c'est une vidéo
      const videoUrlPattern = /\.(mp4|webm|ogg|youtube\.com|youtu\.be|vimeo\.com)/i;
      const hasVideoUrl = lessonData.video_url || (lessonData.content && videoUrlPattern.test(lessonData.content));
      if (!lessonData.type && hasVideoUrl) {
        lessonType = 'video';
      }
      
      const lesson: Lesson = {
        id: Number(lessonData.id),
        title: lessonData.title || 'Sans titre',
        description: lessonData.description || '',
        content: lessonData.content || '',
        video_url: lessonData.video_url || (lessonType === 'video' ? lessonData.content : undefined),
        duration: lessonData.duration ? Number(lessonData.duration) : 0,
        order_index: lessonData.order_index || 0,
        module_id: lessonData.module_id || 0,
        is_completed: lessonData.is_completed || false,
        type: lessonType,
        isLocked: false,
        isCurrent: lessonData.id === lessonId
      };
      
      console.log('Processed lesson:', lesson);
      setCurrentLesson(lesson);
    } catch (e) {
      console.error('Error in fetchLessonContent:', e);
      toast.error('Erreur lors du chargement de la leçon');
      setCurrentLesson(null);
    } finally {
      setIsLoadingLesson(false);
    }
  };

  // Récupérer le contenu de la leçon quand currentLesson change
  useEffect(() => {
    if (currentLesson) {
      console.log('Current lesson changed, fetching content for:', currentLesson.id);
      fetchLessonContent(currentLesson.id);
    }
  }, [currentLesson?.id]);

  const handleLessonComplete = async (id: number | string) => {
    try {
      await apiService.post(`/student/lessons/${id}/complete`, {});
      toast.success('Leçon complétée');
      if (courseId) {
        await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast.error(`Erreur de progression: ${errorMessage}`);
    }
  };

  const handleEnrollCourse = async () => {
    console.log('handleEnrollCourse appelé');
    console.log('courseId:', courseId);
    
    try {
      if (!courseId) {
        console.error('ID du cours manquant');
        throw new Error('ID du cours manquant');
      }
      
      console.log('Envoi de la demande d\'inscription...');
      // Utilisation du bon endpoint d'inscription
      const response = await apiService.post(`/courses/${courseId}/enroll`, {});
      console.log('Réponse d\'inscription:', response);
      
      if (response && response.data) {
        console.log('Inscription réussie, données:', response.data);
        toast.success('Inscription au cours réussie');
        
        // Rafraîchir les données du cours
        console.log('Invalidation de la requête du cours...');
        await queryClient.invalidateQueries({ 
          queryKey: ['course', courseId],
          refetchType: 'active'
        });
        console.log('Requête invalidée');
      } else {
        console.error('Réponse inattendue du serveur:', response);
        throw new Error('Réponse inattendue du serveur');
      }
    } catch (error: any) {
      console.error('Erreur dans handleEnrollCourse:', error);
      const errorMessage = error?.response?.data?.message || 
                         error?.message || 
                         'Une erreur est survenue lors de l\'inscription';
      toast.error(`Erreur: ${errorMessage}`);
    }
  };

  if (isLoading || !courseData) {
    console.log('Loading course data...');
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={60} />
        <Skeleton variant="rectangular" height={400} />
      </Container>
    );
  }

  if (isError) {
    console.error('Error loading course:', error);
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Erreur de chargement du cours: {error?.message || 'Erreur inconnue'}
        </Alert>
        <Button onClick={() => navigate('/courses')} sx={{ mt: 2 }}>
          Retour à la liste des cours
        </Button>
      </Container>
    );
  }

  if (!courseData) {
    console.log('No course data available');
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">Aucune donnée de cours disponible</Alert>
        <Button onClick={() => navigate('/courses')} sx={{ mt: 2 }}>
          Retour à la liste des cours
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs separator={<ChevronRight fontSize="small" />}>
        <Link component={RouterLink} to="/dashboard" underline="hover">
          <Home fontSize="small" sx={{ mr: 1 }} /> Tableau de bord
        </Link>
        <Link component={RouterLink} to="/courses" underline="hover">
          Mes cours
        </Link>
        <Typography color="text.primary">{courseData.title}</Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 2 }}>{courseData.title}</Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>{courseData.description}</Typography>
      {!courseData?.is_enrolled && (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleEnrollCourse}
          sx={{ mb: 4 }}
        >
          Commencer le cours
        </Button>
      )}

      <Box display="grid" gridTemplateColumns="8fr 4fr" gap={4}>
        <Box>
          {isLoadingLesson ? (
            <Skeleton height={400} variant="rectangular" />
          ) : currentLesson ? (
            <Box>
              <Typography variant="h5" sx={{ mb: 2 }}>{currentLesson.title}</Typography>
              {currentLesson.type === 'video' && currentLesson.video_url ? (
                <Box sx={{ mt: 2 }}>
                  {/* Vidéo avec gestion du verrouillage et progression */}
                  <Box sx={{ mb: 3, position: 'relative' }}>
                    {/* Vérifier si la leçon est verrouillée */}
                    {(currentLesson as any).isLocked ? (
                      <Box 
                        sx={{ 
                          position: 'relative',
                          height: 400,
                          backgroundColor: 'grey.900',
                          borderRadius: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}
                      >
                        <LockIcon sx={{ fontSize: 60, mb: 2, opacity: 0.7 }} />
                        <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                          🔒 Leçon verrouillée
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, textAlign: 'center', maxWidth: 300 }}>
                          Complétez la leçon précédente pour débloquer cette vidéo
                        </Typography>
                        
                        {/* Aperçu flou de la vidéo (optionnel) */}
                        <Box 
                          sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            filter: 'blur(10px)',
                            opacity: 0.3,
                            zIndex: -1,
                            borderRadius: 2,
                            overflow: 'hidden'
                          }}
                        >
                          <VideoPlayer 
                            videoUrl={currentLesson.video_url}
                            type={currentLesson.video_url.includes('youtube.com') || currentLesson.video_url.includes('youtu.be') ? 'youtube' : 'local'}
                            onPlay={() => {}}
                            onPause={() => {}}
                            onEnd={() => {}}
                          />
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        {/* Indicateur de progression si la leçon est en cours */}
                        {(currentLesson as any).completion_percentage > 0 && (currentLesson as any).completion_percentage < 100 && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <PlayCircleIcon sx={{ color: 'primary.main', mr: 1 }} />
                              <Typography variant="body2" color="primary.main" fontWeight="medium">
                                Progression: {Math.round((currentLesson as any).completion_percentage)}%
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={(currentLesson as any).completion_percentage} 
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        )}
                        
                        {/* Badge de statut */}
                        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                          {(currentLesson as any).is_completed ? (
                            <Chip 
                              icon={<CheckCircleIcon />} 
                              label="Complétée" 
                              color="success" 
                              size="small"
                              sx={{ backgroundColor: 'success.main', color: 'white' }}
                            />
                          ) : (currentLesson as any).completion_percentage > 0 ? (
                            <Chip 
                              icon={<PlayCircleIcon />} 
                              label="En cours" 
                              color="primary" 
                              size="small"
                            />
                          ) : (
                            <Chip 
                              icon={<PlayCircleIcon />} 
                              label="Nouveau" 
                              color="default" 
                              size="small"
                            />
                          )}
                        </Box>
                        
                        {/* Lecteur vidéo avec contrôle de progression */}
                        <VideoPlayer 
                          videoUrl={currentLesson.video_url}
                          type={currentLesson.video_url.includes('youtube.com') || currentLesson.video_url.includes('youtu.be') ? 'youtube' : 'local'}
                          currentProgress={(currentLesson as any).completion_percentage || 0}
                          restrictSeek={true}
                          showRemainingTime={true}
                          onPlay={() => console.log('Video playing')}
                          onPause={() => console.log('Video paused')}
                          onProgressUpdate={(progress) => {
                            console.log('Progression mise à jour:', progress);
                            // TODO: Appeler l'API pour sauvegarder la progression en temps réel
                            // updateLessonProgress(currentLesson.id, progress);
                          }}
                          onEnd={() => {
                            console.log('Video ended');
                            // Marquer la leçon comme complétée quand la vidéo se termine
                            // TODO: Appeler l'API pour mettre à jour la progression à 100%
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                  
                  {/* Contenu de la leçon */}
                  {currentLesson.content && (
                    <Paper sx={{ p: 3, mt: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                        📚 Contenu de la leçon
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Box 
                        sx={{ 
                          '& h1': { fontSize: '1.5rem', fontWeight: 'bold', mb: 2, color: 'primary.main' },
                          '& h2': { fontSize: '1.3rem', fontWeight: 'bold', mb: 2, color: 'primary.main' },
                          '& h3': { fontSize: '1.1rem', fontWeight: 'bold', mb: 1.5, color: 'primary.main' },
                          '& p': { mb: 2, lineHeight: 1.6 },
                          '& ul, & ol': { mb: 2, pl: 3 },
                          '& li': { mb: 0.5 },
                          '& code': { 
                            backgroundColor: 'grey.100', 
                            padding: '2px 6px', 
                            borderRadius: 1,
                            fontFamily: 'monospace'
                          },
                          '& pre': {
                            backgroundColor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                            mb: 2
                          },
                          '& blockquote': {
                            borderLeft: '4px solid',
                            borderColor: 'primary.main',
                            pl: 2,
                            ml: 0,
                            fontStyle: 'italic',
                            backgroundColor: 'grey.50',
                            p: 2,
                            mb: 2
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                      />
                    </Paper>
                  )}
                </Box>
              ) : currentLesson.content ? (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                    📚 Contenu de la leçon
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Box 
                    sx={{ 
                      '& h1': { fontSize: '1.5rem', fontWeight: 'bold', mb: 2, color: 'primary.main' },
                      '& h2': { fontSize: '1.3rem', fontWeight: 'bold', mb: 2, color: 'primary.main' },
                      '& h3': { fontSize: '1.1rem', fontWeight: 'bold', mb: 1.5, color: 'primary.main' },
                      '& p': { mb: 2, lineHeight: 1.6 },
                      '& ul, & ol': { mb: 2, pl: 3 },
                      '& li': { mb: 0.5 },
                      '& code': { 
                        backgroundColor: 'grey.100', 
                        padding: '2px 6px', 
                        borderRadius: 1,
                        fontFamily: 'monospace'
                      },
                      '& pre': {
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        mb: 2
                      },
                      '& blockquote': {
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: 2,
                        ml: 0,
                        fontStyle: 'italic',
                        backgroundColor: 'grey.50',
                        p: 2,
                        mb: 2
                      }
                    }}
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                  />
                </Paper>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Aucun contenu disponible pour cette leçon.
                </Typography>
              )}
              <Button onClick={() => handleLessonComplete(currentLesson.id)}>
                Marquer comme terminé
              </Button>
            </Box>
          ) : (
            <Alert severity="info">Sélectionnez une leçon</Alert>
          )}
        </Box>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Book fontSize="small" sx={{ mr: 1 }} /> Contenu du cours
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {modules.map((module) => (
            <Box key={module.id}>
              <Typography variant="subtitle1" fontWeight="bold">{module.title}</Typography>
              <LessonsList
                lessons={module.lessons.map((lesson) => {
                  const lessonData = lesson as any;
                  const isCompleted = lessonData.isCompleted ?? false;
                  const progress = lessonData.progress;
                  
                  return {
                    ...lesson,
                    id: String(lesson.id), // Ensure ID is string
                    duration: lesson.duration ? String(lesson.duration) : '0',
                    is_completed: isCompleted, // Mapper depuis isCompleted du backend
                    completion_percentage: progress || (isCompleted ? 100 : 0), // Progression réelle
                    isLocked: lessonData.isLocked ?? false,
                    isCurrent: lesson.id === currentLesson?.id,
                    type: lessonData.type || 'text'
                  };
                })}
                courseTitle={courseData.title}
                courseProgress={courseData.progress ?? 0}
                currentLessonId={currentLesson?.id ? String(currentLesson.id) : undefined}
                onSelectLesson={(id) => navigate(`/etudiant/cours/${courseId}/lecons/${id}`)}
              />
            </Box>
          ))}
        </Paper>
      </Box>
    </Container>
  );
};

export default CourseViewPage;