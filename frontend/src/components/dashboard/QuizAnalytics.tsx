import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { QuizAnalytics as QuizAnalyticsType } from '@/types/quiz';

// Composant Skeleton de base pour le chargement
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse space-y-4 ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

interface QuizAnalyticsProps {
  courseId?: string;
  className?: string;
  onError?: (error: Error) => void;
}

// Type pour les données du graphique
type ChartData = Array<{
  name: string;
  score: number;
}>;

export function QuizAnalytics({ courseId, className = '', onError }: QuizAnalyticsProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<QuizAnalyticsType[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizAnalyticsType | null>(null);
  const [chartData, setChartData] = useState<ChartData>([]);

  // Mettre à jour les données du graphique lorsque le quiz sélectionné change
  useEffect(() => {
    if (selectedQuiz) {
      setChartData([
        { name: 'Moyenne', score: selectedQuiz.averageScore },
        { name: 'Taux de complétion', score: selectedQuiz.completionRate },
      ]);
    }
  }, [selectedQuiz]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        
        // En production, utilisez cette ligne pour récupérer les données du serveur
        // const data = courseId ? await quizService.getQuizAnalytics(courseId) : [];
        
        // Données de démonstration
        const mockData: QuizAnalyticsType[] = [
          {
            quizId: '1',
            title: 'Quiz sur React',
            averageScore: 75,
            completionRate: 85,
            attempts: 24,
            questions: [
              {
                id: 'q1',
                text: 'Quelle méthode est utilisée pour rendre un composant React ?',
                correctRate: 92,
                commonMistakes: [
                  { answer: 'ReactDOM.mount()', count: 5 },
                  { answer: 'React.render()', count: 3 }
                ]
              },
              {
                id: 'q2',
                text: 'Quel hook est utilisé pour les effets secondaires ?',
                correctRate: 88,
                commonMistakes: [
                  { answer: 'useState', count: 8 },
                  { answer: 'useContext', count: 2 }
                ]
              }
            ]
          },
          {
            quizId: '2',
            title: 'Quiz sur TypeScript',
            averageScore: 82,
            completionRate: 78,
            attempts: 18,
            questions: [
              {
                id: 'q1',
                text: 'Comment définir un type personnalisé en TypeScript ?',
                correctRate: 85,
                commonMistakes: [
                  { answer: 'class', count: 6 },
                  { answer: 'var', count: 2 }
                ]
              }
            ]
          }
        ];
        
        setAnalytics(mockData);
        setSelectedQuiz(mockData[0]);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
        console.error('Erreur lors du chargement des analyses de quiz:', err);
        setError('Impossible de charger les données des quiz: ' + errorMessage);
        
        // Appeler le gestionnaire d'erreur parent si fourni
        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [courseId, onError]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-64 w-full bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analyse des quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedQuiz) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Analyse des quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Aucune donnée de quiz disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gestion du changement de quiz sélectionné
  const handleQuizChange = (quizId: string) => {
    const quiz = analytics.find(q => q.quizId === quizId);
    if (quiz) {
      setSelectedQuiz(quiz);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Analyse des quiz
        </CardTitle>
        {analytics.length > 1 && (
          <select 
            className="text-sm bg-background border rounded-md px-2 py-1"
            value={selectedQuiz?.quizId || ''}
            onChange={(e) => handleQuizChange(e.target.value)}
          >
            {analytics.map((quiz) => (
              <option key={quiz.quizId} value={quiz.quizId}>
                {quiz.title}
              </option>
            ))}
          </select>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Score']} 
                  labelFormatter={(label) => <span className="text-sm">{label}</span>}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="score" 
                  name="Score"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Détails du quiz</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Moyenne de la classe</p>
                <p className="font-medium">{selectedQuiz.averageScore}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Taux de complétion</p>
                <p className="font-medium">{selectedQuiz.completionRate}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Tentatives</p>
                <p className="font-medium">{selectedQuiz.attempts}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Questions</h4>
            <div className="space-y-4">
              {selectedQuiz.questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <p className="text-sm">{question.text}</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${question.correctRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {question.correctRate}% de réussite
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
