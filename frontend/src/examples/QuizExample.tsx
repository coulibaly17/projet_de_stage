import React, { useState } from 'react';
import { 
  Quiz, 
  QuizQuestion, 
  QuizResults,
  QuizNavigation,
  QuizTimer,
  quizService,
  useQuiz,
  type Quiz as QuizType,
  type Question,
  type QuizResult
} from '../components/quiz';
import { Box, Button, Container, Paper, Typography } from '@mui/material';

// Données de démonstration pour un quiz
const demoQuiz: QuizType = {
  id: 'quiz-123',
  title: 'Introduction à React',
  description: 'Testez vos connaissances sur les bases de React',
  courseId: 'react-basics',
  questions: [
    {
      id: 'q1',
      type: 'single',
      text: 'Quelle méthode est utilisée pour rendre un composant React dans le DOM ?',
      options: [
        { id: 'a', text: 'ReactDOM.render()' },
        { id: 'b', text: 'React.render()' },
        { id: 'c', text: 'render()' },
        { id: 'd', text: 'ReactDOM.mount()' }
      ],
      correctAnswers: ['a'],
      explanation: 'ReactDOM.render() est la méthode utilisée pour rendre un composant React dans le DOM.',
      points: 1,
      metadata: {
        difficulty: 'easy',
        category: 'Fondamentaux',
        tags: ['react', 'rendu']
      }
    },
    {
      id: 'q2',
      type: 'multiple',
      text: 'Lesquelles de ces affirmations sont vraies concernant les composants React ?',
      options: [
        { id: 'a', text: 'Les composants peuvent retourner plusieurs éléments' },
        { id: 'b', text: 'Les props sont en lecture seule' },
        { id: 'c', text: 'setState() est synchrone' },
        { id: 'd', text: 'Les composants doivent commencer par une majuscule' }
      ],
      correctAnswers: ['b', 'd'],
      explanation: 'Les props sont en lecture seule et les composants doivent commencer par une majuscule pour être reconnus comme des composants React.',
      points: 2,
      metadata: {
        difficulty: 'medium',
        category: 'Composants',
        tags: ['composants', 'props', 'state']
      }
    },
    {
      id: 'q3',
      type: 'code',
      text: 'Écrivez un composant fonctionnel qui affiche "Bonjour, {nom}" où {nom} est une prop.',
      correctAnswers: ['function Salutation({ nom }) {\n  return <h1>Bonjour, {nom}</h1>;\n}'],
      points: 3,
      metadata: {
        difficulty: 'medium',
        category: 'Composants',
        tags: ['composants', 'fonctionnel', 'props']
      }
    }
  ],
  settings: {
    timeLimit: 300, // 5 minutes
    passingScore: 70,
    showResults: true,
    allowRetries: true,
    shuffleQuestions: false,
    shuffleAnswers: true,
    showExplanations: true,
    showCorrectAnswers: true,
    showScore: true,
    requireFullScreen: false
  },
  metadata: {
    author: 'Équipe pédagogique',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-05T00:00:00Z',
    averageScore: 75,
    attemptsCount: 42,
    averageTimeSpent: 240,
    difficulty: 'beginner',
    categories: ['React', 'Frontend'],
    tags: ['débutant', 'fondamentaux']
  },
  version: '1.0.0',
  isPublished: true
};

/**
 * Exemple d'utilisation du composant Quiz avec gestion d'état personnalisée
 */
