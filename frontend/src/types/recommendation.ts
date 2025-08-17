export interface RecommendationResource {
  id: string;
  title: string;
  url: string;
  type: 'course' | 'article' | 'video' | 'exercise' | 'documentation' | 'other';
  description?: string;
  duration?: number; // in minutes
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  rating?: number; // 1-5
  thumbnailUrl?: string;
  author?: string;
  publishedAt?: string;
  tags?: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'course' | 'resource' | 'practice' | 'study_plan' | 'other';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  scoreImpact?: number; // How much this recommendation might improve the user's score (0-1)
  timeCommitment?: number; // Estimated time in minutes
  resources: RecommendationResource[];
  relatedTo?: string[]; // IDs of related questions or concepts
  metadata?: {
    source?: string;
    confidence?: number; // 0-1
    lastUpdated?: string;
    [key: string]: any;
  };
}

export interface QuizRecommendation extends Recommendation {
  type: 'quiz';
  quizId: string;
  reason: string;
  expectedImprovement?: number; // Expected score improvement (0-1)
}

export interface ResourceRecommendation extends Recommendation {
  type: 'resource';
  resourceIds: string[];
}

export interface StudyPlanRecommendation extends Recommendation {
  type: 'study_plan';
  steps: Array<{
    id: string;
    title: string;
    description: string;
    resourceIds: string[];
    estimatedTime: number; // in minutes
    completed?: boolean;
  }>;
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  summary?: {
    totalRecommendations: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    estimatedTime: number; // Total estimated time in minutes
  };
  metadata?: {
    generatedAt: string;
    modelVersion?: string;
    [key: string]: any;
  };
}
