import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  Paper, 
  LinearProgress, 
  Alert, 
  Container,
  Fade,
  Stepper,
  Step,
  StepLabel,
  Divider,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useQuiz, type UseQuizOptions } from '../../hooks/useQuiz';
import QuizQuestion from './QuizQuestion';
import QuizResults from './QuizResults';
import QuizNavigation from './QuizNavigation';
import QuizTimer from './QuizTimer';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, HelpCircle, AlertTriangle } from 'lucide-react';

interface QuizProps extends Omit<UseQuizOptions, 'quizId'> {
  onComplete?: (result: any) => void;
  showNavigation?: boolean;
  showTimer?: boolean;
  showProgress?: boolean;
  showResults?: boolean;
  autoStart?: boolean;
}

const QuizContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[3],
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const QuizHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(2),
    alignItems: 'flex-start',
  },
}));

const QuizTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.primary.main,
  margin: 0,
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: '40px',
    height: '3px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px',
  },
}));

const QuizContent = styled(Box)(({ theme }) => ({
  minHeight: '350px',
  position: 'relative',
  padding: theme.spacing(3, 0),
  transition: 'all 0.3s ease',
}));

const QuizFooter = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(4),
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
}));

const ProgressBar = styled(LinearProgress)(() => ({
  height: 10,
  borderRadius: 5,
  '& .MuiLinearProgress-bar': {
    borderRadius: 5,
  },
}));

const BackButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  left: -12,
  top: -12,
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

const NavigationButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: theme.shadows[2],
  },
}));

