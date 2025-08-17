import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  quizService,
  type Quiz,
  type QuizAttempt,
  type QuizResult,
  type UserAnswer
} from '../services/quizService';

export interface UseQuizOptions {
  autoLoad?: boolean;
  quizId?: string;
  courseId?: string;
  onError?: (error: Error) => void;
  onComplete?: (result: QuizResult) => void;
  onNavigate?: (path: string) => void;
}

export const useQuiz = (options: UseQuizOptions = {}) => {
  const { autoLoad = true, quizId, courseId, onError, onComplete, onNavigate } = options;
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Références pour éviter les fuites de mémoire
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);

  // États
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Charger un quiz
  const loadQuiz = useCallback(async (id: string = quizId ?? '') => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const quizData = await quizService.getQuiz(id);
      
      if (mountedRef.current) {
        setQuiz(quizData);
        
        // Réinitialiser les réponses de l'utilisateur
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setResult(null);

        const timeLimit = quizData.settings?.timeLimit ?? 0;
        if (timeLimit > 0) setTimeRemaining(timeLimit * 60);
      }

      return quizData;
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error);
        onError?.(error);
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [quizId, onError]);
  
  // Charger les quiz disponibles selon le rôle de l'utilisateur
  const loadAvailableQuizzes = useCallback(async (cId: string = courseId ?? '') => {
    setLoadingQuizzes(true);
    setError(null);
    
    try {
      let quizzes: Quiz[];
      
      // Utiliser la bonne méthode selon le rôle de l'utilisateur
      if (user?.role === 'enseignant') {
        // Pour les enseignants, récupérer leurs quiz
        const courseIdNumber = cId ? parseInt(cId, 10) : undefined;
        quizzes = await quizService.getTeacherQuizzes(courseIdNumber);
      } else {
        // Pour les étudiants, récupérer les quiz disponibles
        quizzes = await quizService.getAvailableQuizzes(cId);
      }
      
      if (mountedRef.current) {
        setAvailableQuizzes(quizzes);
      }
      
      return quizzes;
    } catch (err) {
      const error = err as Error;
      if (mountedRef.current) {
        setError(error);
        onError?.(error);
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoadingQuizzes(false);
      }
    }
  }, [courseId, onError]);
  
  // Charger l'historique des quiz
  const loadQuizHistory = useCallback(async () => {
    if (!user) return [];
    
    setLoadingHistory(true);
    
    try {
      const results = await quizService.getRecentQuizResults(10, user.id.toString());
      
      if (mountedRef.current) {
        setQuizHistory(results);
      }
      
      return results;
    } catch (err) {
      console.error('Failed to load quiz history:', err);
      return [];
    } finally {
      if (mountedRef.current) {
        setLoadingHistory(false);
      }
    }
  }, [user]);

  // Chargement automatique
  useEffect(() => {
    if (autoLoad) {
      if (quizId) {
        loadQuiz(quizId);
      } else if (courseId) {
        loadAvailableQuizzes(courseId);
      }
      
      if (user) {
        loadQuizHistory();
      }
    }
  }, [autoLoad, quizId, courseId, loadQuiz, loadAvailableQuizzes, loadQuizHistory, user]);

  // Minuteur
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    // Nettoyer le timer précédent si existant
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining]);
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Soumettre le quiz
  const handleSubmit = useCallback(async () => {
    if (!quiz || !user) return null;

    setSubmitting(true);

    try {
      const now = new Date();
      const timeLimit = quiz.settings?.timeLimit ?? 0;
      const timeSpent = timeLimit > 0 ? timeLimit * 60 - (timeRemaining ?? 0) : 0;

      const answers: UserAnswer[] = Object.entries(userAnswers).map(([questionId, answer]) => ({
        questionId,
        answer,
        timestamp: now.toISOString(),
        timeSpent: 0 // Peut être affiné plus tard
      }));

      const attemptData: Omit<QuizAttempt, 'id' | 'startedAt' | 'completedAt' | 'score' | 'passed'> = {
        quizId: quiz.id,
        userId: String(user.id), // Conversion de l'ID utilisateur en chaîne de caractères
        answers,
        timeSpent: Math.max(0, timeSpent),
        metadata: {
          device: navigator.userAgent,
          ...(quiz.metadata || {})
        }
      };

      const quizResult = await quizService.submitQuizAttempt(quiz.id, attemptData);
      setResult(quizResult);
      onComplete?.(quizResult);
      return quizResult;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [quiz, user, userAnswers, timeRemaining, onComplete, onError]);

  // Auto-soumission à la fin du temps
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit().catch(err => {
        console.error('Erreur soumission auto:', err);
      });
    }
  }, [timeRemaining, handleSubmit]);

  // Navigation
  const goToNextQuestion = useCallback(() => {
    if (!quiz) return;
    setCurrentQuestionIndex(prev => Math.min(prev + 1, quiz.questions.length - 1));
  }, [quiz]);

  const goToPreviousQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);

  const goToQuestion = useCallback((index: number) => {
    if (!quiz) return;
    setCurrentQuestionIndex(Math.min(Math.max(0, index), quiz.questions.length - 1));
  }, [quiz]);

  // Enregistrer une réponse
  const saveAnswer = useCallback((questionId: string, answer: string | string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);



  // Réinitialiser
  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setResult(null);
    setError(null);
    setTimeRemaining(quiz?.settings?.timeLimit ? quiz.settings.timeLimit * 60 : null);
  }, [quiz]);

  // Valeurs calculées
  const currentQuestion = quiz?.questions[currentQuestionIndex];
  const totalQuestions = quiz?.questions.length || 0;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const hasAnsweredCurrent = Boolean(
    currentQuestion &&
    userAnswers[currentQuestion.id] !== undefined &&
    (Array.isArray(userAnswers[currentQuestion.id])
      ? (userAnswers[currentQuestion.id] as string[]).length > 0
      : true)
  );
  const score = result?.score ?? null;
  const passed = quiz ? (result?.score ?? 0) >= quiz.settings.passingScore : null;

  // Navigation vers un quiz
  const navigateToQuiz = useCallback((quizId: string) => {
    if (onNavigate) {
      onNavigate(`/quiz/${quizId}`);
    } else {
      navigate(`/quiz/${quizId}`);
    }
  }, [navigate, onNavigate]);

  return {
    // États
    quiz,
    availableQuizzes,
    loading,
    loadingQuizzes,
    loadingHistory,
    error,
    currentQuestion,
    currentQuestionIndex,
    userAnswers,
    result,
    timeRemaining,
    submitting,
    quizHistory,

    // Calculs
    totalQuestions,
    progress,
    isLastQuestion,
    hasAnsweredCurrent,
    score,
    passed,

    // Actions
    loadQuiz,
    loadAvailableQuizzes,
    loadQuizHistory,
    goToNextQuestion,
    goToPreviousQuestion,
    goToQuestion,
    saveAnswer,
    submit: handleSubmit,
    reset: resetQuiz,
    setTimeRemaining,
    navigateToQuiz
  };
};

export default useQuiz;
