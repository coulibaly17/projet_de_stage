import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from 'react-hot-toast';
import './index.css';
import App from './App.tsx';

// Configuration de React Query avec gestion des erreurs globale
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Évite les rechargements inutiles lors du retour sur l'onglet
      retry: 1, // Nombre de tentatives en cas d'échec
      staleTime: 5 * 60 * 1000, // 5 minutes avant de considérer les données comme périmées
    },
  },
  queryCache: new QueryCache({
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message || 'Une erreur est survenue';
      toast.error(errorMessage);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error.message || 'Une erreur est survenue';
      toast.error(errorMessage);
    },
  }),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  </StrictMode>
);