const QuizWithCustomState = () => {
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const handleComplete = (quizResult: QuizResult) => {
    console.log('Quiz complété:', quizResult);
    setResult(quizResult);
    setIsQuizCompleted(true);
    
    // Envoyer les résultats au serveur
    quizService.submitQuizAttempt(quizResult.quizId, {
      quizId: quizResult.quizId,
      userId: 'user-123',
      answers: quizResult.answers.map(a => ({
        questionId: a.questionId,
        answer: a.userAnswer,
        timestamp: new Date().toISOString()
      })),
      metadata: {
        device: navigator.userAgent,
        timeSpent: quizResult.timeSpent
      }
    });
  };

  const handleRetry = () => {
    setResult(null);
    setIsQuizCompleted(false);
  };

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Exemple de Quiz
        </Typography>
        
        {!isQuizCompleted ? (
          <Quiz 
            quizId={demoQuiz.id}
            onComplete={handleComplete}
            showNavigation={true}
            showTimer={true}
            showProgress={true}
            showResults={true}
            autoStart={true}
          />
        ) : (
          <Box>
            <QuizResults 
              result={result!} 
              quiz={demoQuiz} 
              onRetry={handleRetry}
            />
            
            <Box mt={4} textAlign="center">
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleRetry}
                sx={{ mr: 2 }}
              >
                Recommencer le quiz
              </Button>
              
              <Button 
                variant="outlined" 
                href="/courses/react-basics"
              >
                Retour au cours
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

/**
 * Exemple d'utilisation du hook useQuiz directement
 */
const QuizWithHook = () => {
  const {
    quiz,
    loading,
    error,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    progress,
    timeRemaining,
    submit,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    saveAnswer,
    userAnswers,
    result
  } = useQuiz({
    quizId: demoQuiz.id,
    autoLoad: true,
    onComplete: (quizResult) => {
      console.log('Quiz complété avec le hook:', quizResult);
    },
    onError: (error) => {
      console.error('Erreur du quiz:', error);
    }
  });

  if (loading) {
    return <div>Chargement du quiz...</div>;
  }

  if (error) {
    return <div>Erreur lors du chargement du quiz: {error.message}</div>;
  }

  if (result) {
    return (
      <QuizResults 
        result={result} 
        quiz={quiz!} 
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!currentQuestion) {
    return <div>Aucune question disponible</div>;
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h5" component="h2">
            {quiz?.title}
          </Typography>
          
          <QuizTimer 
            timeRemaining={timeRemaining || 0}
            totalTime={quiz?.settings.timeLimit || 300}
            onTimeUp={submit}
            size="medium"
          />
        </Box>
        
        <Box mb={4}>
          <Typography variant="body2" color="text.secondary">
            Question {currentQuestionIndex + 1} sur {totalQuestions}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ height: 8, borderRadius: 4, mt: 1 }}
          />
        </Box>
        
        <QuizQuestion
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          value={userAnswers[currentQuestion.id]}
          onChange={(value) => saveAnswer(currentQuestion.id, value)}
        />
        
        <Box display="flex" justifyContent="space-between" mt={4} pt={2} borderTop={1} borderColor="divider">
          <Button 
            variant="outlined" 
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Précédent
          </Button>
          
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button 
              variant="contained" 
              color="primary"
              onClick={goToNextQuestion}
              disabled={!userAnswers[currentQuestion.id]}
            >
              Suivant
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary"
              onClick={submit}
              disabled={!userAnswers[currentQuestion.id]}
            >
              Terminer le quiz
            </Button>
          )}
        </Box>
        
        <Box mt={4}>
          <QuizNavigation
            totalQuestions={totalQuestions}
            currentIndex={currentQuestionIndex}
            answeredQuestions={Object.keys(userAnswers).length}
            onNavigate={goToQuestion}
            questionStatuses={{
              [currentQuestionIndex]: userAnswers[currentQuestion.id] ? 'answered' : 'unanswered'
            }}
          />
        </Box>
      </Paper>
    </Container>
  );
};

// Exemple d'utilisation des méthodes du service de quiz
const QuizServiceExample = () => {
  const [quiz, setQuiz] = useState<QuizType | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const quizData = await quizService.getQuiz(demoQuiz.id);
      setQuiz(quizData);
      
      // Charger les résultats précédents
      const quizResults = await quizService.getQuizResults(demoQuiz.id);
      setResults(quizResults);
      
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement du quiz');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    try {
      setLoading(true);
      const attempt = await quizService.startQuizAttempt(demoQuiz.id);
      console.log('Nouvelle tentative de quiz:', attempt);
      // Rediriger vers la page du quiz ou mettre à jour l'état
    } catch (err) {
      setError('Erreur lors du démarrage du quiz');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuiz();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h5" gutterBottom>
          Exemple d'utilisation du service de quiz
        </Typography>
        
        {quiz && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6">{quiz.title}</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {quiz.description}
            </Typography>
            <Typography variant="body2">
              {quiz.questions.length} questions • {Math.floor((quiz.settings.timeLimit || 0) / 60)} min • 
              Score de passage: {quiz.settings.passingScore}%
            </Typography>
            
            <Box mt={2}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={startQuiz}
                disabled={loading}
              >
                Commencer le quiz
              </Button>
            </Box>
          </Paper>
        )}
        
        {results.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vos résultats précédents
            </Typography>
            
            {results.map((result, index) => (
              <Box 
                key={result.id} 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  border: 1, 
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: 'background.paper'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">
                    Tentative #{results.length - index}
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={result.passed ? 'success.main' : 'error.main'}
                    fontWeight="bold"
                  >
                    {result.score}%
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {new Date(result.completedAt).toLocaleDateString()} • 
                  {result.correctAnswers} bonnes réponses sur {result.totalQuestions}
                </Typography>
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    </Container>
  );
};

// Composant principal qui affiche tous les exemples
export const QuizExample = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          aria-label="Exemples de quiz"
        >
          <Tab label="Composant Quiz" />
          <Tab label="Hook useQuiz" />
          <Tab label="Service quiz" />
        </Tabs>
      </Box>
      
      {activeTab === 0 && <QuizWithCustomState />}
      {activeTab === 1 && <QuizWithHook />}
      {activeTab === 2 && <QuizServiceExample />}
    </Box>
  );
};

export default QuizExample;
