import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { useToast } from '../../components/ui/use-toast';
import { quizService } from '../../services/quiz.service';
import type { Quiz } from '../../types/quiz';

interface QuizResult {
  id: number;
  quizId: number;
  quizTitle: string;
  score: number;
  passed: boolean;
  completedAt: string;
  courseId: number;
  courseTitle: string;
  lessonId: number;
  lessonTitle: string;
  timeSpent?: number;
}

const QuizResultCard = ({ result }: { result: QuizResult }) => {
  const submittedDate = new Date(result.completedAt);
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{result.quizTitle}</CardTitle>
            <CardDescription className="mt-1">{result.courseTitle}</CardDescription>
          </div>
          <Badge variant={result.passed ? 'success' : 'destructive'}>
            {result.passed ? 'Réussi' : 'Échoué'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Score: {result.score.toFixed(1)}%</span>
            <span className="text-sm font-medium">{result.score.toFixed(1)}% / 100%</span>
          </div>
          <Progress value={result.score} className="h-2" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Date de soumission</p>
            <p className="font-medium">{submittedDate.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Temps passé</p>
            <p className="font-medium">
              {result.timeSpent
                ? `${Math.floor(result.timeSpent / 60)} min ${result.timeSpent % 60} sec`
                : 'Non disponible'}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to={`/etudiant/quiz/${result.quizId}/resultats`}>
            Voir les détails
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

const QuizzesPage = () => {
  const [activeTab, setActiveTab] = useState("disponibles");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const quizzes = await quizService.getAvailableQuizzes();
      setQuizzes(Array.isArray(quizzes) ? quizzes : []);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de récupérer les quiz disponibles.", type: "error" });
      setQuizzes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      setIsLoading(true);
      const results = await quizService.getRecentQuizResults();
      setQuizHistory(Array.isArray(results) ? results : []);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de récupérer l'historique des quiz.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "disponibles") fetchQuizzes();
    else fetchQuizHistory();
  }, [activeTab]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Mes Quiz</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="disponibles">Quiz disponibles</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>
        <TabsContent value="disponibles">
          {isLoading ? (
            <div className="text-center py-8">Chargement des quiz...</div>
          ) : quizzes.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {quizzes.map(quiz => (
                <Card key={quiz.id} className="mb-4 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                    <CardDescription>{quiz.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Cours: {quiz.metadata?.courseName || `Cours ${quiz.courseId}`}</p>
                    <p>Score de passage: {quiz.settings.passingScore}%</p>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to={`/etudiant/quiz/${quiz.id}`}>Commencer le quiz</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">Aucun quiz disponible pour le moment.</div>
          )}
        </TabsContent>
        <TabsContent value="historique">
          {isLoading ? (
            <div className="text-center py-8">Chargement de l'historique...</div>
          ) : quizHistory.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {quizHistory.map(result => (
                <QuizResultCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">Vous n'avez pas encore complété de quiz.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuizzesPage;
