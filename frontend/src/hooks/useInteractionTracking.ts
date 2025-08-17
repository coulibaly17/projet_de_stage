import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { interactionService } from '../services/interaction.service';
import type { PageViewParams } from '../services/interaction.service';

export const useInteractionTracking = () => {
  const location = useLocation();

  // Suivi des vues de page
  useEffect(() => {
    const trackPageView = async () => {
      const pageViewParams: PageViewParams = {
        path: location.pathname,
        title: document.title,
      };
      await interactionService.trackPageView(pageViewParams);
    };

    trackPageView();
  }, [location]);

  // Fonction pour suivre les clics
  const trackClick = useCallback(
    async (element: string, metadata: Record<string, any> = {}) => {
      await interactionService.trackClick(element, {
        ...metadata,
        page: window.location.pathname,
      });
    },
    []
  );

  // Fonction pour suivre les vues de cours
  const trackCourseView = useCallback(
    async (courseId: number, metadata: Record<string, any> = {}) => {
      await interactionService.trackCourseView(courseId, {
        ...metadata,
        referrer: document.referrer,
      });
    },
    []
  );

  // Fonction pour suivre la complétion de leçon
  const trackLessonCompletion = useCallback(
    async (lessonId: number, courseId: number, score?: number) => {
      await interactionService.trackLessonCompletion(lessonId, courseId, score);
    },
    []
  );

  return {
    trackClick,
    trackCourseView,
    trackLessonCompletion,
  };
};
