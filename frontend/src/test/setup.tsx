// Configuration de base pour les tests
import { vi, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup, waitFor, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Nettoyer le DOM après chaque test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Configuration globale avant tous les tests
beforeAll(() => {
  // Initialisation globale si nécessaire
});

// Nettoyage après tous les tests
afterAll(() => {
  vi.restoreAllMocks();
});

// Mocks globaux
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Configuration de React Query pour les tests
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0, // Remplace cacheTime qui est déprécié
      staleTime: 0,
    },
    mutations: {
      retry: false,
    },
  }
});

// Créer un nouveau client pour chaque test pour éviter les conflits de cache
const queryClient = createTestQueryClient();

// Fournisseur de contexte pour les tests
export const TestProviders = ({ 
  children, 
  initialEntries = ['/']
}: { 
  children: React.ReactNode, 
  initialEntries?: string[]
}) => {

  // Créer un nouveau client pour chaque test
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {/* Simuler le contexte d'authentification si nécessaire */}
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Fonction utilitaire pour attendre que les requêtes soient terminées
export const waitForQueries = async () => {
  await waitFor(() => {
    const queries = queryClient.getQueryCache().findAll();
    return queries.every((query: any) => !query.isFetching);
  });
};

// Fonction utilitaire pour rendre un composant avec tous les providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: {
    route?: string,
    routes?: { path: string, element: React.ReactElement }[],
    queryClient?: QueryClient
  }
) => {
  const {
    route = '/',
    routes = [],
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options || {};

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        {routes.length > 0 ? (
          <Routes>
            {routes.map((routeConfig) => (
              <Route key={routeConfig.path} path={routeConfig.path} element={routeConfig.element} />
            ))}
          </Routes>
        ) : children}
      </MemoryRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    // Ajouter des utilitaires supplémentaires
    user: userEvent.setup(),
  };
};

// Mocks pour les API
export const mockApiResponse = <T,>(data: T) => {
  return vi.fn().mockImplementation(() => 
    Promise.resolve({
      status: 200,
      data,
      headers: {},
    })
  );
};

export const mockApiError = (status = 400, message = 'Error') => {
  return vi.fn().mockImplementation(() =>
    Promise.reject(new Error(JSON.stringify({
      response: {
        status,
        data: { message },
      },
    })))
  );
};

// Utilitaire pour simuler les interactions utilisateur
export const userInteractions = {
  click: async (element: HTMLElement) => {
    await userEvent.click(element);
  },
  type: async (element: HTMLElement, text: string) => {
    await userEvent.type(element, text);
  },
  clear: async (element: HTMLElement) => {
    await userEvent.clear(element);
  },
  selectOption: async (element: HTMLElement, optionText: string) => {
    await userEvent.selectOptions(element, optionText);
  },
};
