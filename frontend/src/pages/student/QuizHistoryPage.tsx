import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { 
  Container, Typography, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Chip, Button, Skeleton, Alert, IconButton, Tooltip
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Cancel as XCircleIcon,
  Visibility as EyeIcon, 
  ArrowBack as ArrowLeftIcon, 
  BarChart as BarChart2Icon, 
  EmojiEvents as AwardIcon, 
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { dashboardService } from '@/services/dashboard.service';
import type { QuizHistory, QuizResultSummary } from '@/services/dashboard.service';

// Styled components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'medium',
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  borderRadius: theme.shape.borderRadius,
}));

const QuizHistoryPage: React.FC = () => {
  const [quizHistory, setQuizHistory] = useState<QuizHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchQuizHistory = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getQuizHistory();
        setQuizHistory(data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement de l\'historique des quiz');
        console.error('Erreur lors du chargement de l\'historique des quiz:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizHistory();
  }, []);
  
  const handleViewDetails = (quizResultId: number) => {
    navigate(`/etudiant/quiz-results/${quizResultId}`);
  };
  
  const handleBackToDashboard = () => {
    navigate('/etudiant');
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy, HH:mm', { locale: fr });
    } catch (error) {
      return dateString;
    }
  };
  
  // Loading skeleton
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
        
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            color="primary" 
            onClick={handleBackToDashboard}
            sx={{ mr: 2 }}
          >
            <ArrowLeftIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Historique des Quiz
          </Typography>
        </Box>
      </Box>
      
      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {/* Stats summary */}
      {quizHistory && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
          <StatCard elevation={2}>
            <BarChart2Icon sx={{ fontSize: 24, color: "#3f51b5" }} />
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
              {quizHistory.total_quizzes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quiz complétés
            </Typography>
          </StatCard>
          
          <StatCard elevation={2}>
            <AwardIcon sx={{ fontSize: 24, color: "#4caf50" }} />
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
              {quizHistory.average_score.toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Score moyen
            </Typography>
          </StatCard>
          
          <StatCard elevation={2}>
            <CheckCircleIcon sx={{ fontSize: 24, color: "#ff9800" }} />
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
              {quizHistory.passed_quizzes}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quiz réussis
            </Typography>
          </StatCard>
        </Box>
      )}
      
      {/* Quiz history table */}
      {quizHistory && quizHistory.results.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
          <Table sx={{ minWidth: 650 }} aria-label="tableau d'historique des quiz">
            <TableHead>
              <TableRow>
                <StyledTableCell>Quiz</StyledTableCell>
                <StyledTableCell>Cours</StyledTableCell>
                <StyledTableCell align="center">Score</StyledTableCell>
                <StyledTableCell align="center">Résultat</StyledTableCell>
                <StyledTableCell align="center">Date</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quizHistory.results.map((result: QuizResultSummary) => (
                <StyledTableRow key={result.id}>
                  <TableCell component="th" scope="row">
                    <Typography variant="body1" fontWeight="medium">
                      {result.quiz_title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {result.correct_answers} / {result.total_questions} questions correctes
                    </Typography>
                  </TableCell>
                  <TableCell>{result.course_title}</TableCell>
                  <TableCell align="center">
                    <Typography 
                      variant="body1" 
                      fontWeight="bold"
                      color={result.score >= 70 ? 'success.main' : 'error.main'}
                    >
                      {result.score.toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      icon={result.passed ? <CheckCircleIcon sx={{ fontSize: 16, color: "#4caf50" }} /> : <XCircleIcon sx={{ fontSize: 16, color: "#f44336" }} />}
                      label={result.passed ? "Réussi" : "Échoué"}
                      color={result.passed ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={formatDate(result.completed_at)}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CalendarIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2">
                          {format(parseISO(result.completed_at), 'dd/MM/yyyy')}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Voir les détails">
                      <IconButton 
                        color="primary"
                        onClick={() => handleViewDetails(result.id)}
                        size="small"
                      >
                        <EyeIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Vous n'avez pas encore complété de quiz
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleBackToDashboard}
          >
            Retour au tableau de bord
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default QuizHistoryPage;
