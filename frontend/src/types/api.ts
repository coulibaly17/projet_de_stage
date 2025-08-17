export enum ApiRoutes {
  AUTH = '/auth',
  USERS = '/users',
  COURSES = '/courses',
  LESSONS = '/lessons',
  QUIZZES = '/quizzes',
  RESULTS = '/results'
}

export enum ApiEndpoints {
  LOGIN = '/login',
  REGISTER = '/register',
  REFRESH = '/refresh',
  ME = '/me',
  COURSE_LIST = '/list',
  COURSE_DETAIL = '/detail',
  LESSON_LIST = '/list',
  QUIZ_LIST = '/list',
  QUIZ_SUBMIT = '/submit',
  RESULT_LIST = '/list'
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: 'student' | 'teacher' | 'admin';
  };
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  teacher: {
    id: string;
    username: string;
  };
  lessons: Array<{
    id: string;
    title: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  courseId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
  }>;
  lessonId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  answers: Array<{
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}
