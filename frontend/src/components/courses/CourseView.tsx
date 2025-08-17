import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Snackbar } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lesson } from '../../types/api';
import VideoPlayer from './VideoPlayer';
import LessonsList from './LessonsList';
import { useCourse } from './useCourse';
import { useAuth } from '../../hooks/useAuth';
import { useProgress } from './useProgress';
import { Grid } from '@mui/material';
import { Course } from '../../types/api';
import { CourseProgress } from './useProgress';

// Types
interface CourseViewProps {
  courseId: string;
}

const StyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  minHeight: '100vh',
  background: theme.palette.background.default,
}));

const StyledContent = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  marginTop: theme.spacing(4),
  flexWrap: 'wrap',
}));

const StyledGridItem = styled(Box)(({ theme }) => ({
  width: '100%',
  [theme.breakpoints.up('md')]: {
    width: 'calc(50% - 16px)',
  },
}));

const CourseView: React.FC<CourseViewProps> = ({ courseId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { course, isLoading: isCourseLoading, error: courseError } = useCourse(courseId);
  const { progress, updateProgress, isLoading: isProgressLoading } = useProgress(courseId);

  // État local pour le suivi de la vidéo
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Gestion des notifications
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Effet pour charger la leçon sélectionnée
  useEffect(() => {
    if (progress?.currentLessonId && course?.lessons) {
      const lesson = course.lessons.find(l => l.id === progress.currentLessonId);
      if (lesson) {
        setSelectedLesson(lesson);
      }
    }
  }, [course?.lessons, progress?.currentLessonId]);

  // Sauvegarde automatique de la progression
  const saveProgress = useCallback(async () => {
    if (!selectedLesson || !user) return;

    const lessonDuration = typeof selectedLesson.duration === 'number' 
      ? selectedLesson.duration 
      : parseFloat(selectedLesson.duration);

    const completionPercentage = (currentVideoTime / lessonDuration) * 100;
    
    await updateProgress({
      currentLessonId: selectedLesson.id,
      progress: completionPercentage,
      lastWatchedTime: currentVideoTime,
      isCompleted: completionPercentage >= 100
    });

    // Notification de progression
    if (completionPercentage >= 100) {
      setNotificationMessage('Leçon terminée avec succès !');
      setNotificationOpen(true);
    }
  }, [currentVideoTime, selectedLesson, user, updateProgress]);

  // Sauvegarde automatique toutes les 30 secondes
  useEffect(() => {
    if (isVideoPlaying) {
      const timer = setInterval(saveProgress, 30000);
      return () => clearInterval(timer);
    }
  }, [isVideoPlaying, saveProgress]);

  // Gestion des erreurs
  useEffect(() => {
    if (courseError) {
      toast.error('Erreur lors du chargement du cours');
    }
  }, [courseError]);

  // Handler pour la sélection d'une leçon
  const handleLessonSelect = (lessonId: string | number) => {
    const lesson = course?.lessons.find(l => l.id === lessonId);
    if (lesson) {
      setSelectedLesson(lesson);
      setIsVideoPlaying(true);
    }
  };

  // Handler pour la mise à jour du temps de la vidéo
  const handleVideoTimeUpdate = (time: number) => {
    setCurrentVideoTime(time);
  };

  if (isCourseLoading || isProgressLoading) {
    return (
      <StyledContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </StyledContainer>
    );
  }

  if (!course) {
    return (
      <StyledContainer>
        <Typography variant="h5" align="center">
          Cours non trouvé
        </Typography>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <Typography variant="h4" component="h1" gutterBottom>
        {course.title}
      </Typography>

      <StyledContent>
        <StyledGridItem>
          <LessonsList
            lessons={course.lessons}
            courseTitle={course.title}
            courseProgress={progress?.progress || 0}
            onSelectLesson={handleLessonSelect}
            currentLessonId={progress?.currentLessonId}
          />
        </StyledGridItem>

        <StyledGridItem>
          {selectedLesson && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {selectedLesson.title}
              </Typography>
              
              <VideoPlayer
                videoUrl={selectedLesson.videoUrl || ''}
                type="youtube"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onTimeUpdate={handleVideoTimeUpdate}
                onEnd={saveProgress}
              />
            </Box>
          )}
        </StyledGridItem>
      </StyledContent>

      <Snackbar
        open={notificationOpen}
        autoHideDuration={3000}
        onClose={() => setNotificationOpen(false)}
      >
        <Alert severity="success" onClose={() => setNotificationOpen(false)}>
          {notificationMessage}
        </Alert>
      </Snackbar>
    </StyledContainer>
  );
};

export default CourseView;
