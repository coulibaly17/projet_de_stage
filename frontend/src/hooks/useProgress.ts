import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface CourseProgress {
  currentLessonId: string | null;
  progress: number;
  lastWatchedTime: number;
  isCompleted: boolean;
}

export const useProgress = (courseId: string) => {
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simuler l'appel API
      const response = await fetch(`/api/courses/${courseId}/progress`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement de la progression');
      }
      const data = await response.json();
      setProgress(data);
    } catch (err) {
      console.error('Erreur lors du chargement de la progression:', err);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const updateProgress = useCallback(async (newProgress: CourseProgress) => {
    try {
      // Simuler l'appel API
      const response = await fetch(`/api/courses/${courseId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProgress),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la progression');
      }

      setProgress(newProgress);
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la progression:', err);
      throw err;
    }
  }, [courseId]);

  useEffect(() => {
    if (user && courseId) {
      fetchProgress();
    }
  }, [user, courseId, fetchProgress]);

  return { progress, updateProgress, isLoading };
};
