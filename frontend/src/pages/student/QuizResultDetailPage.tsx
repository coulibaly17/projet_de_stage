import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { 
  Container, Typography, Box, Paper, Divider, 
  Chip, Button, Skeleton, Alert, IconButton, 
  Card, CardContent, LinearProgress
} from '@mui/material';
import { 
  CheckCircle, XCircle, ArrowLeft, Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { dashboardService } from '@/services/dashboard.service';
import type { QuizResultDetail, UserAnswer } from '@/services/dashboard.service';

// Styled components
const QuestionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  overflow: 'visible',
}));

const AnswerChip = styled(Chip)<{ iscorrect: boolean }>(({ theme, iscorrect }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: iscorrect 
    ? theme.palette.success.light 
    : theme.palette.error.light,
  color: theme.palette.getContrastText(
    iscorrect 
      ? theme.palette.success.light 
      : theme.palette.error.light
  ),
  '& .MuiChip-icon': {
    color: 'inherit',
  }
}));

const CorrectAnswerBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.success.light,
  borderRadius: theme.shape.borderRadius,
  marginTop: theme.spacing(1),
}));

const ScoreCircle = styled(Box)<{ score: number }>(({ theme, score }) => {
  // Gestion des valeurs nulles ou NaN
  const safeScore = score != null && !isNaN(score) ? score : 0;
  
  let color = theme.palette.error.main;
  if (safeScore >= 70) color = theme.palette.success.main;
  else if (safeScore >= 50) color = theme.palette.warning.main;
  
  return {
    width: 120,
    height: 120,
    borderRadius: '50%',
    border: `8px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
  };
});

const QuizResultDetailPage: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const [quizResult, setQuizResult] = useState<QuizResultDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchQuizResult = async () => {
      if (!resultId) {
        setError('ID de résultat non valide');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await dashboardService.getQuizResultDetails(parseInt(resultId, 10));
        setQuizResult(data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des détails du quiz');
        console.error('Erreur lors du chargement des détails du quiz:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizResult();
  }, [resultId]);
  
  const handleBackToHistory = () => {
    navigate('/student/quiz-history');
  };
  
  // Format date avec gestion robuste des erreurs
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = parseISO(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date non disponible';
      }
      return format(date, 'dd MMMM yyyy, HH:mm', { locale: fr });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date non disponible';
    }
  };
  
  // Loading skeleton
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
        </Box>
        
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} variant="rectangular" height={150} sx={{ borderRadius: 2, mb: 2 }} />
        ))}
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton 
          color="primary" 
          onClick={handleBackToHistory}
          sx={{ mr: 2 }}
        >
          <ArrowLeft />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Résultats du Quiz
        </Typography>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {/* Quiz summary */}
      {quizResult && (
        <>
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {quizResult.quiz_title}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                  <Calendar size={18} style={{ marginRight: 8 }} />
                  <Typography variant="body2">
                    {formatDate(quizResult.completed_at)}
                  </Typography>
                </Box>
                
                <Chip 
                  icon={quizResult.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                  label={quizResult.passed ? "Réussi" : "Échoué"}
                  color={quizResult.passed ? "success" : "error"}
                  size="small"
                />
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyContent: 'space-around' }}>
              <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 0 } }}>
                <ScoreCircle score={quizResult.score ?? 0}>
                  <Typography variant="h4" fontWeight="bold">
                    {(quizResult.score != null && !isNaN(quizResult.score)) ? quizResult.score.toFixed(0) : '0'}%
                  </Typography>
                </ScoreCircle>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Score final
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 0 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={24} color="#4caf50" style={{ marginRight: 8 }} />
                  <Typography variant="h5" fontWeight="bold">
                    {quizResult.correct_answers ?? 0} / {quizResult.total_questions ?? 0}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Réponses correctes
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: '100%', maxWidth: 150 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={quizResult.score != null && !isNaN(quizResult.score) ? quizResult.score : 0} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: quizResult.score >= 70 ? '#4caf50' : 
                                        quizResult.score >= 50 ? '#ff9800' : '#f44336'
                      }
                    }} 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Progression
                </Typography>
              </Box>
            </Box>
          </Paper>
          
          {/* Questions and answers */}
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
            Détails des réponses
          </Typography>
          
          {quizResult.answers.map((answer: UserAnswer, index: number) => (
            <QuestionCard key={answer.question_id} elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Box 
                    sx={{ 
                      minWidth: 30, 
                      height: 30, 
                      borderRadius: '50%', 
                      backgroundColor: 'primary.main', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mr: 2,
                      mt: 0.5
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {index + 1}
                    </Typography>
                  </Box>
                  <Typography variant="h6">
                    {answer.question_text}
                  </Typography>
                </Box>
                
                <Box sx={{ pl: 6 }}>
                  {/* Multiple choice question */}
                  {answer.selected_option_text && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Votre réponse:
                      </Typography>
                      <AnswerChip 
                        icon={answer.is_correct ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        label={answer.selected_option_text}
                        iscorrect={answer.is_correct}
                      />
                    </Box>
                  )}
                  
                  {/* Text answer */}
                  {answer.answer_text && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Votre réponse:
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 1.5, 
                          borderColor: answer.is_correct ? 'success.main' : 'error.main',
                          backgroundColor: answer.is_correct ? 'success.light' : 'error.light',
                          opacity: 0.8
                        }}
                      >
                        <Typography variant="body2">
                          {answer.answer_text}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                  
                  {/* Show correct answer if wrong */}
                  {!answer.is_correct && answer.correct_option_text && (
                    <CorrectAnswerBox>
                      <Typography variant="body2" fontWeight="medium">
                        Réponse correcte: {answer.correct_option_text}
                      </Typography>
                    </CorrectAnswerBox>
                  )}
                </Box>
              </CardContent>
            </QuestionCard>
          ))}
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleBackToHistory}
              startIcon={<ArrowLeft />}
            >
              Retour à l'historique
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default QuizResultDetailPage;
