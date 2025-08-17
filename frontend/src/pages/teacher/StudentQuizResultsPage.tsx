import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3
} from 'lucide-react';

interface QuizResult {
  id: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
  duration: number; // en minutes
  status: 'completed' | 'failed' | 'excellent';
  questions: {
    total: number;
    correct: number;
    incorrect: number;
  };
}

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function StudentQuizResultsPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentQuizResults = async () => {
      if (!studentId) {
        setError('ID étudiant manquant');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Simulation avec des données fictives
        // Dans un vrai projet, vous feriez des appels API ici
        const mockStudent: StudentInfo = {
          id: studentId,
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean.dupont@example.com'
        };

        const mockResults: QuizResult[] = [
          {
            id: '1',
            quizTitle: 'Quiz Mathématiques - Algèbre',
            score: 18,
            maxScore: 20,
            percentage: 90,
            completedAt: '2024-01-15T14:30:00Z',
            duration: 25,
            status: 'excellent',
            questions: { total: 20, correct: 18, incorrect: 2 }
          },
          {
            id: '2',
            quizTitle: 'Quiz Physique - Mécanique',
            score: 14,
            maxScore: 20,
            percentage: 70,
            completedAt: '2024-01-12T10:15:00Z',
            duration: 30,
            status: 'completed',
            questions: { total: 20, correct: 14, incorrect: 6 }
          },
          {
            id: '3',
            quizTitle: 'Quiz Chimie - Atomes et molécules',
            score: 8,
            maxScore: 15,
            percentage: 53,
            completedAt: '2024-01-10T16:45:00Z',
            duration: 20,
            status: 'failed',
            questions: { total: 15, correct: 8, incorrect: 7 }
          },
          {
            id: '4',
            quizTitle: 'Quiz Mathématiques - Géométrie',
            score: 19,
            maxScore: 20,
            percentage: 95,
            completedAt: '2024-01-08T11:20:00Z',
            duration: 28,
            status: 'excellent',
            questions: { total: 20, correct: 19, incorrect: 1 }
          }
        ];

        setStudent(mockStudent);
        setQuizResults(mockResults);
      } catch (err) {
        console.error('Erreur lors de la récupération des résultats:', err);
        setError('Impossible de charger les résultats des quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentQuizResults();
  }, [studentId]);

  const getStatusBadge = (status: string, percentage: number) => {
    if (percentage >= 80) {
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    } else if (percentage >= 60) {
      return <Badge className="bg-blue-100 text-blue-800">Réussi</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Échec</Badge>;
    }
  };

  const calculateAverageScore = () => {
    if (quizResults.length === 0) return 0;
    const total = quizResults.reduce((sum, result) => sum + result.percentage, 0);
    return Math.round(total / quizResults.length);
  };

  const getSuccessRate = () => {
    if (quizResults.length === 0) return 0;
    const passed = quizResults.filter(result => result.percentage >= 60).length;
    return Math.round((passed / quizResults.length) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Chargement des résultats...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-red-500">{error || 'Étudiant non trouvé'}</p>
        <Button onClick={() => navigate('/enseignant/etudiants')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Bouton retour */}
        <Button 
          onClick={() => navigate('/enseignant/etudiants')} 
          variant="outline" 
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la liste des étudiants
        </Button>

        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Résultats des quiz - {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-600">{student.email}</p>
          </div>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{quizResults.length}</p>
                  <p className="text-sm text-gray-600">Quiz complétés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{calculateAverageScore()}%</p>
                  <p className="text-sm text-gray-600">Score moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{getSuccessRate()}%</p>
                  <p className="text-sm text-gray-600">Taux de réussite</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(quizResults.reduce((sum, r) => sum + r.duration, 0) / quizResults.length)}min
                  </p>
                  <p className="text-sm text-gray-600">Temps moyen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des résultats */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des quiz</CardTitle>
            <CardDescription>
              Détail de tous les quiz complétés par l'étudiant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quizResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{result.quizTitle}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(result.completedAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {result.duration} min
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(result.status, result.percentage)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.score}/{result.maxScore}
                      </div>
                      <div className="text-sm text-gray-600">Score obtenu</div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {result.percentage}%
                      </div>
                      <div className="text-sm text-gray-600">Pourcentage</div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          {result.questions.correct}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">Bonnes réponses</div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-lg font-bold text-red-600">
                          {result.questions.incorrect}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">Mauvaises réponses</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
