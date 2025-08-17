import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { dashboardService } from '@/services/dashboard.service';
// Composants UI
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { formatDuration } from '@/utils/formatters';

// Interface pour le résultat du quiz
interface QuizResultData {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  passed: boolean;
  completedAt: string;
  courseId?: string;
  courseTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  timeSpent?: number;
  correctAnswers: number;
  totalQuestions: number;
  passingScore?: number;
  answers?: Array<{
    question_id: number;
    question_text: string;
    selected_option_id?: number;
    selected_option_text?: string;
    answer_text?: string;
    is_correct: boolean;
    correct_option_text?: string;
  }>;
}

// Fonction utilitaire pour normaliser les données du quiz
const normalizeQuizData = (data: any, quizId: string): QuizResultData => {
  return {
    id: data.id?.toString() ?? '',
    quizId: data.quizId?.toString() ?? quizId,
    quizTitle: data.quizTitle ?? 'Quiz sans titre',
    score: data.score ?? 0,
    passed: data.passed ?? false,
    correctAnswers: data.correctAnswers ?? 0,
    totalQuestions: data.totalQuestions ?? 0,
    completedAt: data.completedAt ?? new Date().toISOString(),
    courseId: data.courseId?.toString(),
    courseTitle: data.courseTitle,
    lessonId: data.lessonId?.toString(),
    lessonTitle: data.lessonTitle,
    timeSpent: data.timeSpent,
    passingScore: data.passingScore,
    answers: data.answers
  };
};

