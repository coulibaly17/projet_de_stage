import { useAuth } from '@/hooks/use-auth';
import MessagingPage from '@/components/messaging/MessagingPage';
import { Navigate } from 'react-router-dom';

export function MessagingPageWrapper() {
  const { isAuthenticated } = useAuth();

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MessagingPage />;
}
