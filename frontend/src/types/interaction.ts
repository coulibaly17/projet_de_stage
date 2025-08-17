export type EntityType = 
  | 'course' 
  | 'lesson' 
  | 'module' 
  | 'quiz' 
  | 'page' 
  | 'ui_element' 
  | 'resource' 
  | 'user' 
  | string;

export type InteractionType = 
  | 'view' 
  | 'click' 
  | 'complete' 
  | 'start' 
  | 'pause' 
  | 'resume' 
  | 'search' 
  | 'download' 
  | 'like' 
  | 'dislike' 
  | 'share' 
  | 'comment' 
  | 'enroll' 
  | 'unenroll' 
  | 'rate' 
  | 'bookmark' 
  | 'custom' 
  | string;

export interface UserInteraction {
  id: string;
  userId: string;
  entityType: EntityType;
  entityId: string | number;
  interactionType: InteractionType;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface PageViewInteraction extends Omit<UserInteraction, 'interactionType'> {
  interactionType: 'view';
  metadata: {
    path: string;
    title: string;
    referrer?: string;
    user_agent?: string;
    screen_resolution?: string;
    language?: string;
    [key: string]: any;
  };
}

export interface ClickInteraction extends Omit<UserInteraction, 'interactionType'> {
  interactionType: 'click';
  metadata: {
    element: string;
    page: string;
    [key: string]: any;
  };
}

export interface CourseViewInteraction extends Omit<UserInteraction, 'interactionType'> {
  entityType: 'course';
  interactionType: 'view';
  metadata: {
    course_id: number;
    course_title?: string;
    referrer?: string;
    [key: string]: any;
  };
}

export interface LessonCompletionInteraction extends Omit<UserInteraction, 'interactionType'> {
  entityType: 'lesson';
  interactionType: 'complete';
  metadata: {
    course_id: number;
    lesson_id: number;
    lesson_title?: string;
    score?: number;
    completed_at: string;
    [key: string]: any;
  };
}

export type AnyInteraction = 
  | UserInteraction 
  | PageViewInteraction 
  | ClickInteraction 
  | CourseViewInteraction 
  | LessonCompletionInteraction;
