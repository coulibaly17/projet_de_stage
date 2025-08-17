import React from 'react';
import { Box, Typography, Button, Paper, LinearProgress, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { CheckCircle, Error, EmojiEvents, Replay } from '@mui/icons-material';
import type { Quiz, QuizResult } from '../../types/quiz';

const ResultContainer = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
}));

const ScoreContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 200,
  height: 200,
  margin: '0 auto',
  marginBottom: theme.spacing(4),
  '& .MuiCircularProgress-root': {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
}));

const ScoreText = styled(Box)(() => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 2,
  textAlign: 'center',
}));

const ScoreValue = styled(Typography)(({ theme }) => ({
  fontSize: '3rem',
  fontWeight: 'bold',
  lineHeight: 1,
  marginBottom: theme.spacing(1),
}));

const StatsContainer = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: theme.spacing(3),
  margin: theme.spacing(4, 0),
}));

const StatItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[2],
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  margin: theme.spacing(1, 0),
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.9rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}));

const QuestionList = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  textAlign: 'left',
  '& > *:not(:last-child)': {
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

const QuestionItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
}));

const QuestionStatus = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isCorrect',
})<{ isCorrect: boolean }>(({ theme, isCorrect }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: isCorrect ? theme.palette.success.main : theme.palette.error.main,
  color: theme.palette.common.white,
  marginTop: theme.spacing(0.5),
  '& svg': {
    fontSize: '1rem',
  },
}));

const QuestionText = styled(Typography)(({ theme }) => ({
  flex: 1,
  '&.correct': {
    color: theme.palette.success.main,
    fontWeight: 500,
  },
  '&.incorrect': {
    color: theme.palette.error.main,
    textDecoration: 'line-through',
  },
}));

const PointsBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  backgroundColor: theme.palette.grey[200],
  color: theme.palette.text.primary,
  borderRadius: '12px',
  padding: '2px 8px',
  fontSize: '0.75rem',
  fontWeight: 500,
  marginLeft: theme.spacing(1),
}));

