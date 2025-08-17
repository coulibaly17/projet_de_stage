import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, LinearProgress, Tooltip, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formatTime } from '../../utils/timeUtils';

// Animation de pulsation pour les dernières secondes
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const TimerContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'warning' && prop !== 'danger',
})<{ warning?: boolean; danger?: boolean }>(({ theme, warning, danger }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  minWidth: '120px',
  transition: 'all 0.3s ease',
  ...(danger && {
    animation: `${pulse} 1s infinite`,
    color: theme.palette.error.main,
  }),
  ...(warning && {
    color: theme.palette.warning.main,
  }),
}));

const TimeText = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'warning' && prop !== 'danger',
})<{ warning?: boolean; danger?: boolean }>(({ theme, warning, danger }) => ({
  display: 'flex',
  alignItems: 'center',
  fontWeight: 600,
  fontSize: '1.25rem',
  lineHeight: 1,
  ...(danger && {
    color: theme.palette.error.main,
  }),
  ...(warning && {
    color: theme.palette.warning.main,
  }),
}));

const TimeLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginTop: theme.spacing(0.5),
  textAlign: 'right',
}));

const ProgressBar = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'warning' && prop !== 'danger',
})<{ warning?: boolean; danger?: boolean }>(({ theme, warning, danger }) => ({
  height: 4,
  width: '100%',
  marginTop: theme.spacing(1),
  borderRadius: 2,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    transition: 'transform 1s linear',
    ...(danger && {
      backgroundColor: theme.palette.error.main,
    }),
    ...(warning && {
      backgroundColor: theme.palette.warning.main,
    }),
  },
}));

interface QuizTimerProps {
  timeRemaining: number; // en secondes
  totalTime: number; // en secondes
  onTimeUp?: () => void;
  warningThreshold?: number; // pourcentage avant d'afficher l'avertissement
  dangerThreshold?: number; // pourcentage avant le mode urgence
  showProgressBar?: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const QuizTimer: React.FC<QuizTimerProps> = ({
  timeRemaining,
  totalTime,
  onTimeUp,
  warningThreshold = 30,
  dangerThreshold = 10,
  showProgressBar = true,
  showLabel = true,
  size = 'medium',
}) => {
  const [timeLeft, setTimeLeft] = useState(timeRemaining);
  const [isRunning, setIsRunning] = useState(true);
  
  // Mise à jour du temps restant
  useEffect(() => {
    setTimeLeft(timeRemaining);
  }, [timeRemaining]);
  
  // Gestion du minuteur
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && onTimeUp) {
        onTimeUp();
      }
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, isRunning, onTimeUp]);
  
  // Formatage du temps
  const formattedTime = formatTime(timeLeft);
  
  // Calcul du pourcentage de temps restant
  const progress = Math.max(0, (timeLeft / totalTime) * 100);
  
  // Déterminer l'état d'avertissement
  const isWarning = progress <= warningThreshold && progress > dangerThreshold;
  const isDanger = progress <= dangerThreshold && timeLeft > 0;
  const isTimeUp = timeLeft <= 0;
  
  // Mettre en pause/reprendre le minuteur
  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);
  
  // Obtenir le message d'état du minuteur
  const getStatusMessage = useCallback(() => {
    if (isTimeUp) return 'Temps écoulé !';
    if (isDanger) return 'Presque terminé !';
    if (isWarning) return 'Plus que quelques instants...';
    return 'Temps restant';
  }, [isTimeUp, isDanger, isWarning]);
  
  // Styles en fonction de la taille
  const sizeStyles = {
    small: {
      iconSize: '1rem',
      textVariant: 'body2' as const,
      labelVariant: 'caption' as const,
    },
    medium: {
      iconSize: '1.25rem',
      textVariant: 'body1' as const,
      labelVariant: 'caption' as const,
    },
    large: {
      iconSize: '1.5rem',
      textVariant: 'h6' as const,
      labelVariant: 'body2' as const,
    },
  };
  
  const { iconSize, textVariant, labelVariant } = sizeStyles[size];
  
  return (
    <Tooltip 
      title={isRunning ? 'Mettre en pause' : 'Reprendre'}
      placement="top"
      arrow
    >
      <TimerContainer 
        onClick={toggleTimer}
        warning={isWarning}
        danger={isDanger}
        sx={{ cursor: 'pointer' }}
      >
        <TimeText 
          variant={textVariant}
          warning={isWarning}
          danger={isDanger}
        >
          <AccessTimeIcon 
            sx={{ 
              fontSize: iconSize, 
              mr: 0.5,
              ...(isRunning && { animation: 'pulse 2s infinite' }),
            }} 
          />
          {formattedTime}
        </TimeText>
        
        {showLabel && (
          <TimeLabel variant={labelVariant}>
            {getStatusMessage()}
          </TimeLabel>
        )}
        
        {showProgressBar && (
          <ProgressBar 
            variant="determinate" 
            value={progress}
            warning={isWarning}
            danger={isDanger}
          />
        )}
      </TimerContainer>
    </Tooltip>
  );
};

export default QuizTimer;
