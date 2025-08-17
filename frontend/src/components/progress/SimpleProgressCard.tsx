import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  LinearProgress, 
  Button,
  Avatar,
  Chip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description?: string;
  progress?: number;
  imageUrl?: string;
  instructor?: {
    name: string;
  };
  lessonsCount?: number;
  completedLessons?: number;
}

interface SimpleProgressCardProps {
  course: Course;
}

export const SimpleProgressCard: React.FC<SimpleProgressCardProps> = ({ course }) => {
  const navigate = useNavigate();
  const progress = course.progress ?? 0;
  const isCompleted = progress >= 100;
  const isStarted = progress > 0;

  const getProgressMessage = (progress: number): string => {
    if (progress === 0) return "Prêt à commencer votre apprentissage";
    if (progress < 25) return "Excellent début ! Continuez sur cette lancée";
    if (progress < 50) return "Vous progressez bien ! Gardez le rythme";
    if (progress < 75) return "Formidable progression ! Vous y êtes presque";
    if (progress < 100) return "Dernière ligne droite ! Vous touchez au but";
    return "Félicitations ! Cours terminé avec succès";
  };

  const handleContinue = () => {
    navigate(`/etudiant/cours/${course.id}`);
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" gap={3}>
          {/* Image du cours */}
          <Box
            component="img"
            src={course.imageUrl ?? '/images/course-placeholder.jpg'}
            alt={course.title}
            sx={{
              width: 120,
              height: 80,
              borderRadius: 2,
              objectFit: 'cover',
              flexShrink: 0
            }}
          />
          
          {/* Contenu principal */}
          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                {course.title}
              </Typography>
              
              {isCompleted ? (
                <Chip 
                  icon={<CheckIcon />}
                  label="Terminé"
                  color="success"
                  size="small"
                />
              ) : isStarted ? (
                <Chip 
                  icon={<SchoolIcon />}
                  label={`${progress}%`}
                  color="primary"
                  size="small"
                />
              ) : (
                <Chip 
                  label="Nouveau"
                  color="default"
                  size="small"
                />
              )}
            </Box>

            {course.instructor && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Par {course.instructor.name}
              </Typography>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {getProgressMessage(progress)}
            </Typography>

            {/* Barre de progression */}
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Progression
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {course.completedLessons ?? 0}/{course.lessonsCount ?? 0} leçons
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: isCompleted ? 'success.main' : 'primary.main'
                  }
                }}
              />
            </Box>

            {/* Bouton d'action */}
            <Button
              variant={isCompleted ? "outlined" : "contained"}
              startIcon={isCompleted ? <CheckIcon /> : <PlayIcon />}
              onClick={handleContinue}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'medium'
              }}
            >
              {isCompleted ? 'Revoir le cours' : isStarted ? 'Continuer' : 'Commencer'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