interface QuizResultsProps {
  result: QuizResult;
  quiz: Quiz;
  showDetails?: boolean;
  onRetry?: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  quiz,
  showDetails = true,
  onRetry,
}) => {
  const theme = useTheme();
  const { score, passed, timeSpent, completedAt } = result;
  const passingScore = quiz.settings.passingScore || 70;

  // Calculer les statistiques
  const correctCount = result.answers.filter(a => a.isCorrect).length;
  const totalQuestions = quiz.questions.length;
  const percentage = Math.round(score);
  const timeSpentMinutes = Math.floor(timeSpent / 60);
  const timeSpentSeconds = timeSpent % 60;
  const timePerQuestion = totalQuestions > 0 ? Math.round(timeSpent / totalQuestions) : 0;

  // Obtenir le message de résultat
  const getResultMessage = () => {
    if (percentage >= 90) {
      return 'Excellent travail ! Vous avez maîtrisé ce sujet.';
    } else if (percentage >= passingScore) {
      return 'Félicitations ! Vous avez réussi le quiz.';
    } else if (percentage >= passingScore - 20) {
      return 'Vous y êtes presque ! Revoyez quelques notions et réessayez.';
    } else {
      return 'Ne vous découragez pas ! Consultez les ressources et réessayez.';
    }
  };

  // Obtenir la couleur de la note en fonction du score
  const getScoreColor = () => {
    if (percentage >= 90) return theme.palette.success.main;
    if (percentage >= passingScore) return theme.palette.success.light;
    if (percentage >= passingScore - 20) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <ResultContainer>
      {/* En-tête des résultats */}
      <Box mb={4}>
        {passed ? (
          <Box color="success.main" mb={2}>
            <CheckCircle sx={{ fontSize: 60 }} />
          </Box>
        ) : (
          <Box color="error.main" mb={2}>
            <Error sx={{ fontSize: 60 }} />
          </Box>
        )}
        
        <Typography variant="h4" component="h2" gutterBottom>
          {passed ? 'Quiz réussi !' : 'Quiz terminé'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {getResultMessage()}
        </Typography>
      </Box>

      {/* Score principal */}
      <ScoreContainer>
        <LinearProgress
          variant="determinate"
          value={percentage > 100 ? 100 : percentage}
          color={percentage >= passingScore ? 'success' : 'error'}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: 'rotate(-90deg)',
            borderRadius: '50%',
            '& .MuiLinearProgress-bar': {
              borderRadius: '4px',
            },
          }}
        />
        <ScoreText>
          <ScoreValue style={{ color: getScoreColor() }}>
            {percentage}%
          </ScoreValue>
          <Typography variant="body2" color="text.secondary">
            Score
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {correctCount} / {totalQuestions} réponses
          </Typography>
        </ScoreText>
      </ScoreContainer>

      {/* Statistiques */}
      <StatsContainer>
        <StatItem>
          <EmojiEvents color="primary" fontSize="large" />
          <StatValue>{correctCount}</StatValue>
          <StatLabel>Réponses correctes</StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>
            {timeSpentMinutes}m {timeSpentSeconds}s
          </StatValue>
          <StatLabel>Temps passé</StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>{timePerQuestion}s</StatValue>
          <StatLabel>Moyenne par question</StatLabel>
        </StatItem>
        
        <StatItem>
          <StatValue>{passingScore}%</StatValue>
          <StatLabel>Score de réussite</StatLabel>
        </StatItem>
      </StatsContainer>

      {/* Détails des réponses */}
      {showDetails && (
        <Box mt={6}>
          <Typography variant="h6" gutterBottom>
            Détail de vos réponses
          </Typography>
          
          <QuestionList>
            {quiz.questions.map((question) => {
              const answer = result.answers.find(a => a.questionId === question.id);
              const isCorrect = answer?.isCorrect;
              const pointsEarned = isCorrect ? (question.points || 1) : 0;
              
              return (
                <QuestionItem key={question.id}>
                  <QuestionStatus isCorrect={isCorrect || false}>
                    {isCorrect ? <CheckCircle fontSize="small" /> : <Error fontSize="small" />}
                  </QuestionStatus>
                  <QuestionText 
                    className={isCorrect ? 'correct' : 'incorrect'}
                    variant="body1"
                  >
                    {question.text}
                    <PointsBadge>
                      {pointsEarned}/{question.points || 1} pts
                    </PointsBadge>
                    
                    {!isCorrect && answer?.feedback && (
                      <Box 
                        mt={1} 
                        p={1.5} 
                        bgcolor="error.50" 
                        borderRadius={1}
                        color="error.main"
                      >
                        <Typography variant="body2">
                          <strong>Votre réponse :</strong> {answer.userAnswer || 'Aucune réponse'}
                        </Typography>
                        <Typography variant="body2" mt={0.5}>
                          <strong>Réponse attendue :</strong> {answer.correctAnswer}
                        </Typography>
                        {answer.explanation && (
                          <Typography variant="body2" mt={1}>
                            <strong>Explication :</strong> {answer.explanation}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </QuestionText>
                </QuestionItem>
              );
            })}
          </QuestionList>
        </Box>
      )}

      {/* Actions */}
      <Box mt={6} display="flex" justifyContent="center" gap={2}>
        {onRetry && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Replay />}
            onClick={onRetry}
            size="large"
          >
            Réessayer le quiz
          </Button>
        )}
        
        <Button
          variant="contained"
          color="primary"
          href={`/courses/${quiz.courseId}`}
          size="large"
        >
          Retour au cours
        </Button>
      </Box>
      
      <Typography variant="caption" display="block" mt={4} color="text.secondary">
        Quiz complété le {new Date(completedAt).toLocaleDateString()} à {new Date(completedAt).toLocaleTimeString()}
      </Typography>
    </ResultContainer>
  );
};

export default QuizResults;
