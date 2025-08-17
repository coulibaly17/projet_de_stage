import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Edit, 
  BarChart3, 
  Clock, 
  Users, 
  ClipboardCheck,
  AlertCircle
} from 'lucide-react';
import { quizService } from '@/services';
import type { TeacherQuiz } from '@/services/quiz.service';

export default function QuizDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<TeacherQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchQuizDetails = async () => {
      if (!id) {
        setError("ID du quiz non spécifié");
        setLoading(false);
        return;
      }

      // Vérifier que l'ID est valide avant d'appeler l'API
      // On accepte maintenant tout format d'ID que le backend pourrait gérer
      // mais on affiche un avertissement si ce n'est pas un nombre
      if (!/^\d+$/.test(id)) {
        console.warn(`ID de quiz potentiellement invalide: ${id}. Le backend attend généralement un ID numérique.`);
        // On continue quand même, le service de quiz décidera s'il peut traiter cet ID
      }

      try {
        setLoading(true);
        console.log(`Tentative de récupération du quiz avec ID: ${id}`);
        const quizData = await quizService.getQuiz(id);
        console.log("Quiz récupéré avec succès:", quizData);
        setQuiz(quizData as TeacherQuiz);
        setError(null);
      } catch (err) {
        console.error("Erreur lors de la récupération du quiz:", err);
        
        // Gérer les différents types d'erreurs
        if (err instanceof Error) {
          if ((err as any).statusCode === 404) {
            setError(`Le quiz avec l'ID ${id} n'existe pas`);
            // Rediriger vers la liste des quiz après un court délai
            setTimeout(() => {
              navigate('/enseignant/quiz', { 
                state: { 
                  notification: {
                    type: 'error',
                    message: 'Le quiz demandé n\'existe pas ou a été supprimé.'
                  }
                }
              });
            }, 1500);
          } else {
            setError(err.message || "Erreur inconnue");
          }
        } else {
          setError("Impossible de charger les détails du quiz. Veuillez réessayer plus tard.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [id, navigate]);

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Date invalide';
    }
  };

  // Fonction pour obtenir la couleur du badge en fonction du statut
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Fonction pour obtenir le texte du statut en français
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Brouillon';
      case 'published':
        return 'Publié';
      case 'closed':
        return 'Fermé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!quiz) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Quiz non trouvé</AlertTitle>
        <AlertDescription>Le quiz demandé n'existe pas ou a été supprimé.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/enseignant/quiz">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <Badge className={getStatusBadgeColor(quiz.status)}>
            {getStatusText(quiz.status)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to={`/enseignant/quiz/${id}/modifier`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
          {quiz.status === 'published' && (
            <Button variant="outline" asChild>
              <Link to={`/enseignant/quiz/${id}/resultats`}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Résultats
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1">{quiz.description || "Aucune description"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cours associé</h3>
                  <p className="mt-1">{quiz.courseId ? "Cours #" + quiz.courseId : "Aucun cours associé"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="text-sm font-medium">Questions</h3>
                    <p className="text-lg font-semibold">{quiz.questions?.length || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="text-sm font-medium">Durée</h3>
                    <p className="text-lg font-semibold">{quiz.timeLimit} minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="text-sm font-medium">Soumissions</h3>
                    <p className="text-lg font-semibold">{quiz.metadata?.totalSubmissions || 0}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Créé le</h3>
                  <p className="mt-1">{formatDate(quiz.createdAt)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Dernière modification</h3>
                  <p className="mt-1">{formatDate(quiz.updatedAt)}</p>
                </div>
              </div>

              {quiz.metadata?.averageScore !== undefined && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Score moyen</h3>
                  <p className="text-xl font-bold">{quiz.metadata.averageScore.toFixed(1)}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${quiz.metadata.averageScore}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des questions</CardTitle>
            </CardHeader>
            <CardContent>
              {quiz.questions && quiz.questions.length > 0 ? (
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => (
                    <div key={question.id || index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">Question {index + 1}</p>
                          <p className="mt-1">{question.text}</p>
                        </div>
                        <Badge>{question.type}</Badge>
                      </div>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-500">Options:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {question.options.map((option, optIndex) => (
                              <li key={optIndex} className="text-sm">
                                {option.text}
                                {question.correctAnswers?.includes(option.id) && (
                                  <span className="text-green-600 ml-2">(Correcte)</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>Aucune question dans ce quiz.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du quiz</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Note de passage</h3>
                  <p className="mt-1">{quiz.passingScore}%</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Limite de temps</h3>
                  <p className="mt-1">{quiz.timeLimit} minutes</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Afficher les résultats</h3>
                  <p className="mt-1">{quiz.settings?.showResults ? "Oui" : "Non"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Autoriser les tentatives multiples</h3>
                  <p className="mt-1">{quiz.settings?.allowRetries ? "Oui" : "Non"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Mélanger les questions</h3>
                  <p className="mt-1">{quiz.settings?.shuffleQuestions ? "Oui" : "Non"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Mélanger les réponses</h3>
                  <p className="mt-1">{quiz.settings?.shuffleAnswers ? "Oui" : "Non"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
