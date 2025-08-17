import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, AxiosRequestHeaders } from 'axios';
import { API_CONFIG } from '../config/api.config';

// Classe pour gérer les erreurs API
export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Configuration de l'instance Axios
const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
axiosInstance.interceptors.request.use(
  (config) => {
    // Créer un nouvel objet de configuration pour éviter les problèmes de référence
    const newConfig = { ...config };
    
    // Initialiser les en-têtes si non définis
    newConfig.headers ??= {} as AxiosRequestHeaders;
    
    // Définir les en-têtes par défaut si non définis
    newConfig.headers['Content-Type'] ??= 'application/json';
    newConfig.headers['Accept'] ??= 'application/json';
    
    // Récupérer le token d'authentification
    const token = localStorage.getItem('authToken');
    console.log('Token d\'authentification récupéré:', token ? 'Présent' : 'Absent');
    
    if (token) {
      console.log('Ajout du token Bearer dans les en-têtes');
      newConfig.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('Aucun token d\'authentification trouvé dans le localStorage');
    }
    
    console.log('En-têtes de la requête:', newConfig.headers);
    return newConfig;
  },
  (error) => {
    console.error('Erreur dans l\'intercepteur de requête:', error);
    return Promise.reject(new Error(error.message || 'Erreur lors de la préparation de la requête'));
  }
);

// Intercepteur pour gérer les réponses et les erreurs
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'erreur
      const { status, data, config } = error.response;
      
      // Gérer les erreurs d'authentification
      if (status === 401) {
        console.error('Erreur 401 détectée - Non autorisé', { 
          url: config.url, 
          method: config.method,
          data: data
        });
        
        // Vérifier si nous sommes déjà sur la page de connexion ou si c'est une requête de rafraîchissement
        const isLoginPage = window.location.pathname === '/connexion';
        const isRefreshRequest = config.url?.includes('/auth/refresh');
        
        // Si ce n'est pas une requête de rafraîchissement et qu'on n'est pas sur la page de connexion
        if (!isRefreshRequest && !isLoginPage) {
          // Supprimer les tokens d'authentification
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          // Rediriger vers la page de connexion
          window.location.href = '/connexion';
          
          // Rejeter avec une erreur spécifique pour arrêter la chaîne de promesses
          return Promise.reject(new Error('Redirection vers la page de connexion'));
        }
      }
      
      // Pour les autres erreurs, renvoyer une erreur API standard
      return Promise.reject(new ApiError(
        data.message ?? 'Une erreur est survenue',
        status,
        data
      ));
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      return Promise.reject(new ApiError(
        'Aucune réponse du serveur',
        0
      ));
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      return Promise.reject(new ApiError(
        error.message || 'Erreur de configuration de la requête',
        0
      ));
    }
  }
);

// Service API
export const apiService = {
  // Méthode GET
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.get<T>(url, config);
  },
  
  // Méthode POST
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.post<T>(url, data, config);
  },
  
  // Méthode PUT
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.put<T>(url, data, config);
  },
  
  // Méthode PATCH
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.patch<T>(url, data, config);
  },
  
  // Méthode DELETE
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.delete<T>(url, config);
  }
};

export default apiService;
