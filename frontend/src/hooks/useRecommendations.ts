import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  Recommendation, 
  PopularRecommendation, 
  SimilarContentRecommendation 
} from '../services/recommendation.service';
import { recommendationService } from '../services/recommendation.service';
import { useInteractionTracking } from './useInteractionTracking';

interface UseRecommendationsOptions {
  limit?: number;
  enabled?: boolean;
  type?: 'personalized' | 'popular' | 'similar';
  courseId?: string; // Required for 'similar' type
}

export const useRecommendations = (options: UseRecommendationsOptions = {}) => {
  const { 
    limit = 5, 
    enabled = true,
    type = 'personalized',
    courseId
  } = options;

  const [data, setData] = useState<Recommendation[] | PopularRecommendation[] | SimilarContentRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { trackClick } = useInteractionTracking();

  const fetchRecommendations = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      let result;
      
      switch (type) {
        case 'popular':
          result = await recommendationService.getPopularRecommendations(limit);
          break;
          
        case 'similar':
          if (!courseId) {
            throw new Error('courseId is required for similar recommendations');
          }
          result = await recommendationService.getSimilarContent(courseId, limit);
          break;
          
        case 'personalized':
        default:
          result = await recommendationService.getPersonalizedRecommendations(limit);
      }
      
      setData(result);
      setLastUpdated(new Date());
      return result;
      
    } catch (err) {
      console.error(`Error fetching ${type} recommendations:`, err);
      setError(err instanceof Error ? err : new Error(`Failed to fetch ${type} recommendations`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enabled, limit, type, courseId]);

  const sendFeedback = useCallback(async (recommendationId: string, isPositive: boolean) => {
    try {
      await recommendationService.sendFeedback(recommendationId, isPositive);
      
      // Enregistrer le feedback dans les interactions
      await trackClick('recommendation_feedback', {
        recommendation_id: recommendationId,
        feedback: isPositive ? 'positive' : 'negative',
      });

      // Recharger les recommandations
      await fetchRecommendations();
    } catch (err) {
      console.error('Error sending feedback:', err);
      throw err;
    }
  }, [fetchRecommendations, trackClick]);

  // Charger les recommandations au montage
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Utilisation de useMemo pour optimiser les rendus
  return useMemo(() => ({
    data,
    loading,
    error,
    lastUpdated,
    refresh: fetchRecommendations,
    sendFeedback,
    isStale: lastUpdated ? (Date.now() - lastUpdated.getTime()) > 5 * 60 * 1000 : true
  }), [data, loading, error, lastUpdated, fetchRecommendations, sendFeedback]);
};
