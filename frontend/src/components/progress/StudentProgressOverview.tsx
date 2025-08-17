import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  LinearProgress, 
  Grid, 
  Avatar, 
  Chip,
  Button,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Interface pour les données de progression simplifiées
interface ProgressOverviewData {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalTimeSpent: number; // en minutes
  averageProgress: number;
  currentStreak: number;
  nextCourse?: {
    id: string;
    title: string;
    progress: number;
    nextLesson: string;
  };
}

interface StudentProgressOverviewProps {
  userId?: string;
}

export const StudentProgressOverview: React.FC<StudentProgressOverviewProps> = ({ userId }) => {
  const [progressData, setProgressData] = useState<ProgressOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simuler le chargement des données de progression
    // En production, ceci ferait appel à l'API
    const loadProgressData = async () => {
      try {
        setLoading(true);
        
        // Simulation de données - à remplacer par un vrai appel API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData: ProgressOverviewData = {
          totalCourses: 5,
          completedCourses: 2,
          inProgressCourses: 2,
          totalTimeSpent: 1250, // 20h 50min
          averageProgress: 65,
          currentStreak: 7,
          nextCourse: {
            id: '1',
            title: 'Introduction à React',
            progress: 45,
            nextLesson: 'Les Hooks useState et useEffect'
          }
        };
        
        setProgressData(mockData);
      } catch (error) {
        console.error('Erreur lors du chargement des données de progression:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgressData();
  }, [userId]);

  const formatTimeSpent = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes}min`;
    }
    
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getMotivationMessage = (progress: number, streak: number): string => {
    if (progress < 25) {
      return `🚀 Excellent début ! ${streak} jours consécutifs !`;
    } else if (progress < 50) {
      return `💪 Vous progressez bien ! Série de ${streak} jours !`;
    } else if (progress < 75) {
      return `🎯 Formidable progression ! ${streak} jours d'affilée !`;
    } else {
      return `🏆 Presque expert ! ${streak} jours de suite !`;
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <TrendingUpIcon />
            </Avatar>
            <Typography variant="h6">Votre progression</Typography>
          </Box>
          <LinearProgress sx={{ mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Chargement de vos données de progression...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return null;
  }

  return (
    <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardContent>
        {/* En-tête avec message de motivation */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
            <TrendingUpIcon />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              Votre progression
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {getMotivationMessage(progressData.averageProgress, progressData.currentStreak)}
            </Typography>
          </Box>
          <Chip 
            icon={<TrophyIcon />}
            label={`${progressData.averageProgress}%`}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        {/* Barre de progression générale */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Progression générale
            </Typography>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
              {progressData.completedCourses}/{progressData.totalCourses} cours terminés
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressData.averageProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'white',
                borderRadius: 4,
              }
            }}
          />
        </Box>

        {/* Statistiques en grille */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={4}>
            <Box textAlign="center">
              <SchoolIcon sx={{ fontSize: 24, mb: 0.5, color: 'rgba(255,255,255,0.9)' }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                {progressData.inProgressCourses}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                En cours
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <AccessTimeIcon sx={{ fontSize: 24, mb: 0.5, color: 'rgba(255,255,255,0.9)' }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                {formatTimeSpent(progressData.totalTimeSpent)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Temps d'étude
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box textAlign="center">
              <CheckCircleIcon sx={{ fontSize: 24, mb: 0.5, color: 'rgba(255,255,255,0.9)' }} />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                {progressData.completedCourses}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Terminés
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Prochaine étape */}
        {progressData.nextCourse && (
          <>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 2 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                🎯 Prochaine étape
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box flex={1}>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                    {progressData.nextCourse.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {progressData.nextCourse.nextLesson}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {progressData.nextCourse.progress}%
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => navigate(`/etudiant/cours/${progressData.nextCourse?.id}`)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)',
                  },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
                fullWidth
              >
                Continuer le cours
              </Button>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};
