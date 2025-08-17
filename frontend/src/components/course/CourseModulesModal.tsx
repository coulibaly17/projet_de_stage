import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  OndemandVideo as OndemandVideoIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  Book as BookIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { courseService, type CourseWithModules, type Module, type Lesson } from '@/services/course.service';
import { toast } from 'react-toastify';

interface CourseModulesModalProps {
  open: boolean;
  onClose: () => void;
  courseId: number;
  courseTitle: string;
}

const CourseModulesModal: React.FC<CourseModulesModalProps> = ({
  open,
  onClose,
  courseId,
  courseTitle
}) => {
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && courseId) {
      fetchCourseModules();
    }
  }, [open, courseId]);

  const fetchCourseModules = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`🔍 Récupération des modules pour le cours ${courseId}`);
      const courseData = await courseService.getCourseWithModules(courseId);
      console.log('📚 Données du cours avec modules:', courseData);
      setCourse(courseData);
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des modules:', err);
      setError('Impossible de charger les modules du cours');
      toast.error('Erreur lors du chargement des modules');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (lesson: Lesson) => {
    switch (lesson.type) {
      case 'video':
        return <OndemandVideoIcon color="primary" />;
      case 'assignment':
        return <AssignmentIcon color="secondary" />;
      case 'quiz':
        return <QuizIcon color="warning" />;
      default:
        return <BookIcon color="action" />;
    }
  };

  const getTypeLabel = (lesson: Lesson) => {
    switch (lesson.type) {
      case 'video':
        return 'Vidéo';
      case 'assignment':
        return 'Devoir';
      case 'quiz':
        return 'Quiz';
      default:
        return 'Lecture';
    }
  };

  const formatDuration = (duration: number) => {
    if (duration < 60) {
      return `${duration} min`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes > 0 ? `${minutes}min` : ''}`;
  };

  const handleLessonClick = (lesson: Lesson) => {
    console.log('🎯 Clic sur la leçon:', lesson);
    if (lesson.video_url) {
      window.open(lesson.video_url, '_blank');
      toast.info(`Ouverture de la vidéo: ${lesson.title}`);
    } else {
      toast.info(`Accès au contenu: ${lesson.title}`);
      // Ici vous pouvez ajouter la navigation vers la page de la leçon
    }
  };

  const getTotalLessons = (modules: Module[]) => {
    return modules.reduce((total, module) => total + module.lessons.length, 0);
  };

  const getTotalDuration = (modules: Module[]) => {
    return modules.reduce((total, module) => 
      total + module.lessons.reduce((moduleTotal, lesson) => moduleTotal + lesson.duration, 0), 0
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" component="div">
            Modules et Leçons
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {courseTitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Chargement des modules...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {course && !loading && (
          <Box>
            {/* Statistiques du cours */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                📊 Aperçu du cours
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<BookIcon />} 
                  label={`${course.modules.length} modules`} 
                  variant="outlined" 
                />
                <Chip 
                  icon={<PlayCircleOutlineIcon />} 
                  label={`${getTotalLessons(course.modules)} leçons`} 
                  variant="outlined" 
                />
                <Chip 
                  icon={<AccessTimeIcon />} 
                  label={formatDuration(getTotalDuration(course.modules))} 
                  variant="outlined" 
                />
              </Box>
            </Box>

            {/* Liste des modules */}
            {course.modules.length === 0 ? (
              <Alert severity="info">
                Aucun module trouvé pour ce cours.
              </Alert>
            ) : (
              course.modules.map((module, moduleIndex) => (
                <Accordion key={module.id} defaultExpanded={moduleIndex === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        📚 {module.title}
                      </Typography>
                      <Chip 
                        label={`${module.lessons.length} leçons`} 
                        size="small" 
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {module.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {module.description}
                      </Typography>
                    )}
                    
                    {module.lessons.length === 0 ? (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        Aucune leçon dans ce module.
                      </Alert>
                    ) : (
                      <List dense>
                        {module.lessons
                          .sort((a, b) => a.order - b.order)
                          .map((lesson, lessonIndex) => (
                            <React.Fragment key={lesson.id}>
                              <ListItem
                                component="div"
                                onClick={() => handleLessonClick(lesson)}
                                sx={{
                                  borderRadius: 1,
                                  mb: 1,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: 'action.hover',
                                  },
                                }}
                              >
                                <ListItemIcon>
                                  {getTypeIcon(lesson)}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body1">
                                        {lesson.title}
                                      </Typography>
                                      <Chip 
                                        label={getTypeLabel(lesson)} 
                                        size="small" 
                                        variant="outlined"
                                      />
                                      {lesson.duration > 0 && (
                                        <Chip 
                                          icon={<AccessTimeIcon />}
                                          label={formatDuration(lesson.duration)} 
                                          size="small" 
                                          variant="outlined"
                                        />
                                      )}
                                    </Box>
                                  }
                                  secondary={lesson.description}
                                />
                                {lesson.video_url && (
                                  <Tooltip title="Ouvrir la vidéo">
                                    <IconButton size="small" color="primary">
                                      <PlayCircleOutlineIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </ListItem>
                              {lessonIndex < module.lessons.length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                      </List>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Fermer
        </Button>
        {course && (
          <Button 
            variant="contained" 
            onClick={() => {
              // Navigation vers la page complète du cours
              window.open(`/enseignant/cours/${courseId}`, '_blank');
            }}
          >
            Voir le cours complet
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CourseModulesModal;
