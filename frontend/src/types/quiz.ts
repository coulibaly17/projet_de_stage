/**
 * Types pour le module de quiz
 */

export type QuestionType = 'single' | 'multiple' | 'text' | 'code' | 'matching' | 'ordering' | 'multiple_choice' | 'single_choice' | 'true_false';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  explanation?: string;
  imageUrl?: string;
  codeSnippet?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  description?: string;
  codeSnippet?: string;
  options?: QuestionOption[];
  correctAnswers?: string[];
  explanation?: string;
  points?: number;
  order_index?: number; // Ajouté pour correspondre à la BD
  metadata?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    category?: string;
    tags?: string[];
    resources?: Array<{
      title: string;
      url: string;
      type?: 'article' | 'video' | 'documentation' | 'other';
    }>;
    [key: string]: any;
  };
}

export interface QuizSettings {
  timeLimit?: number; // en secondes
  passingScore: number; // en pourcentage
  showResults: boolean;
  allowRetries: boolean;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showExplanations: boolean;
  showCorrectAnswers: boolean;
  showScore: boolean;
  requireFullScreen: boolean;
  [key: string]: any;
}

export interface QuizMetadata {
  author?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  averageScore?: number;
  attemptsCount?: number;
  averageTimeSpent?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  categories?: string[];
  tags?: string[];
  [key: string]: any;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  courseId?: string; // Optionnel pour compatibilité
  lessonId?: number; // Ajouté pour correspondre à la BD
  questions: Question[];
  settings?: QuizSettings; // Optionnel pour compatibilité
  metadata?: QuizMetadata; // Optionnel pour compatibilité
  version?: string;
  isPublished?: boolean;
  isActive?: boolean; // Ajouté pour correspondre à la BD
  passingScore?: number; // Ajouté pour correspondre à la BD
  status?: 'draft' | 'published' | 'closed'; // Ajouté pour le frontend
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UserAnswer {
  questionId: string;
  answer: string | string[];
  timestamp: string | Date;
  timeSpent?: number; // en secondes
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: string | Date;
  completedAt: string | Date;
  answers: UserAnswer[];
  score: number; // en pourcentage
  passed: boolean;
  timeSpent: number; // en secondes
  metadata?: {
    device?: string;
    browser?: string;
    ipAddress?: string;
    [key: string]: any;
  };
}

export interface QuizResult {
  id: number;
  quizId: number;
  quizTitle: string;
  score: number;
  passed: boolean;
  completedAt: string;
  courseId: number;
  courseTitle: string;
  lessonId: number;
  lessonTitle: string;
  timeSpent?: number;
  correctAnswers?: number;
  totalQuestions?: number;
  passingScore?: number;
}


export interface QuizFeedback {
  id: string;
  quizId: string;
  attemptId: string;
  userId: string;
  rating: number; // 1-5
  comment?: string;
  difficultyRating?: number; // 1-5
  relevanceRating?: number; // 1-5
  createdAt: string | Date;
  updatedAt?: string | Date;
}



export interface SimilarQuiz {
  id: string;
  title: string;
  description?: string;
  similarityScore: number; // 0-1
  sharedTags: string[];
  averageScore?: number;
  questionCount: number;
  completedByUser?: boolean;
  userScore?: number;
}

// Types pour les réponses d'API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Types pour les événements de suivi
export interface QuizEvent {
  type: 'start' | 'answer' | 'complete' | 'navigate' | 'timeout' | 'review';
  timestamp: string | Date;
  data: {
    questionId?: string;
    answer?: any;
    timeSpent?: number;
    [key: string]: any;
  };
}

// Types pour l'analyse des quiz
export interface QuizAnalytics {
  quizId: string;
  title: string;
  averageScore: number;
  completionRate: number;
  attempts: number;
  questions: Array<{
    id: string;
    text: string;
    correctRate: number;
    commonMistakes: Array<{
      answer: string;
      count: number;
    }>;
  }>;
}

// Types pour les statistiques de quiz
export interface QuizStatistics {
  quizId: string;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
  questionStats: Array<{
    questionId: string;
    correctRate: number;
    averageTimeSpent: number;
    commonMistakes: Array<{
      answer: string;
      count: number;
      percentage: number;
    }>;
  }>;
  difficultyStats: {
    easy: {
      count: number;
      correctRate: number;
    };
    medium: {
      count: number;
      correctRate: number;
    };
    hard: {
      count: number;
      correctRate: number;
    };
  };
  userStats?: {
    rank: number;
    percentile: number;
    averageScore: number;
    totalQuizzesTaken: number;
  };
}
