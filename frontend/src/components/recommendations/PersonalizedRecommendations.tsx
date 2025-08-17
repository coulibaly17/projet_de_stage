import React from 'react';
import { useRecommendations } from '../../hooks/useRecommendations';
import { CourseCard } from '../courses/CourseCard';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Recommendation } from '../../services/recommendation.service';

interface PersonalizedRecommendationsProps {
  limit?: number;
  type?: 'personalized' | 'popular' | 'similar';
  courseId?: string;
  title?: string;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({ 
  limit = 5, 
  type = 'personalized',
  courseId,
  title = 'Recommandé pour vous'
}) => {
  const { data: recommendations = [], loading, error, refresh, sendFeedback } = 
    useRecommendations({ limit, type, courseId });

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">
          Erreur lors du chargement des recommandations.
          <Button variant="ghost" size="sm" onClick={refresh} className="ml-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucune recommandation disponible pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Button variant="ghost" size="sm" onClick={refresh}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {(recommendations as Recommendation[]).map((rec: Recommendation) => (
          <div key={rec.id || rec.course.id} className="relative group">
            <CourseCard course={rec.course} />
            <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-green-50 dark:hover:bg-green-900/30"
                onClick={() => sendFeedback(rec.id || rec.course.id, true)}
                title="J'aime cette recommandation"
              >
                <ThumbsUp className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/30"
                onClick={() => sendFeedback(rec.id || rec.course.id, false)}
                title="Je n'aime pas cette recommandation"
              >
                <ThumbsDown className="h-4 w-4 text-red-600" />
              </Button>
            </div>
            {rec.reason && (
              <div className="mt-1 text-xs text-muted-foreground line-clamp-1 px-1">
                {rec.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
