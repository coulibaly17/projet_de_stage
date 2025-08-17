import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ClipboardCheck, 
  Search, 
  PlusCircle, 
  MoreVertical, 
  Copy, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3,
  Clock,
  Users,
  Plus,
  AlertTriangle,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { quizService } from '@/services';
import { courseService } from '@/services/course.service';
import type { Quiz } from '@/services/quiz.service';

// Extension de l'interface Quiz pour ajouter les propriétés manquantes
interface ExtendedTeacherQuiz extends Quiz {
  courseName?: string;
  dueDate?: string;
  timeLimit?: number;
  passingScore?: number;
  status?: 'draft' | 'published' | 'closed';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Fonction utilitaire pour le message d'absence de quiz
const getNoQuizMessage = (searchQuery: string, activeTab: string) => {
  if (searchQuery) return "Aucun quiz ne correspond à votre recherche.";
  
  switch (activeTab) {
    case 'draft':
      return "Vous n'avez pas de quiz en brouillon.";
    case 'published':
      return "Vous n'avez pas de quiz publiés.";
    case 'closed':
      return "Vous n'avez pas de quiz fermés.";
    default:
      return "Vous n'avez pas encore créé de quiz.";
  }
};

export default function QuizzesPage() {
  const location = useLocation();
  const [quizzes, setQuizzes] = useState<ExtendedTeacherQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [hasTeacherCourses, setHasTeacherCourses] = useState<boolean>(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [quizToDelete, setQuizToDelete] = useState<{id: string, title: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishingQuizId, setPublishingQuizId] = useState<string | null>(null);


  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null); // Réinitialiser les erreurs précédentes
      
      // Utiliser le service de quiz pour récupérer les quiz
      const teacherQuizzes = await quizService.getTeacherQuizzes();
      
      // Afficher les identifiants des quiz pour débogage
      console.log("Quiz IDs:", teacherQuizzes.map((quiz: Quiz) => quiz.id));
      console.log("Quiz complets:", teacherQuizzes);
      
      if (teacherQuizzes.length === 0) {
        console.log("Aucun quiz trouvé pour cet enseignant");
      }
      
      // Convertir les Quiz en ExtendedTeacherQuiz et s'assurer que chaque quiz a un ID valide
      const extendedQuizzes: ExtendedTeacherQuiz[] = teacherQuizzes.map((quiz: Quiz, index: number) => {
        // Vérifier si le quiz a déjà un ID valide
        let quizId = quiz.id;
        
        // Si l'ID est manquant ou invalide, utiliser l'index comme ID temporaire
        if (!quizId || quizId === '') {
          console.warn(`Quiz sans ID détecté à l'index ${index}, utilisation d'un ID temporaire`);
          quizId = `${index + 1}`; // Utiliser des IDs simples (1, 2, 3) pour les quiz sans ID
        }
        
        return {
          ...quiz,
          id: quizId,
          courseName: quiz.title.includes(':') ? quiz.title.split(':')[0].trim() : 'Cours général',
        };
      });
      
      setQuizzes(extendedQuizzes);
    } catch (error: any) {
      console.error("Erreur lors de la récupération des quiz:", error);
      
      // Extraire et afficher le message d'erreur
      const statusCode = error?.response?.status;
      let errorMessage = "Impossible de récupérer les quiz. Veuillez réessayer plus tard.";
      
      if (statusCode === 401 || statusCode === 403) {
        errorMessage = "Vous n'avez pas les permissions nécessaires pour accéder aux quiz. Veuillez vous reconnecter.";
      } else if (statusCode === 500) {
        errorMessage = "Erreur serveur. Veuillez contacter l'administrateur.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const checkTeacherCourses = async () => {
    try {
      setCoursesLoading(true);
      const courses = await courseService.getTeacherCourses();
      setHasTeacherCourses(courses.length > 0);
    } catch (error) {
      console.error('Erreur lors de la vérification des cours:', error);
      setHasTeacherCourses(false);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    checkTeacherCourses();
  }, []);

  // Gérer les notifications depuis location.state
  useEffect(() => {
    if (location.state?.notification) {
      setNotification(location.state.notification);
      
      // Si c'est une notification de succès, recharger les données
      if (location.state.notification.type === 'success') {
        console.log('🔄 Rechargement des quiz après modification réussie');
        fetchQuizzes();
      }
      
      // Effacer la notification après 5 secondes
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;
    
    setIsDeleting(true);
    try {
      await quizService.deleteQuiz(quizToDelete.id);
      
      // Mettre à jour l'état local pour supprimer le quiz de la liste
      setQuizzes(quizzes.filter(q => q.id !== quizToDelete.id));
      
      // Fermer la boîte de dialogue avant d'afficher la notification
      setQuizToDelete(null);
      
      // Afficher un message de succès
      toast.success('Le quiz a été supprimé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la suppression du quiz:', error);
      toast.error(error.message || 'Une erreur est survenue lors de la suppression du quiz');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (quiz: ExtendedTeacherQuiz) => {
    setQuizToDelete({
      id: quiz.id || '',
      title: quiz.title
    });
  };

  const handleTogglePublication = async (quiz: ExtendedTeacherQuiz) => {
    try {
      setPublishingQuizId(quiz.id);
      
      // Déterminer le nouveau statut (inverse du statut actuel)
      const newIsPublished = quiz.status !== 'published';
      
      // Appeler l'API pour changer le statut
      const result = await quizService.toggleQuizPublication(quiz.id, newIsPublished);
      
      // Mettre à jour le quiz localement
      setQuizzes(prevQuizzes => 
        prevQuizzes.map(q => 
          q.id === quiz.id 
            ? { ...q, status: newIsPublished ? 'published' : 'draft', isPublished: newIsPublished }
            : q
        )
      );
      
      // Afficher une notification de succès
      setNotification({
        type: 'success',
        message: result.message ?? `Quiz ${newIsPublished ? 'publié' : 'dépublié'} avec succès`
      });
      
      // Effacer la notification après 3 secondes
      setTimeout(() => setNotification(null), 3000);
      
    } catch (error: any) {
      console.error('Erreur lors de la publication/dépublication:', error);
      setNotification({
        type: 'error',
        message: error.message ?? 'Erreur lors de la modification du statut du quiz'
      });
      
      // Effacer la notification d'erreur après 5 secondes
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setPublishingQuizId(null);
    }
  };

  const filteredQuizzes = quizzes.filter((quiz: ExtendedTeacherQuiz) => {
    if (activeTab === 'draft' && quiz.status !== 'draft') return false;
    if (activeTab === 'published' && quiz.status !== 'published') return false;
    if (activeTab === 'closed' && quiz.status !== 'closed') return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        quiz.title.toLowerCase().includes(query) ||
        quiz.courseName?.toLowerCase().includes(query) ||
        quiz.description?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {notification && (
        <Alert variant={notification.type === 'success' ? 'default' : 'destructive'} className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{notification.type === 'success' ? 'Succès' : 'Erreur'}</AlertTitle>
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Quiz</h1>
        <div className="flex items-center gap-2">
          <Button asChild className="mr-2">
            <Link to="/enseignant/quiz/nouveau">
              <Plus className="h-4 w-4 mr-2" />
              Créer un quiz
            </Link>
          </Button>
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {hasTeacherCourses ? (
            <Button asChild>
              <Link to="/enseignant/quiz/nouveau">
                <PlusCircle className="h-4 w-4 mr-2" />
                Créer un quiz
              </Link>
            </Button>
          ) : (
            <Button disabled title="Vous devez avoir au moins un cours pour créer un quiz">
              <PlusCircle className="h-4 w-4 mr-2" />
              Créer un quiz
            </Button>
          )}
        </div>
      </div>

      {/* Message d'information pour les enseignants sans cours */}
      {!coursesLoading && !hasTeacherCourses && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aucun cours assigné</AlertTitle>
          <AlertDescription>
            Vous devez avoir au moins un cours pour créer des quiz. 
            Contactez l'administrateur pour vous assigner un cours.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="draft">Brouillons</TabsTrigger>
          <TabsTrigger value="published">Publiés</TabsTrigger>
          <TabsTrigger value="closed">Fermés</TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <TabsContent value={activeTab} className="mt-0">
            {filteredQuizzes.length === 0 ? (
              <div className="text-center py-10">
                <ClipboardCheck className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-medium">Aucun quiz trouvé</h3>
                <p className="mt-1 text-gray-500">
                  {getNoQuizMessage(searchQuery, activeTab)}
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/enseignant/quiz/nouveau">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Créer un quiz
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuizzes.map((quiz, index) => (
                  <Card key={quiz.id ? quiz.id : `quiz-${index}`} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            <Link to={`/enseignant/quiz/${quiz.id}`} className="hover:underline">
                              {quiz.title}
                            </Link>
                          </CardTitle>
                          <CardDescription className="flex flex-col gap-1">
                            <Link to={`/enseignant/cours/${quiz.courseId}`} className="hover:underline text-blue-600">
                              {quiz.courseName ?? 'Cours non spécifié'}
                            </Link>
                            <span>Créé le {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'Date inconnue'}</span>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/enseignant/quiz/${quiz.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                <span>Aperçu</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/enseignant/quiz/${quiz.id}/modifier`}>
                                <Edit className="h-4 w-4 mr-2" />
                                <span>Modifier</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onSelect={(e) => {
                                e.preventDefault();
                                handleTogglePublication(quiz);
                              }}
                              disabled={publishingQuizId === quiz.id}
                            >
                              {publishingQuizId === quiz.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : quiz.status === 'published' ? (
                                <XCircle className="h-4 w-4 mr-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                              )}
                              <span>
                                {publishingQuizId === quiz.id 
                                  ? 'Modification...' 
                                  : quiz.status === 'published' 
                                    ? 'Dépublier' 
                                    : 'Publier'
                                }
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onSelect={(e) => {
                                e.preventDefault();
                                confirmDelete(quiz);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              <span>Supprimer</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4 text-gray-500" />
                          <span>{quiz.questions.length} questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Durée: {quiz.timeLimit} minutes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>{quiz.metadata?.totalSubmissions ?? 0} soumissions</span>
                        </div>
                        {quiz.metadata?.averageScore !== undefined && quiz.metadata.averageScore !== null && (
                          <div key={`avg-${quiz.id}`} className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-gray-500" />
                            <span>Moyenne: {quiz.metadata.averageScore.toFixed(1)}%</span>
                          </div>
                        )}
                        {quiz.dueDate && (
                          <div key={`due-${quiz.id}`} className="flex items-center gap-2 text-amber-600">
                            <Clock className="h-4 w-4" />
                            <span>Date limite: {new Date(quiz.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button variant="outline" asChild>
                        <Link to={`/enseignant/quiz/${quiz.id}`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>
                      </Button>
                      {quiz.status === 'published' && (
                        <Button key={`results-${quiz.id}`} variant="outline" asChild>
                          <Link to={`/enseignant/quiz/${quiz.id}/resultats`}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Résultats
                          </Link>
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Boîte de dialogue de confirmation de suppression */}
      <Dialog open={!!quizToDelete} onOpenChange={(open: boolean) => !open && setQuizToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Êtes-vous sûr de vouloir supprimer ce quiz ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le quiz "{quizToDelete?.title}" et toutes les données associées seront définitivement supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setQuizToDelete(null)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button 
              variant="primary"
              onClick={handleDeleteQuiz}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer définitivement'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