const Quiz: React.FC<QuizProps> = ({
  onComplete,
  showNavigation = true,
  showTimer = true,
  showProgress = true,
  showResults = true,
  autoStart = true,
  ...options
}) => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // État pour les animations
  const [fadeIn, setFadeIn] = useState(false);
  const [showHelpTip, setShowHelpTip] = useState(false);
  
  const {
    // États
    quiz,
    loading,
    error,
    currentQuestion,
    currentQuestionIndex,
    userAnswers,
    result,
    timeRemaining,
    submitting,
    // Valeurs non utilisées mais disponibles si nécessaire
    // quizHistory,
    // loadingHistory,
    
    // Valeurs calculées
    totalQuestions,
    progress,
    isLastQuestion,
    hasAnsweredCurrent,
    
    // Méthodes
    loadQuiz,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    saveAnswer,
    submit,
    reset,
    loadQuizHistory
  } = useQuiz({
    ...options,
    quizId: quizId || '',
    onComplete: (result) => {
      onComplete?.(result);
    },
    onError: (error) => {
      console.error('Quiz error:', error);
    },
  });

  // Chargement automatique du quiz
  useEffect(() => {
    if (autoStart && quizId) {
      loadQuiz(quizId);
      if (user) {
        loadQuizHistory();
      }
    }
  }, [autoStart, quizId, loadQuiz, loadQuizHistory, user]);

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: `/quiz/${quizId}` } });
    }
  }, [user, navigate, quizId]);
  
  // Animation d'entrée
  useEffect(() => {
    if (!loading && quiz) {
      const timer = setTimeout(() => {
        setFadeIn(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading, quiz]);
  
  // Afficher l'astuce d'aide après un délai
  useEffect(() => {
    if (!loading && quiz && !result) {
      const timer = setTimeout(() => {
        setShowHelpTip(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, quiz, result]);
  
  // Fonction pour retourner à la liste des quiz
  const handleBackToList = () => {
    navigate('/quizzes');
  };

  // Gestion de la soumission du formulaire
  const handleSubmit = async () => {
    try {
      await submit();
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  // Affichage du chargement
  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, fontWeight: 500 }}>
            Chargement du quiz...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Préparation des questions et des réponses
          </Typography>
        </Box>
      </Container>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <Container maxWidth="md">
        <Alert 
          severity="error" 
          sx={{ 
            my: 4, 
            py: 2,
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              fontSize: '2rem'
            }
          }}
          icon={<AlertTriangle size={28} />}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Erreur de chargement
            </Typography>
            <Typography variant="body1">
              Une erreur est survenue lors du chargement du quiz: {error.message}
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={handleBackToList}
            >
              Retour aux quiz
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  // Vérification du quiz chargé
  if (!quiz) {
    return (
      <Container maxWidth="md">
        <Alert severity="info" sx={{ my: 4, py: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Quiz non disponible
          </Typography>
          <Typography variant="body1">
            Aucun quiz n'a été chargé. Veuillez sélectionner un quiz dans la liste.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={handleBackToList}
          >
            Voir les quiz disponibles
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Fade in={fadeIn} timeout={800}>
        <Box>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Retour aux quiz">
              <BackButton onClick={handleBackToList}>
                <ArrowLeft size={24} />
              </BackButton>
            </Tooltip>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
              {quiz.courseId ? (
                <>
                  Cours: <Link to={`/courses/${quiz.courseId}`} style={{ color: 'inherit', fontWeight: 500 }}>{quiz.courseId}</Link>
                </>
              ) : 'Quiz indépendant'}
            </Typography>
          </Box>
          
          <QuizContainer elevation={3}>
            {/* En-tête du quiz */}
            <QuizHeader>
              <Box sx={{ position: 'relative', width: '100%' }}>
                <Box component="h1" sx={{ m: 0 }}>
                  <QuizTitle variant="h4">
                    {quiz.title}
                  </QuizTitle>
                </Box>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 2, maxWidth: '90%' }}>
                  {quiz.description}
                </Typography>
                
                {showHelpTip && !result && (
                  <Tooltip title="Répondez à toutes les questions pour terminer le quiz. Vous pouvez naviguer entre les questions à tout moment.">
                    <IconButton 
                      sx={{ 
                        position: 'absolute', 
                        right: 0, 
                        top: 0,
                        color: theme.palette.info.main 
                      }}
                    >
                      <HelpCircle size={20} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              
              {showTimer && timeRemaining !== null && (
                <Box sx={{ mt: isMobile ? 2 : 0 }}>
                  <QuizTimer 
                    timeRemaining={timeRemaining} 
                    totalTime={quiz.settings?.timeLimit || 600} 
                    onTimeUp={handleSubmit}
                  />
                </Box>
              )}
            </QuizHeader>

            <Divider sx={{ my: 3 }} />

            {/* Barre de progression */}
            {showProgress && !result && (
              <Box mb={4}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Question {currentQuestionIndex + 1} sur {totalQuestions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {Math.round(progress)}% complété
                  </Typography>
                </Box>
                <ProgressBar 
                  variant="determinate" 
                  value={progress} 
                  color="primary"
                />
                
                {totalQuestions > 3 && !isMobile && (
                  <Stepper 
                    activeStep={currentQuestionIndex} 
                    alternativeLabel 
                    sx={{ mt: 3, display: { xs: 'none', md: 'flex' } }}
                  >
                    {Array.from({ length: totalQuestions }).map((_, index) => (
                      <Step key={index} completed={Boolean(userAnswers[quiz.questions[index]?.id])}>
                        <StepLabel></StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                )}
              </Box>
            )}

            {/* Contenu du quiz */}
            <QuizContent>
              <Fade in={true} timeout={500}>
                <Box>
                  {result && showResults ? (
                    <QuizResults 
                      result={result} 
                      quiz={quiz} 
                      onRetry={quiz.settings.allowRetries ? reset : undefined}
                    />
                  ) : (
                    <>
                      {currentQuestion && (
                        <QuizQuestion
                          question={currentQuestion}
                          value={userAnswers[currentQuestion.id]}
                          onChange={(value) => saveAnswer(currentQuestion.id, value)}
                          questionNumber={currentQuestionIndex + 1}
                          totalQuestions={totalQuestions}
                        />
                      )}
                    </>
                  )}
                </Box>
              </Fade>
            </QuizContent>

            {/* Navigation */}
            {!result && (
              <QuizFooter>
                <NavigationButton
                  variant="outlined"
                  onClick={goToPreviousQuestion}
                  disabled={currentQuestionIndex === 0 || submitting}
                  startIcon={<ArrowLeft size={18} />}
                >
                  Précédent
                </NavigationButton>

                {showNavigation && totalQuestions > 1 && (
                  <QuizNavigation
                    totalQuestions={totalQuestions}
                    currentIndex={currentQuestionIndex}
                    answeredQuestions={Object.keys(userAnswers).length}
                    onNavigate={goToQuestion}
                  />
                )}

                {isLastQuestion ? (
                  <NavigationButton
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!hasAnsweredCurrent || submitting}
                  >
                    {submitting ? 'Soumission...' : 'Terminer le quiz'}
                  </NavigationButton>
                ) : (
                  <NavigationButton
                    variant="contained"
                    color="primary"
                    onClick={goToNextQuestion}
                    disabled={!hasAnsweredCurrent || submitting}
                  >
                    Suivant
                  </NavigationButton>
                )}
              </QuizFooter>
            )}
          </QuizContainer>
        </Box>
      </Fade>
    </Container>
  );
};

export default Quiz;
