import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import API_CONFIG from '../config/api';

class ApiService {
  private static instance: ApiService;
  private readonly api: AxiosInstance; // ajouté readonly
  private authToken: string | null = null;

  private constructor() {
    this.authToken = localStorage.getItem('authToken') ?? null;

    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      paramsSerializer: {
        // Ne pas ajouter de paramètres de cache
        indexes: null
      }
    });

    this.api.interceptors.request.use(
      (config) => {
        const newConfig = { ...config };
        if (!newConfig.headers) {
          newConfig.headers = {} as any;
        }

        const isAuthRequest = config.url && (
          config.url.includes('/auth/token') ||
          config.url.includes('/auth/login') ||
          config.url.includes('/auth/register')
        );

        // Utilisation de ?? au lieu de ||
        const token = this.authToken ?? localStorage.getItem('authToken');

        if (token && !isAuthRequest) {
          newConfig.headers.Authorization = `Bearer ${token}`;
          console.log('Token ajouté à la requête:', token.substring(0, 15) + '...');
        } else if (!token && !isAuthRequest) {
          console.warn('Aucun token d\'authentification trouvé pour une requête protégée');
        }

        return newConfig;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        // Créer une erreur à partir de l'erreur d'origine
        const errorMessage = error instanceof Error 
          ? error.message 
          : typeof error === 'string' 
            ? error 
            : 'Une erreur inconnue est survenue';
            
        const apiError = new Error(errorMessage);
        
        // Si c'est une erreur Axios, ajouter des informations supplémentaires
        if (error && typeof error === 'object' && 'isAxiosError' in error) {
          const axiosError = error as AxiosError;
          
          console.error('Erreur API:', {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            responseData: axiosError.response?.data,
            requestHeaders: axiosError.config?.headers,
            hasAuthHeader: !!axiosError.config?.headers?.['Authorization']
          });
          
          // Ajouter des propriétés utiles pour le débogage
          Object.assign(apiError, {
            config: axiosError.config,
            code: axiosError.code,
            response: axiosError.response,
            isAxiosError: true
          });
          
          // Utiliser les informations d'Axios pour la suite
          Object.defineProperty(apiError, 'response', {
            value: axiosError.response,
            enumerable: true
          });
        } else {
          console.error('Erreur non-Axios:', error);
        }

        // Vérifier si c'est une erreur 401 (non autorisé)
        const response = (apiError as any).response;
        if (response?.status === 401) {
          const requestUrl = (apiError as any).config?.url ?? '';

          const isAuthMeEndpoint = requestUrl.includes('/auth/me');
          const isQuizEndpoint = requestUrl.includes('/quizzes');
          const isAuthEndpoint = requestUrl.includes('/auth/');

          console.warn(`Erreur 401 sur ${requestUrl} - isAuthMe: ${isAuthMeEndpoint}, isQuiz: ${isQuizEndpoint}, isAuth: ${isAuthEndpoint}`);

          if (!isAuthMeEndpoint && !isQuizEndpoint && !isAuthEndpoint) {
            console.warn('Redirection vers la page de connexion...');
            this.clearAuthToken();
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/connexion')) {
              // Ne pas recharger la page si on est déjà sur la page de connexion
              window.location.href = '/connexion';
            }
          }
        } else if (response?.status === 403) {
          // Ne rien faire de spécial pour les erreurs 403, laisser le composant gérer
          console.log('Erreur 403 gérée par le composant');
        }
        
        // Rejeter avec notre erreur formatée
        return Promise.reject(apiError);
      }
    );
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      localStorage.setItem('authToken', token);
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('authToken');
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  public getAuthToken(): string | null {
    return this.authToken ?? localStorage.getItem('authToken');
  }

  public clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem('authToken');
    delete this.api.defaults.headers.common['Authorization'];
  }

  public async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const url = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

      console.log('GET Request:', {
        url,
        baseURL: this.api.defaults.baseURL,
        params: config?.params,
        headers: this.api.defaults.headers.common
      });

      const response = await this.api.get<T>(url, {
        ...config,
        params: {
          ...(config?.params ?? {}),
          _t: Date.now()
        },
        paramsSerializer: (params) => {
          const searchParams = new URLSearchParams();
          for (const key in params) {
            const value = params[key];
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          }
          return searchParams.toString();
        }
      });

      console.log('GET Response:', {
        url,
        status: response.status,
        data: response.data
      });

      return response.data;
    } catch (error: unknown) {
      console.error('GET Error:', {
        url: endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
        config,
        // TS ne peut pas garantir que error a response
        response: (error as any)?.response ? {
          status: (error as any).response.status,
          data: (error as any).response.data,
          headers: (error as any).response.headers
        } : undefined
      });
      throw error;
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T = any, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.api.patch<T>(url, data, config);
      return response.data;
    } catch (error: unknown) {
      this.handleError(error);
      throw error;
    }
  }

  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.api.delete<T>(url, config);
      return response.data;
    } catch (error: unknown) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: unknown): void {
    if (error instanceof Error) {
      console.error('Erreur API:', error.message);
    } else {
      console.error('Erreur API inconnue:', error);
    }
  }
}

export const apiService = ApiService.getInstance();
