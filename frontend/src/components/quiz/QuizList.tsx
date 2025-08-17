import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  Chip, 
  Skeleton,
  CircularProgress,
  Alert,
  Pagination,
  Container
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useQuiz } from '../../hooks/useQuiz';
import { Quiz } from '../../services/quizService';
import { Timer, Book, Award, TrendingUp } from 'lucide-react';

// Styles personnalisés
const QuizCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
  position: 'relative',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius * 2,
}));

const QuizCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

const QuizCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const QuizTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.main,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const QuizDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  height: '4.5em',
}));

const QuizMetaItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginBottom: theme.spacing(0.5),
}));

const DifficultyBadge = styled(Chip)(({ theme, difficulty }: { theme: any, difficulty: string }) => {
  const colors: Record<string, { bg: string, text: string }> = {
    beginner: { bg: theme.palette.success.light, text: theme.palette.success.contrastText },
    intermediate: { bg: theme.palette.warning.light, text: theme.palette.warning.contrastText },
    advanced: { bg: theme.palette.error.light, text: theme.palette.error.contrastText },
  };
  
  const color = colors[difficulty] || colors.intermediate;
  
  return {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    backgroundColor: color.bg,
    color: color.text,
    fontWeight: 600,
    fontSize: '0.75rem',
  };
});

interface QuizListProps {
  courseId?: string;
  limit?: number;
  showPagination?: boolean;
  showFilters?: boolean;
  onQuizSelect?: (quizId: string) => void;
}

const QuizList: React.FC<QuizListProps> = ({
  courseId,
  limit = 6,
  showPagination = true,
  showFilters = true,
  onQuizSelect
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [filter, setFilter] = useState<string>('all');
  
  const {
    availableQuizzes,
    loadingQuizzes,
    error,
    loadAvailableQuizzes,
    navigateToQuiz
  } = useQuiz({
    courseId,
    autoLoad: true
  });
  
  // Filtrer les quiz
  useEffect(() => {
    if (!availableQuizzes) {
      setFilteredQuizzes([]);
      return;
    }
    
    let filtered = [...availableQuizzes];
    
    if (filter === 'beginner') {
      filtered = filtered.filter(quiz => quiz.metadata?.difficulty === 'beginner');
    } else if (filter === 'intermediate') {
      filtered = filtered.filter(quiz => quiz.metadata?.difficulty === 'intermediate');
    } else if (filter === 'advanced') {
      filtered = filtered.filter(quiz => quiz.metadata?.difficulty === 'advanced');
    }
    
    setFilteredQuizzes(filtered);
  }, [availableQuizzes, filter]);
  
  // Gérer la pagination
  const totalPages = Math.ceil(filteredQuizzes.length / limit);
  const paginatedQuizzes = filteredQuizzes.slice((page - 1) * limit, page * limit);
  
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleQuizClick = (quizId: string) => {
    if (onQuizSelect) {
      onQuizSelect(quizId);
    } else {
      navigateToQuiz(quizId);
    }
  };
  
  // Afficher le chargement
  if (loadingQuizzes) {
    return (
      <Container>
        <Grid container spacing={3}>
          {Array.from(new Array(limit)).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <QuizCard>
                <QuizCardContent>
                  <Skeleton variant="rectangular" width="40%" height={32} />
                  <Skeleton variant="text" height={20} sx={{ mt: 1 }} />
                  <Skeleton variant="text" height={20} />
                  <Skeleton variant="text" height={20} width="80%" />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={24} />
                  </Box>
                </QuizCardContent>
                <QuizCardActions>
                  <Skeleton variant="rectangular" width={120} height={36} />
                </QuizCardActions>
              </QuizCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }
  
  // Afficher les erreurs
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        Une erreur est survenue lors du chargement des quiz: {error.message}
      </Alert>
    );
  }
  
  // Afficher un message si aucun quiz n'est disponible
  if (!loadingQuizzes && (!filteredQuizzes || filteredQuizzes.length === 0)) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        Aucun quiz n'est disponible pour le moment.
      </Alert>
    );
  }
  
  return (
    <Container>
      {showFilters && (
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Chip 
            label="Tous" 
            color={filter === 'all' ? 'primary' : 'default'} 
            onClick={() => setFilter('all')}
            sx={{ fontWeight: 500 }}
          />
          <Chip 
            label="Débutant" 
            color={filter === 'beginner' ? 'primary' : 'default'} 
            onClick={() => setFilter('beginner')}
            sx={{ fontWeight: 500 }}
          />
          <Chip 
            label="Intermédiaire" 
            color={filter === 'intermediate' ? 'primary' : 'default'} 
            onClick={() => setFilter('intermediate')}
            sx={{ fontWeight: 500 }}
          />
          <Chip 
            label="Avancé" 
            color={filter === 'advanced' ? 'primary' : 'default'} 
            onClick={() => setFilter('advanced')}
            sx={{ fontWeight: 500 }}
          />
        </Box>
      )}
      
      <Grid container spacing={3}>
        {paginatedQuizzes.map((quiz) => (
          <Grid item xs={12} sm={6} md={4} key={quiz.id}>
            <QuizCard>
              <DifficultyBadge 
                difficulty={quiz.metadata?.difficulty || 'intermediate'} 
                label={
                  quiz.metadata?.difficulty === 'beginner' ? 'Débutant' :
                  quiz.metadata?.difficulty === 'advanced' ? 'Avancé' : 'Intermédiaire'
                }
                size="small"
              />
              
              <QuizCardContent>
                <QuizTitle variant="h6">
                  {quiz.title}
                </QuizTitle>
                
                <QuizDescription variant="body2">
                  {quiz.description || "Aucune description disponible."}
                </QuizDescription>
                
                <Box sx={{ mt: 2 }}>
                  <QuizMetaItem>
                    <Timer size={16} />
                    <Typography variant="body2">
                      {quiz.settings?.timeLimit ? `${quiz.settings.timeLimit} minutes` : 'Pas de limite de temps'}
                    </Typography>
                  </QuizMetaItem>
                  
                  <QuizMetaItem>
                    <Book size={16} />
                    <Typography variant="body2">
                      {quiz.questions?.length || 0} questions
                    </Typography>
                  </QuizMetaItem>
                  
                  {quiz.metadata?.averageScore !== undefined && (
                    <QuizMetaItem>
                      <Award size={16} />
                      <Typography variant="body2">
                        Score moyen: {Math.round(quiz.metadata.averageScore)}%
                      </Typography>
                    </QuizMetaItem>
                  )}
                  
                  {quiz.metadata?.attemptsCount !== undefined && (
                    <QuizMetaItem>
                      <TrendingUp size={16} />
                      <Typography variant="body2">
                        {quiz.metadata.attemptsCount} tentatives
                      </Typography>
                    </QuizMetaItem>
                  )}
                </Box>
              </QuizCardContent>
              
              <QuizCardActions>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth
                  onClick={() => handleQuizClick(quiz.id)}
                >
                  Commencer le quiz
                </Button>
              </QuizCardActions>
            </QuizCard>
          </Grid>
        ))}
      </Grid>
      
      {showPagination && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange} 
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
};

export default QuizList;
