import { apiService } from './api';
import type { AxiosRequestConfig } from 'axios';

// Types et interfaces
export interface Course {
  id: string;
  title: string;
  description: string;
  author: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // en minutes
  rating: number;
  enrollmentCount: number;
  completionRate: number;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: string;
}

export type RecommendationTypeLiteral = 'popular' | 'similar' | 'personalized';

export interface BaseRecommendation<T> {
  id: string;
  type: RecommendationTypeLiteral;
  title: string;
  score: number;
  reason: string;
  content: T;
  metadata?: Record<string, any>;
}

export interface PopularRecommendation extends BaseRecommendation<Course> {
  metrics: {
    viewCount: number;
    enrollmentCount: number;
    completionRate: number;
    averageRating: number;
  };
}

export interface SimilarContentRecommendation extends BaseRecommendation<Course> {
  similarityScore: number;
  matchedTags: string[];
  sourceContentId: string;
}

export type Recommendation = PopularRecommendation | SimilarContentRecommendation;

export interface FeedbackResponse {
  recommendationId: string;
  userId: string;
  action: 'click' | 'dismiss' | 'save' | 'enroll';
  timestamp: string;
  success: boolean;
}

// Interface pour la réponse de l'API de recommandation
export interface RecommendationResponse {
  recommendations: Array<{
    id: number;
    title: string;
    description: string;
    imageUrl?: string;
    instructor: string;
    category: string;
    level: string;
    duration: number;
    rating: number;
    enrolledCount: number;
    isSaved?: boolean;
    matchScore: number;
    matchReason: string;
    algorithm: string;
    confidence: number;
    successProbability?: number;
    estimatedTime?: string;
  }>;
  totalCount: number;
  algorithms: string[];
  generatedAt: string;
  userProfile?: {
    userId: number;
    email: string;
    fullName: string;
    enrolledCoursesCount: number;
  };
}

export interface RecommendationOptions {
  refreshCache?: boolean;
  includeMetadata?: boolean;
  sortBy?: 'score' | 'date' | 'popularity';
  filters?: {
    categories?: string[];
    difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
    tags?: string[];
    minRating?: number;
    savedOnly?: boolean;
  };
  limit?: number;
}

// Gestion des erreurs
export class RecommendationError extends Error {
  public statusCode: number;
  public source: string;

  constructor(message: string, statusCode = 500, source = 'recommendation-service') {
    super(message);
    this.name = 'RecommendationError';
    this.statusCode = statusCode;
    this.source = source;
  }
}

// Gestion du cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes en millisecondes

