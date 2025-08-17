// Ce fichier est un wrapper pour quiz.service.ts pour résoudre les problèmes d'importation
import { quizService } from './quiz.service';
import type { Quiz, Question, QuizAttempt, QuizResult, QuizFeedback, UserAnswer } from '../types/quiz';

export { quizService };
export type { Quiz, Question, QuizAttempt, QuizResult, QuizFeedback, UserAnswer };
