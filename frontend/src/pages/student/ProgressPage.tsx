import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { courseService } from '../../services/course.service';
import type { CourseProgressSummary } from '../../types/course';

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<CourseProgressSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const data = await courseService.getUserProgressSummary();
        setProgressData(data);
      } catch (err) {
        console.error('Erreur lors du chargement de la progression:', err);
        setError('Impossible de charger les données de progression. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Ma progression</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur ! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ma progression</h1>
      </div>

      {progressData.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune progression enregistrée</h3>
          <p className="mt-1 text-gray-500">Commencez un cours pour suivre votre progression.</p>
          <div className="mt-6">
            <Button onClick={() => navigate('/cours')}>
              Parcourir les cours <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {progressData.map((course) => (
            <Card key={course.course_id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{course.course_title}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="mr-1 h-4 w-4" />
                      <span>{course.completed_lessons} leçons sur {course.total_lessons} terminées</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {course.is_completed && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Terminé
                      </span>
                    )}
                    <span className="text-sm font-medium">
                      {Math.round(course.progress_percentage)}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                <div className="mb-2">
                  <Progress value={course.progress_percentage} className="h-2" />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/cours/${course.course_id}`)}
                  >
                    Continuer <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
