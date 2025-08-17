import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
// @ts-ignore - Ignoring TypeScript error for table component
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useToast } from '../../components/ui/use-toast';
import { quizService } from '../../services/quiz.service';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaArrowLeft, FaEye, FaFilter, FaRedo, FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa';
import { cn } from '../../lib/utils';

interface QuizResultHistory {
  id: number;
  quizId: number;
  quizTitle: string;
  score: number;
  passed: boolean;
  completedAt: string;
  lessonTitle: string;
  courseTitle: string;
  courseId: number;
}

const QuizResultsHistoryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResultHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortField, setSortField] = useState<string>('completedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterPassed, setFilterPassed] = useState<string>('all');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        if (user?.id) {
          console.log('Récupération des résultats pour l\'utilisateur:', user.id);
          // Appel à l'API pour récupérer l'historique des résultats
          // @ts-ignore - Ignoring TypeScript error due to duplicate method definitions in quiz.service.ts
          const response = await quizService.getStudentQuizResults();
          console.log('Réponse reçue:', response);
          
          if (Array.isArray(response)) {
            setResults(response as unknown as QuizResultHistory[]);
            console.log('Résultats chargés avec succès:', response.length);
          } else {
            console.error('Format de réponse invalide:', response);
            toast({
              title: "Erreur de format",
              description: "Le format des données reçues est invalide",
              variant: "destructive",
            });
          }
        } else {
          console.warn('Aucun ID utilisateur disponible');
          toast({
            title: "Erreur d'authentification",
            description: "Veuillez vous connecter pour voir vos résultats",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Erreur lors de la récupération des résultats:", error);
        toast({
          title: "Erreur",
          description: error?.message || "Impossible de récupérer votre historique de résultats",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user?.id, toast]);

  // Fonction pour trier les résultats
  const sortResults = (a: QuizResultHistory, b: QuizResultHistory) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'quizTitle':
        comparison = a.quizTitle.localeCompare(b.quizTitle);
        break;
      case 'courseTitle':
        comparison = a.courseTitle.localeCompare(b.courseTitle);
        break;
      case 'score':
        comparison = a.score - b.score;
        break;
      case 'completedAt':
      default:
        comparison = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  };

  // Fonction pour filtrer les résultats
  const filterResults = (result: QuizResultHistory) => {
    if (filterPassed === 'all') return true;
    return filterPassed === 'passed' ? result.passed : !result.passed;
  };

  // Résultats triés et filtrés
  const filteredResults = results
    .filter(filterResults)
    .sort(sortResults);

  // Fonction pour changer le tri
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch (error) {
      return 'Date invalide';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <Button 
            className="flex items-center gap-2" 
            onClick={() => navigate('/etudiant/quizzes')}
            variant="outline"
          >
            <FaArrowLeft className="mr-1" /> Retour aux quiz
          </Button>
          <h1 className="text-3xl font-bold">Historique des résultats</h1>
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 border-b-2">
              <div className="p-2 flex items-center">
                <h3 className="text-sm font-semibold">Filtrer</h3>
                <div className="ml-2 flex items-center">
                  <FaFilter className="mr-2" />
                  <Select
                    value={filterPassed}
                    onValueChange={(value) => setFilterPassed(value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les résultats</SelectItem>
                      <SelectItem value="passed">Quiz réussis</SelectItem>
                      <SelectItem value="failed">Quiz échoués</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            {loading ? (
              <div className="flex justify-center items-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-lg">Aucun résultat trouvé</p>
                <Button
                  className="mt-4"
                  onClick={() => navigate('/etudiant/quizzes')}
                >
                  Voir les quiz disponibles
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('quizTitle')}>
                        <div className="flex items-center">
                          Quiz
                          {sortField === 'quizTitle' && (
                            <span className="ml-1">{sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('courseTitle')}>
                        <div className="flex items-center">
                          Cours
                          {sortField === 'courseTitle' && (
                            <span className="ml-1">{sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('score')}>
                        <div className="flex items-center">
                          Score
                          {sortField === 'score' && (
                            <span className="ml-1">{sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort('completedAt')}>
                        <div className="flex items-center">
                          Date
                          {sortField === 'completedAt' && (
                            <span className="ml-1">{sortDirection === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}</span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.quizTitle}</TableCell>
                        <TableCell>{result.courseTitle}</TableCell>
                        <TableCell className="font-bold">{Math.round(result.score)}%</TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              "px-2 py-1 rounded-md",
                              result.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            )}
                          >
                            {result.passed ? "Réussi" : "Échoué"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(result.completedAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <div className="relative group">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => navigate(`/etudiant/quiz/${result.quizId}/resultats`)}
                              >
                                <FaEye />
                              </Button>
                              <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -mt-12 -ml-6">Voir les détails</span>
                            </div>
                            <div className="relative group">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-green-600 hover:text-green-800"
                                onClick={() => navigate(`/etudiant/quiz/${result.quizId}`)}
                              >
                                <FaRedo />
                              </Button>
                              <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 -mt-12 -ml-6">Refaire le quiz</span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default QuizResultsHistoryPage;