export class RecommendationService {
  private static instance: RecommendationService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
  };
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Nettoyer le cache toutes les 15 minutes
    this.cleanupInterval = setInterval(() => this.cleanupCache(), 15 * 60 * 1000);
  }

  public static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  // Méthodes de gestion du cache
  private addToCache<T>(key: string, data: T, ttl = DEFAULT_CACHE_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
    this.cacheStats.size = this.cache.size;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }

    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.cacheStats.misses++;
      this.cacheStats.size = this.cache.size;
      return null;
    }

    this.cacheStats.hits++;
    return entry.data as T;
  }

  private cleanupCache(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    this.cacheStats.size = this.cache.size;
    console.log(`Cache cleanup: removed ${expiredCount} expired entries. Current cache size: ${this.cache.size}`);
  }

  public getCacheStats(): { hits: number; misses: number; size: number; hitRate: number } {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = total > 0 ? this.cacheStats.hits / total : 0;
    return {
      ...this.cacheStats,
      hitRate,
    };
  }

  // Méthodes pour obtenir des recommandations
  public async getPopularRecommendations(
    options: RecommendationOptions = {}
  ): Promise<PopularRecommendation[]> {
    const cacheKey = `popular-recommendations-${JSON.stringify(options)}`;
    
    if (!options.refreshCache) {
      const cachedData = this.getFromCache<PopularRecommendation[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const config: AxiosRequestConfig = {
        params: {
          includeMetadata: options.includeMetadata ?? false,
          sortBy: options.sortBy || 'popularity',
          limit: options.limit || 10,
          ...options.filters,
        },
      };

      const response = await apiService.get<ApiResponse<PopularRecommendation[]>>(
        '/recommendations/popular',
        config
      );

      this.addToCache(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      throw new RecommendationError(
        `Failed to fetch popular recommendations: ${error.message}`,
        error.response?.status || 500
      );
    }
  }

  public async getSimilarContentRecommendations(
    contentId: string,
    options: RecommendationOptions = {}
  ): Promise<SimilarContentRecommendation[]> {
    const cacheKey = `similar-recommendations-${contentId}-${JSON.stringify(options)}`;
    
    if (!options.refreshCache) {
      const cachedData = this.getFromCache<SimilarContentRecommendation[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const config: AxiosRequestConfig = {
        params: {
          includeMetadata: options.includeMetadata ?? false,
          sortBy: options.sortBy || 'score',
          limit: options.limit || 5,
          ...options.filters,
        },
      };

      const response = await apiService.get<ApiResponse<SimilarContentRecommendation[]>>(
        `/recommendations/similar/${contentId}`,
        config
      );

      this.addToCache(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      throw new RecommendationError(
        `Failed to fetch similar content recommendations: ${error.message}`,
        error.response?.status || 500
      );
    }
  }

  public async getPersonalizedRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<Recommendation[]> {
    const cacheKey = `personalized-recommendations-${userId}-${JSON.stringify(options)}`;
    
    if (!options.refreshCache) {
      const cachedData = this.getFromCache<Recommendation[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const config: AxiosRequestConfig = {
        params: {
          includeMetadata: options.includeMetadata ?? true,
          sortBy: options.sortBy || 'score',
          limit: options.limit || 10,
          savedOnly: options.filters?.savedOnly || false,
          ...options.filters,
        },
      };

      // Utiliser le nouvel endpoint API
      const response = await apiService.get<RecommendationResponse>(
        `/api/v1/recommendations`,
        config
      );

      // Extraire le tableau de recommandations de la réponse
      const recommendations = response.recommendations || [];
      
      // Transformer les données pour correspondre à l'interface Recommendation
      const transformedRecs: Recommendation[] = recommendations.map(rec => {
        // Créer un objet de cours pour la recommandation
        const course: Course = {
          id: rec.id.toString(),
          title: rec.title,
          description: rec.description || 'Aucune description disponible',
          author: {
            id: '1', // ID factice car non fourni par le backend
            name: rec.instructor || 'Instructeur inconnu',
            profilePicture: undefined
          },
          category: rec.category || 'Général',
          tags: [],
          difficulty: (rec.level?.toLowerCase() as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
          duration: rec.duration * 60 || 60, // Convertir les heures en minutes
          rating: rec.rating || 4.5,
          enrollmentCount: rec.enrolledCount || 0,
          completionRate: 0, // Non fourni par le backend
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          thumbnailUrl: rec.imageUrl || `https://picsum.photos/seed/${Math.random()}/300/200`
        };

        // Créer une recommandation personnalisée
        const recommendation: Recommendation = {
          id: rec.id.toString(),
          type: 'personalized',
          title: rec.title,
          score: rec.matchScore || 0.8,
          reason: rec.matchReason || 'Recommandé pour vous',
          content: course,
          metadata: {
            algorithm: rec.algorithm || 'content_based',
            confidence: rec.confidence || 0.8
          },
          // Propriétés spécifiques à PopularRecommendation
          metrics: {
            viewCount: 0,
            enrollmentCount: rec.enrolledCount || 0,
            completionRate: 0,
            averageRating: rec.rating || 4.5
          },
          // Propriétés spécifiques à SimilarContentRecommendation
          similarityScore: rec.matchScore || 0.8,
          matchedTags: [],
          sourceContentId: ''
        } as PopularRecommendation & SimilarContentRecommendation;

        return recommendation;
      });

      this.addToCache(cacheKey, transformedRecs);
      return transformedRecs;
    } catch (error: any) {
      throw new RecommendationError(
        `Failed to fetch personalized recommendations: ${error.message}`,
        error.response?.status || 500
      );
    }
  }

  public async sendRecommendationFeedback(
    recommendationId: string,
    action: 'click' | 'dismiss' | 'save' | 'enroll'
  ): Promise<FeedbackResponse> {
    try {
      // Utiliser le nouvel endpoint API
      const response = await apiService.post<FeedbackResponse>(
        `/recommendations/feedback/${recommendationId}`,
        { action }
      );

      return response;
    } catch (error: any) {
      throw new RecommendationError(
        `Failed to send recommendation feedback: ${error.message}`,
        error.response?.status || 500
      );
    }
  }

  public async refreshRecommendations(type: RecommendationTypeLiteral = 'personalized', id?: string): Promise<boolean> {
    try {
      // Utiliser le nouvel endpoint API
      await apiService.post<{ success: boolean }>(`/api/v1/recommendations/new/refresh`);
      
      // Invalider les entrées de cache pertinentes
      for (const [key] of this.cache.entries()) {
        if (key.startsWith(`${type}-recommendations`)) {
          if (!id || key.includes(id)) {
            this.cache.delete(key);
          }
        }
      }
      
      return true;
    } catch (error: any) {
      throw new RecommendationError(
        `Failed to refresh recommendations: ${error.message}`,
        error.response?.status || 500
      );
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.cacheStats = { hits: 0, misses: 0, size: 0 };
  }
}

export const recommendationService = RecommendationService.getInstance();
