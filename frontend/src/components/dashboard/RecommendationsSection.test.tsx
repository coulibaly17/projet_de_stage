import { render, screen, waitFor } from '@testing-library/react';
import { RecommendationsSection } from './RecommendationsSection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { recommendationService } from '@/services/recommendation.service';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock du service de recommandation
vi.mock('@/services/recommendation.service', () => ({
  recommendationService: {
    getPersonalizedRecommendations: vi.fn(),
  },
}));

describe('RecommendationsSection', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    // Réinitialiser tous les mocks avant chaque test
    vi.clearAllMocks();
  });

  it('affiche un état de chargement', async () => {
    // Simuler un chargement en cours
    vi.mocked(recommendationService.getPersonalizedRecommendations).mockImplementation(
      () => new Promise(() => {})
    );

    render(<RecommendationsSection />, { wrapper });

    // Vérifier que le composant affiche des squelettes de chargement
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton')).toHaveLength(3);
  });

  it('affiche les recommandations avec succès', async () => {
    const mockRecommendations = [
      {
        id: '1',
        course: {
          id: 'course-1',
          title: 'Introduction à React',
          description: 'Apprenez les bases de React',
        },
        reason: 'Basé sur vos intérêts',
        score: 0.9,
      },
    ];

    vi.mocked(recommendationService.getPersonalizedRecommendations).mockResolvedValue(
      mockRecommendations
    );

    render(<RecommendationsSection />, { wrapper });

    // Attendre que les données soient chargées
    await waitFor(() => {
      expect(screen.getByText('Introduction à React')).toBeInTheDocument();
      expect(screen.getByText('Basé sur vos intérêts')).toBeInTheDocument();
    });
  });

  it('affiche une erreur en cas de problème de chargement', async () => {
    vi.mocked(recommendationService.getPersonalizedRecommendations).mockRejectedValue(
      new Error('Erreur de chargement')
    );

    render(<RecommendationsSection />, { wrapper });

    // Vérifier que le message d'erreur s'affiche
    await waitFor(() => {
      expect(
        screen.getByText('Impossible de charger les recommandations')
      ).toBeInTheDocument();
    });
  });

  it('permet de rafraîchir les recommandations', async () => {
    const user = userEvent.setup();
    const mockRecommendations = [
      {
        id: '1',
        course: {
          id: 'course-1',
          title: 'Nouveau cours',
        },
        reason: 'Nouvelle recommandation',
      },
    ];

    vi.mocked(recommendationService.getPersonalizedRecommendations)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockRecommendations);

    render(<RecommendationsSection />, { wrapper });

    // Cliquer sur le bouton de rafraîchissement
    const refreshButton = screen.getByRole('button', { name: /actualiser/i });
    await user.click(refreshButton);

    // Vérifier que les nouvelles recommandations s'affichent
    await waitFor(() => {
      expect(screen.getByText('Nouveau cours')).toBeInTheDocument();
    });
  });

  it('affiche un état vide quand il n\'y a pas de recommandations', async () => {
    vi.mocked(recommendationService.getPersonalizedRecommendations).mockResolvedValue([]);

    render(<RecommendationsSection />, { wrapper });

    // Vérifier que l'état vide s'affiche
    await waitFor(() => {
      expect(screen.getByText('Aucune recommandation')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Consultez plus de cours pour obtenir des recommandations personnalisées.'
        )
      ).toBeInTheDocument();
    });
  });
});
