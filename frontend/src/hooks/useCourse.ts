import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { Course, Lesson } from '../types/api';

export interface CourseProgress {
  currentLessonId: string | null;
  progress: number;
  lastWatchedTime: number;
  isCompleted: boolean;
}

export const useCourse = (courseId: string) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Simuler l'appel API
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du cours');
        }
        const data = await response.json();
        setCourse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && courseId) {
      fetchCourse();
    }
  }, [courseId, user]);

  return { course, isLoading, error };
};
