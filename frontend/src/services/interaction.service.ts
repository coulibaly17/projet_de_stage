import { apiService } from './api';
import type { EntityType, InteractionType } from '../types/interaction';

export interface TrackInteractionParams {
  entityType: EntityType;
  entityId: number;
  interactionType: InteractionType;
  metadata?: Record<string, any>;
}

export interface PageViewParams {
  path: string;
  title: string;
  referrer?: string;
}

class InteractionService {
  async trackInteraction(params: TrackInteractionParams) {
    try {
      return await apiService.post('/interactions/track', {
        entity_type: params.entityType,
        entity_id: params.entityId,
        interaction_type: params.interactionType,
        metadata: params.metadata
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  async trackPageView(params: PageViewParams) {
    return this.trackInteraction({
      entityType: 'page',
      entityId: 0,
      interactionType: 'view',
      metadata: {
        path: params.path,
        title: params.title,
        referrer: params.referrer || document.referrer,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language
      }
    });
  }

  async trackClick(element: string, metadata: Record<string, any> = {}) {
    return this.trackInteraction({
      entityType: 'ui_element',
      entityId: 0,
      interactionType: 'click',
      metadata: {
        element,
        ...metadata
      }
    });
  }

  async trackCourseView(courseId: number, metadata: Record<string, any> = {}) {
    return this.trackInteraction({
      entityType: 'course',
      entityId: courseId,
      interactionType: 'view',
      metadata
    });
  }

  async trackLessonCompletion(lessonId: number, courseId: number, score?: number) {
    return this.trackInteraction({
      entityType: 'lesson',
      entityId: lessonId,
      interactionType: 'complete',
      metadata: {
        course_id: courseId,
        score,
        completed_at: new Date().toISOString()
      }
    });
  }
}

export const interactionService = new InteractionService();
