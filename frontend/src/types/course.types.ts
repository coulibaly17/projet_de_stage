export interface User {
  id: number;
  name: string;
  avatar?: string;
  email: string;
}

export interface Lesson {
  id: number | string;
  title: string;
  description?: string;
  content?: string;
  video_url?: string;
  duration?: number | string;
  order_index: number;
  is_completed?: boolean;
  module_id: number;
  created_at?: string;
  updated_at?: string;
  type?: 'video' | 'text' | 'quiz' | 'assignment';
  isLocked?: boolean;
  isCurrent?: boolean;
  completion_percentage?: number;
  last_accessed?: string | null;
}

export interface Module {
  id: number | string;
  title: string;
  description?: string;
  order_index: number;
  course_id: number;
  lessons: Lesson[];
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  description?: string;
  short_description?: string;
  thumbnail_url?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'draft' | 'published' | 'archived';
  level: string;
  price: number;
  created_at: string;
  updated_at?: string;
  instructor_id: number;
  category_id?: number;
  
  // Relations
  instructor?: User;
  students?: User[];
  lessons?: Lesson[];
  modules?: Module[];
  category?: Category;
  tags?: Tag[];
  
  // Champs de progression (optionnels, ajoutés par le backend)
  progress?: number;
  is_enrolled?: boolean;
}

export interface CourseWithProgress extends Course {
  progress: number;
  is_enrolled: boolean;
}