const QuizResultPage = () => {
  const { id: quizId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // État pour stocker le résultat du quiz
  const [result, setResult] = useState<QuizResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Extraire les résultats de l'état de navigation
  const extractResultFromLocation = useCallback((): QuizResultData | null => {
    // Early return pattern to reduce nesting
    if (!location.state?.result && !window.history.state?.usr?.result) {
      return null;
    }
    
    try {
      // Using optional chaining as suggested by SonarLint
      return location.state?.result ?? window.history.state?.usr?.result ?? null;
    } catch (err) {
      console.error("Erreur lors de l'extraction des résultats:", err);
      return null;
    }
    try {
      // Essayer de récupérer depuis location.state (React Router v6)
      if (location.state?.result) {
        console.log("Résultat récupéré depuis location.state:", location.state.result);
        return location.state.result;
      }
      
      // Essayer de récupérer depuis window.history.state (fallback)
      const historyState = window.history.state?.usr?.result;
      if (historyState) {
        console.log("Résultat récupéré depuis window.history.state:", historyState);
        return historyState;
      }
      
      return null;
    } catch (err) {
      console.error("Erreur lors de l'extraction des résultats:", err);
      return null;
    }
  }, [location.state]);
  
  // Récupérer les résultats du quiz depuis l'API via le service de tableau de bord
  const fetchQuizResultFromApi = useCallback(async (id: string): Promise<QuizResultData> => {
    try {
      console.log(`Tentative de récupération du résultat du quiz avec l'ID: ${id}`);
      
      // Utiliser le service de tableau de bord pour récupérer les détails du résultat
      const result = await dashboardService.getQuizResultDetails(parseInt(id, 10));
      console.log("Détails du résultat du quiz récupérés:", result);
      
      // Convertir le format des données pour correspondre à l'interface QuizResultData
      return {
        id: id,
        quizId: result.quiz_id.toString(),
        quizTitle: result.quiz_title,
        score: result.score,
        passed: result.passed,
        correctAnswers: result.correct_answers,
        totalQuestions: result.total_questions,
        completedAt: result.completed_at,
        answers: result.answers
      };
      
    } catch (err: any) {
      console.error("❌ Erreur lors de la récupération du résultat:", err);
      if (err.message?.includes('404') || err.response?.status === 404) {
        throw new Error("Résultat de quiz introuvable. Il est possible que ce résultat ait été supprimé ou que vous n'ayez pas l'autorisation d'y accéder.");
      }
      throw new Error("Une erreur est survenue lors du chargement des résultats du quiz. Veuillez réessayer plus tard.");
    }
  }, []);

  // Charger les résultats depuis l'état de navigation
  const loadFromNavigationState = useCallback((): boolean => {
    const submittedResult = extractResultFromLocation();
    
    if (submittedResult) {
      console.log("📥 Résultat récupéré depuis la navigation:", submittedResult);
      // Utiliser la fonction de normalisation pour assurer la cohérence des données
      setResult(normalizeQuizData(submittedResult, submittedResult.quizId || ''));
      return true;
    }
    return false;
  }, [extractResultFromLocation]);

  // Charger les résultats depuis l'API
  const loadFromApi = useCallback(async (): Promise<boolean> => {
    if (!quizId) {
      throw new Error("Aucun identifiant de quiz spécifié. Veuillez réessayer en accédant à la page à partir de votre historique de quiz.");
    }

    console.log("🔍 Tentative de récupération depuis l'API pour l'ID:", quizId);
    try {
      const apiResult = await fetchQuizResultFromApi(quizId);
      
      if (!apiResult) {
        throw new Error("Aucun résultat de quiz trouvé pour cet identifiant");
      }

      console.log("📊 Données brutes de l'API:", apiResult);
      const normalizedResult = normalizeQuizData(apiResult, quizId);
      setResult(normalizedResult);
      return true;
    } catch (error) {
      console.error("Erreur lors du chargement depuis l'API:", error);
      throw error; // Propager l'erreur pour qu'elle soit gérée par le composant parent
    }
  }, [quizId, fetchQuizResultFromApi]);

  // Charger les résultats du quiz
  useEffect(() => {
    const loadQuizResult = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Try to load from navigation state first
      if (loadFromNavigationState()) {
        return;
      }
      
      // 2. If not found, try loading from API
      await loadFromApi();
    } catch (err) {
      console.error("❌ Erreur lors du chargement du résultat du quiz:", err);
      const errorMessage = err instanceof Error ? err : new Error("Une erreur inconnue s'est produite");
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
    
    loadQuizResult();
  }, [loadFromNavigationState, loadFromApi]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement des résultats du quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Erreur lors du chargement des résultats</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error?.message || 'Une erreur inconnue est survenue'}</p>
            <p className="text-sm text-muted-foreground">
              Si le problème persiste, veuillez contacter le support technique.
            </p>
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/mes-cours')}
            className="w-full sm:w-auto"
          >
            Retour à mes cours
          </Button>
          <Button 
            variant="primary"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-5 w-5 mr-2" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Aucun résultat de quiz n'a été trouvé. Veuillez compléter un quiz d'abord.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/mes-cours')}
            className="mr-4"
          >
            Retour à mes cours
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Fonction utilitaire pour générer le message de résultat
  const getResultMessage = (passed: boolean, passingScore: number, score: number): string => {
    if (passed) {
      return 'Vous avez réussi ce quiz avec succès. Continuez ainsi !';
    }
    
    const scoreDiff = passingScore && score != null 
      ? Math.abs(passingScore - score).toFixed(1)
      : '0';
      
    return `Vous étiez à ${scoreDiff}% du score de passage. Vous ferez mieux la prochaine fois !`;
  };

  // S'assurer que le pourcentage est un nombre valide
  const percentage = (result.score ?? 0) > 0 ? result.score : 0;
  const isPassed = result.passed;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="overflow-hidden">
        <div className={`p-6 text-white ${isPassed ? 'bg-green-600' : 'bg-red-600'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Résultats du quiz</h1>
              <p className="text-white/90">{result.quizTitle}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{percentage}%</div>
              <Badge variant={isPassed ? 'success' : 'destructive'} className="text-sm mt-1">
                {isPassed ? 'Réussi' : 'Échoué'}
              </Badge>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="grid gap-6">
            {/* Résumé rapide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary">{result.correctAnswers ?? 0}</div>
                <div className="text-sm text-muted-foreground">Réponses correctes</div>
                <div className="text-xs mt-1">sur {result.totalQuestions ?? 0} questions</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary">
                  {result.timeSpent != null && !isNaN(result.timeSpent) ? formatDuration(result.timeSpent) : '--:--'}
                </div>
                <div className="text-sm text-muted-foreground">Temps passé</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-primary">{result.passingScore != null && !isNaN(result.passingScore) ? result.passingScore : 60}%</div>
                <div className="text-sm text-muted-foreground">Score de passage</div>
              </div>
            </div>
            
            <Separator />
            
            {/* Détails du cours */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Détails du cours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cours</p>
                  <p className="font-medium">{result.courseTitle || 'Cours non spécifié'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Leçon</p>
                  <p className="font-medium">{result.lessonTitle || 'Leçon non spécifiée'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date de complétion</p>
                  <p className="font-medium">
                    {result.completedAt && !isNaN(new Date(result.completedAt).getTime()) 
                      ? new Date(result.completedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Date non disponible'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <div className="flex items-center">
                    {isPassed ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-1.5" />
                    )}
                    <span className="font-medium">
                      {isPassed ? 'Quiz réussi' : 'Quiz échoué'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Message de félicitations ou d'encouragement */}
            <div className={`p-4 rounded-lg ${isPassed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {isPassed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${isPassed ? 'text-green-800 dark:text-green-200' : 'text-yellow-800 dark:text-yellow-200'}`}>
                    {isPassed ? 'Félicitations !' : 'Presque là !'}
                  </h3>
                  <div className={`mt-1 text-sm ${isPassed ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                  {getResultMessage(isPassed, result.passingScore ?? 60, percentage)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/mes-cours')}
                className="w-full sm:w-auto"
              >
                Retour aux cours
              </Button>
              <Button 
                onClick={() => navigate(`/quiz/${result.quizId}`)}
                className="w-full sm:w-auto"
              >
                Refaire le quiz
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResultPage;
