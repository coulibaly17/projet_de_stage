import React from 'react';
import { Box, Button, Tooltip, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const NavigationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  justifyContent: 'center',
  maxWidth: '100%',
  margin: '0 auto',
  padding: theme.spacing(1),
}));

const QuestionButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'current' && prop !== 'answered',
})<{ current?: boolean; answered?: boolean }>(({ theme, current, answered }) => ({
  minWidth: '40px',
  minHeight: '40px',
  padding: 0,
  borderRadius: '50%',
  border: `1px solid ${current ? theme.palette.primary.main : theme.palette.divider}`,
  backgroundColor: current 
    ? theme.palette.primary.main + '1a' // 10% opacity
    : answered 
      ? theme.palette.success.main + '1a'
      : 'transparent',
  color: current 
    ? theme.palette.primary.main 
    : answered 
      ? theme.palette.success.dark
      : theme.palette.text.secondary,
  fontWeight: current ? 'bold' : 'normal',
  '&:hover': {
    backgroundColor: current 
      ? theme.palette.primary.main + '33' // 20% opacity
      : theme.palette.action.hover,
  },
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.2s ease-in-out',
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
}));

const QuestionStatusIndicator = styled('span', {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: 'answered' | 'current' | 'unanswered' }>(({ theme, status }) => ({
  position: 'absolute',
  top: -4,
  right: -4,
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: 
    status === 'answered' 
      ? theme.palette.success.main 
      : status === 'current' 
        ? theme.palette.primary.main 
        : theme.palette.grey[400],
  border: `2px solid ${theme.palette.background.paper}`,
}));

interface QuizNavigationProps {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestions: number;
  onNavigate: (index: number) => void;
  questionStatuses?: {
    [key: number]: 'correct' | 'incorrect' | 'unanswered';
  };
  showTooltips?: boolean;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({
  totalQuestions,
  currentIndex,
  answeredQuestions,
  onNavigate,
  questionStatuses = {},
  showTooltips = true,
}) => {
  const theme = useTheme();
  
  // Créer un tableau de 1 à totalQuestions
  const questionNumbers = Array.from({ length: totalQuestions }, (_, i) => i);

  const getQuestionStatus = (index: number) => {
    if (index === currentIndex) return 'current';
    return index < answeredQuestions ? 'answered' : 'unanswered';
  };

  const getQuestionIcon = (index: number) => {
    const status = questionStatuses[index];
    
    if (status === 'correct') {
      return <CheckCircleIcon color="success" />;
    } else if (status === 'incorrect') {
      return <RadioButtonUncheckedIcon color="error" />;
    } else if (index < answeredQuestions) {
      return <RadioButtonUncheckedIcon color="action" />;
    } else {
      return <HelpOutlineIcon color="disabled" />;
    }
  };

  const getTooltipTitle = (index: number) => {
    if (!showTooltips) return '';
    
    const status = questionStatuses[index];
    
    if (status === 'correct') return 'Réponse correcte';
    if (status === 'incorrect') return 'Réponse incorrecte';
    if (index < answeredQuestions) return 'Répondu';
    if (index === currentIndex) return 'Question actuelle';
    return 'Non répondu';
  };

  // Grouper les questions par pages pour les grands quiz
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalQuestions / itemsPerPage);
  const currentPage = Math.floor(currentIndex / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalQuestions);
  
  // Si moins de 2 pages, tout afficher
  const showPagination = totalPages > 1;
  const visibleQuestions = showPagination 
    ? questionNumbers.slice(startIndex, endIndex)
    : questionNumbers;

  return (
    <Box>
      <NavigationContainer>
        {visibleQuestions.map((index) => {
          const questionNumber = index + 1;
          const status = getQuestionStatus(index);
          
          return (
            <Tooltip 
              key={index} 
              title={getTooltipTitle(index)}
              arrow
              placement="top"
            >
              <QuestionButton
                variant="outlined"
                size="small"
                current={index === currentIndex}
                answered={index < answeredQuestions}
                onClick={() => onNavigate(index)}
                aria-label={`Question ${questionNumber}`}
                aria-current={index === currentIndex ? 'step' : undefined}
              >
                {getQuestionIcon(index)}
                {questionNumber}
                <QuestionStatusIndicator status={status} />
              </QuestionButton>
            </Tooltip>
          );
        })}
      </NavigationContainer>
      
      {showPagination && (
        <Box display="flex" justifyContent="center" mt={2} gap={1}>
          {Array.from({ length: totalPages }, (_, i) => (
            <Button
              key={i}
              size="small"
              variant={i === currentPage ? 'contained' : 'outlined'}
              onClick={() => onNavigate(i * itemsPerPage)}
              sx={{ minWidth: '32px' }}
            >
              {i + 1}
            </Button>
          ))}
        </Box>
      )}
      
      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Box display="flex" alignItems="center" gap={1}>
          <Box 
            sx={{
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              bgcolor: theme.palette.success.main,
              border: `1px solid ${theme.palette.divider}`
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            Répondu
          </Typography>
          
          <Box 
            sx={{
              width: 12, 
              height: 12, 
              borderRadius: '50%', 
              bgcolor: 'transparent',
              border: `1px solid ${theme.palette.divider}`,
              ml: 1.5
            }} 
          />
          <Typography variant="caption" color="text.secondary">
            Non répondu
          </Typography>
        </Box>
        
        <Typography variant="caption" color="text.secondary">
          {answeredQuestions} / {totalQuestions} questions répondues
        </Typography>
      </Box>
    </Box>
  );
};

export default QuizNavigation;
