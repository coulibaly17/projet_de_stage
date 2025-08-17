// Services API centralisés
import { apiService } from './api';
import { quizService } from './quiz.service';
import { assignmentService } from './assignment.service';
import { discussionService } from './discussion.service';
import { recommendationService } from './recommendation.service';
import { dashboardService } from './dashboard.service';

// Types exportés
export type { 
  // Quiz types
  Quiz, 
  Question, 
  QuizAttempt, 
  QuizResult, 
  QuizFeedback 
} from './quiz.service';

export type {
  // Assignment types
  Assignment,
  AssignmentAttachment,
  AssignmentSubmission,
  AssignmentStatus,
  SubmissionStatus
} from './assignment.service';

export type {
  // Discussion types
  Discussion,
  DiscussionMessage,
  MessageAttachment,
  CreateDiscussionRequest,
  AddMessageRequest
} from './discussion.service';

export type {
  // Recommendation types
  Course,
  Recommendation,
  RecommendationOptions,
  FeedbackResponse
} from './recommendation.service';

export type {
  // Dashboard types
  DashboardData,
  Activity,
  UpcomingQuiz
} from './dashboard.service';

// Export des services
export {
  apiService,
  quizService,
  assignmentService,
  discussionService,
  recommendationService,
  dashboardService
};
