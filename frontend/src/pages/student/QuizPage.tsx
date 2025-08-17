import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { useAuth } from '@/context/AuthContext';
import { quizService } from '@/services/quiz.service';
import type { Question, QuestionOption, Quiz, QuizAttempt, QuizResult, UserAnswer } from '@/types/quiz';
import { toast } from 'react-hot-toast';

// Types personnalisés pour le composant QuizPage

interface QuizState extends Omit<Quiz, 'settings' | 'courseId'> {
  settings: {
    timeLimit?: number;
    passingScore: number;
    showResults: boolean;
    allowRetries: boolean;
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
    showExplanations: boolean;
    showCorrectAnswers: boolean;
    showScore: boolean;
    requireFullScreen: boolean;
  };
  questions: Array<Question & {
    options: QuestionOption[];
    points: number;
  }>;
  courseTitle?: string;
  courseId?: string | number;
}


// Composant pour afficher une question de quiz
const QuizQuestionComponent = ({ 
  question, 
  currentAnswer, 
  onAnswerChange 
}: { 
  question: Question; 
  currentAnswer: string | string[] | null;
  onAnswerChange: (answer: string | string[]) => void;
}) => {
  // Gestion des questions à choix unique
  if (question.type === "single" || question.type === "single_choice" || question.type === "true_false") {
    return (
      <div className="space-y-3">
        {question.options?.map(option => (
          <div key={option.id} className="flex items-center">
            <input
              type="radio"
              id={option.id}
              name={question.id}
              value={option.id}
              checked={currentAnswer === option.id}
              onChange={() => onAnswerChange(option.id)}
              className="mr-2"
            />
            <label htmlFor={option.id} className="text-sm">{option.text}</label>
          </div>
        ))}
      </div>
    );
  } 
  // Gestion des questions à choix multiples
  else if (question.type === "multiple" || question.type === "multiple_choice") {
    const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : [];
    
    return (
      <div className="space-y-3">
        {question.options?.map(option => (
          <div key={option.id} className="flex items-center">
            <input
              type="checkbox"
              id={option.id}
              name={question.id}
              value={option.id}
              checked={selectedOptions.includes(option.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  onAnswerChange([...selectedOptions, option.id]);
                } else {
                  onAnswerChange(selectedOptions.filter(id => id !== option.id));
                }
              }}
              className="mr-2"
            />
            <label htmlFor={option.id} className="text-sm">{option.text}</label>
          </div>
        ))}
      </div>
    );
  } 
  // Gestion des questions à réponse libre
  else if (question.type === "text") {
    return (
      <div>
        <textarea
          value={currentAnswer as string || ""}
          onChange={(e) => onAnswerChange(e.target.value)}
          className="w-full p-2 border rounded-md"
          rows={4}
          placeholder="Votre réponse..."
        />
      </div>
    );
  }
  
  // Message d'erreur pour les types non pris en charge
  console.warn(`Type de question non pris en charge: ${question.type}`);
  return <div>Type de question non pris en charge: {question.type}</div>;
};

