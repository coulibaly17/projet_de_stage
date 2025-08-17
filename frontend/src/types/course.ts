export interface Lesson {
  id: number;
  title: string;
  description?: string;
  content?: string;
  video_url?: string;
  duration?: number;
  order_index: number;
  is_completed?: boolean;
  completion_percentage?: number;
  last_accessed?: string | null;
}

export interface Module {
  id: number;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
  completed_lessons?: number;
  total_lessons?: number;
}

export interface CourseProgress {
  course_id: number;
  course_title: string;
  progress_percentage: number;
  is_completed: boolean;
  modules: Module[];
}

export interface CourseProgressSummary {
  course_id: number;
  course_title: string;
  thumbnail_url: string | null;
  progress_percentage: number;
  is_completed: boolean;
  completed_lessons: number;
  total_lessons: number;
  last_accessed: string | null;
}

export interface UpdateProgressPayload {
  is_completed: boolean;
  completion_percentage?: number;
}