// Page principale du quiz
const QuizPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // États pour gérer le quiz
  const [startTime] = useState<Date | null>(new Date());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string | string[] }>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeSpent] = useState(0);
  // État pour suivre si le quiz a commencé

  // Charger le quiz
  const loadQuiz = useCallback(async (quizId: string) => {
    try {
      setIsLoading(true);
      
      const quizData = await quizService.getQuiz(quizId);
      
      // Normalize quiz data to match our QuizState type
      const normalizedQuiz: QuizState = {
        ...quizData,
        settings: {
          passingScore: quizData.settings?.passingScore ?? 70,
          showResults: quizData.settings?.showResults ?? true,
          allowRetries: quizData.settings?.allowRetries ?? true,
          shuffleQuestions: quizData.settings?.shuffleQuestions ?? false,
          shuffleAnswers: quizData.settings?.shuffleAnswers ?? false,
          showExplanations: quizData.settings?.showExplanations ?? true,
          showCorrectAnswers: quizData.settings?.showCorrectAnswers ?? true,
          showScore: quizData.settings?.showScore ?? true,
          requireFullScreen: quizData.settings?.requireFullScreen ?? false,
          timeLimit: quizData.settings?.timeLimit ?? 30,
        },
        questions: (quizData.questions ?? []).map(q => ({
          ...q,
          options: q.options ?? [],
          points: q.points ?? 1,
        }))
      };
      
      setQuiz(normalizedQuiz);
      setTimeRemaining((normalizedQuiz.settings.timeLimit ?? 30) * 60);
    } catch (err) {
      console.error('Erreur lors du chargement du quiz:', err);
      toast.error('Impossible de charger le quiz. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Charger le quiz au montage
  useEffect(() => {
    if (id) {
      loadQuiz(id);
    } else {
      console.error("Aucun ID de quiz fourni");
      toast.error("Aucun ID de quiz fourni");
      setIsLoading(false);
    }
  }, [id, loadQuiz]);
  
  // Gérer le changement de réponse
  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { answer }
    }));
  }, []);
  
  // Fonction pour naviguer entre les questions
  const goToNextQuestion = useCallback(() => {
    if (quiz) {
      setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1));
    }
  }, [quiz]);

  const goToPreviousQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  }, []);
  

  // Soumettre le quiz
  const submitQuiz = useCallback(async () => {
    if (!quiz) return;
    
    setIsSubmitting(true);
    
    try {
      // Préparer les réponses pour la soumission
      const submissionAnswers: UserAnswer[] = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer: answer.answer,
        timestamp: new Date().toISOString()
      }));
      
      // Calculer le temps passé
      const endTime = new Date();
      const timeSpent = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
      
      // Préparer les données de la tentative
      const attemptData: Omit<QuizAttempt, 'id' | 'score' | 'passed'> = {
        quizId: quiz.id,
        userId: user?.id?.toString() ?? '0', // Convertir en string et utiliser '0' comme valeur par défaut
        answers: submissionAnswers,
        timeSpent,
        startedAt: startTime || new Date(),
        completedAt: endTime
      };
      
      console.log('Tentative de soumission du quiz:', attemptData);
      
      // Soumettre la tentative de quiz
      let result: QuizResult;
      
      try {
        // Essayer d'abord d'envoyer au backend
        result = await quizService.submitQuizAttempt(quiz.id, attemptData);
        console.log('Réponse du backend:', result);
      } catch (error) {
        console.error('Erreur lors de la soumission du quiz au backend, utilisation du calcul local', error);
        
        // Calcul local du score en cas d'erreur backend
        const correctAnswers = submissionAnswers.filter(a => {
          const question = quiz.questions.find(q => q.id === a.questionId);
          if (!question || !question.options) return false;
          
          const answerArray = Array.isArray(a.answer) ? a.answer : [a.answer];
          
          if (question.type === 'single_choice' || question.type === 'true_false') {
            const correctOption = question.options.find(opt => opt.isCorrect);
            return correctOption && answerArray[0] === correctOption.id;
          }
          
          if (question.type === 'multiple_choice') {
            const correctOptionIds = question.options
              .filter(opt => opt.isCorrect)
              .map(opt => opt.id);
              
            return correctOptionIds.length === answerArray.length && 
                   correctOptionIds.every(id => answerArray.includes(id));
          }
          
          return false;
        }).length;
        
        const score = Math.round((correctAnswers / quiz.questions.length) * 100);
        result = {
          id: Date.now(),
          quizId: parseInt(quiz.id, 10) || 0,
          quizTitle: quiz.title || 'Quiz sans titre',
          score,
          passed: score >= (quiz.settings?.passingScore || 70),
          completedAt: endTime.toISOString(),
          courseId: 0,
          courseTitle: 'Cours inconnu',
          lessonId: 0,
          lessonTitle: 'Leçon inconnue',
          correctAnswers,
          totalQuestions: quiz.questions.length,
          timeSpent
        } as unknown as QuizResult;
      }
      
      // Vérifier si le résultat contient des données valides
      if (!result) {
        console.error('Aucune donnée reçue du serveur, utilisation du calcul local');
        
        // Calculer le score localement en cas d'absence de réponse du serveur
        const correctAnswers = submissionAnswers.filter(a => {
          const question = quiz.questions.find(q => q.id === a.questionId);
          if (!question || !question.options) return false;
          
          const answerArray = Array.isArray(a.answer) ? a.answer : [a.answer];
          const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.id);
          
          // Vérifier si les réponses correspondent exactement aux options correctes
          return answerArray.length === correctOptions.length && 
                 answerArray.every(ans => correctOptions.includes(ans));
        }).length;
        
        const calculatedScore = Math.round((correctAnswers / quiz.questions.length) * 100);
        const passingScore = quiz.settings?.passingScore || 70;
        
        result = {
          id: Date.now(),
          quizId: parseInt(quiz.id, 10) || 0,
          quizTitle: quiz.title || 'Quiz sans titre',
          score: calculatedScore,
          passed: calculatedScore >= passingScore,
          completedAt: new Date().toISOString(),
          courseId: quiz.courseId ? parseInt(quiz.courseId.toString(), 10) : 0,
          courseTitle: quiz.courseTitle ?? `Cours ${quiz.courseId ?? 'inconnu'}`,
          lessonId: 0,
          lessonTitle: 'Leçon du quiz',
          timeSpent: timeSpent ?? 0,
          correctAnswers: correctAnswers,
          totalQuestions: quiz.questions.length,
          passingScore: passingScore
        };
        
        console.log('Résultat calculé localement:', result);
      }
      
      // S'assurer que le score est valide
      const finalScore = typeof result.score === 'number' && !isNaN(result.score) 
        ? Math.min(100, Math.max(0, result.score))
        : 0;
      
      // S'assurer que le nombre de réponses correctes est valide
      const finalCorrectAnswers = typeof result.correctAnswers === 'number' && !isNaN(result.correctAnswers)
        ? Math.max(0, Math.min(result.correctAnswers, result.totalQuestions ?? quiz.questions.length))
        : 0;
      
      // Préparer les données de résultat pour la page de résultats
      const resultData: QuizResult = {
        id: result.id ?? Date.now(),
        quizId: parseInt(quiz.id, 10) || 0,
        quizTitle: quiz.title ?? 'Quiz sans titre',
        score: finalScore,
        passed: result.passed ?? finalScore >= (quiz.settings?.passingScore ?? 70),
        completedAt: result.completedAt ?? new Date().toISOString(),
        courseId: typeof quiz.courseId === 'string' ? parseInt(quiz.courseId, 10) : (quiz.courseId ?? 0),
        courseTitle: 'courseTitle' in quiz ? (quiz.courseTitle ?? `Cours ${quiz.courseId}`) : `Cours ${quiz.courseId}`,
        lessonId: result.lessonId ?? 0,
        lessonTitle: result.lessonTitle ?? 'Leçon du quiz',
        timeSpent: result.timeSpent ?? timeSpent ?? 0,
        correctAnswers: finalCorrectAnswers,
        totalQuestions: result.totalQuestions ?? quiz.questions.length,
        passingScore: result.passingScore ?? quiz.settings?.passingScore ?? 70
      };
      
      console.log('Données finales du résultat à afficher:', resultData);
      
      // Afficher le résultat dans une boîte de dialogue
      console.log('Définition du résultat du quiz:', resultData);
      setQuizResult(resultData);
      setShowResult(true);
      
      // Optionnel: Naviguer vers une page de résultats dédiée
      // navigate(`/etudiant/quiz/${quiz.id}/resultats`, { 
      //   state: { quizResult: resultData } 
      // });
    } catch (error) {
      console.error('Erreur lors de la soumission du quiz:', error);
      toast.error('Erreur lors de la soumission du quiz');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, quiz, answers, timeSpent, startTime, navigate]);
  


  // Vérification si toutes les questions ont une réponse
  const isQuizComplete = useMemo(() => {
    if (!quiz) return false;
    return quiz.questions.every(question => {
      const answer = answers[question.id];
      return answer && 
        (Array.isArray(answer.answer) 
          ? answer.answer.length > 0 
          : Boolean(answer.answer));
    });
  }, [quiz, answers]);

  // Afficher le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>Impossible de charger le quiz demandé.</AlertDescription>
      </Alert>
    );
  }

  // Afficher le quiz en cours
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id] || null;
  const progress = quiz && quiz.questions?.length 
    ? Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">{quiz?.title}</h1>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} sur {quiz?.questions?.length}
          </Badge>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="mt-4 flex justify-between text-sm text-gray-500">
          <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')} restant</span>
          <span>{progress}% complété</span>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{currentQuestion.text}</CardTitle>
          {currentQuestion.description && (
            <CardDescription>{currentQuestion.description}</CardDescription>
          )}
        </CardHeader>
        
        <CardContent>
          <QuizQuestionComponent
            question={currentQuestion}
            currentAnswer={currentAnswer?.answer || null}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          />
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0 || isSubmitting}
            >
              Question précédente
            </Button>
            
            {currentQuestionIndex < (quiz?.questions.length || 1) - 1 ? (
              <Button 
                onClick={goToNextQuestion}
                disabled={isSubmitting}
              >
                Question suivante
              </Button>
            ) : (
              <Button 
                onClick={submitQuiz}
                disabled={isSubmitting || !isQuizComplete}
              >
                {isSubmitting ? 'Soumission...' : 'Soumettre le quiz'}
              </Button>
            )}
          </div>
          
          <div className="w-full">
            <div className="text-sm text-gray-500 text-center">
              Question {currentQuestionIndex + 1} sur {quiz?.questions?.length} • 
              Répondues : {Object.keys(answers).length}/{quiz?.questions?.length}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(Object.keys(answers).length / (quiz?.questions?.length || 1)) * 100}%` }}
              />
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Boîte de dialogue des résultats */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Résultats du quiz</DialogTitle>
            <DialogDescription>
              Vous avez terminé le quiz avec succès. Voici vos résultats.
            </DialogDescription>
          </DialogHeader>
          
          {quizResult && quiz && (
            <div className="space-y-6 py-4">
              {/* En-tête avec statut */}
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  quizResult.passed ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {quizResult.passed ? (
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h3 className={`text-xl font-bold ${
                  quizResult.passed ? 'text-green-600' : 'text-red-600'
                }`}>
                  {quizResult.passed ? 'Quiz réussi !' : 'Quiz échoué'}
                </h3>
                <p className="text-gray-600 mt-1">
                  {quizResult.passed 
                    ? 'Félicitations ! Vous avez réussi ce quiz.' 
                    : 'Vous n\'avez pas atteint le score minimum requis.'}
                </p>
              </div>

              {/* Score principal */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Score obtenu</span>
                  <span className={`text-3xl font-bold ${
                    quizResult.passed ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.round(quizResult.score)}%
                  </span>
                </div>
                
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      quizResult.passed ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, quizResult.score))}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0%</span>
                  <span className="font-medium">
                    Seuil de réussite: {quizResult.passingScore || quiz.settings?.passingScore || 70}%
                  </span>
                  <span>100%</span>
                </div>
              </div>

              {/* Statistiques détaillées */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {quizResult.correctAnswers || Math.round((quizResult.score / 100) * quiz.questions.length)}
                  </div>
                  <div className="text-sm text-blue-700">Réponses correctes</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {quiz.questions.length}
                  </div>
                  <div className="text-sm text-gray-700">Questions totales</div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              {quizResult.timeSpent && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Temps passé: {Math.floor(quizResult.timeSpent / 60)}:{(quizResult.timeSpent % 60).toString().padStart(2, '0')}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowResult(false)}
                >
                  Fermer
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setShowResult(false);
                    navigate(-1);
                  }}
                >
                  Retour aux cours
                </Button>
                {!quizResult.passed && quiz.settings?.allowRetries && (
                  <Button 
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setShowResult(false);
                      window.location.reload();
                    }}
                  >
                    Recommencer
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizPage;
