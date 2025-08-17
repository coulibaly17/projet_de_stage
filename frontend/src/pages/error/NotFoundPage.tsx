import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page non trouvée</h2>
        <p className="text-gray-600 mb-8">
          Désolé, nous n'avons pas trouvé la page que vous recherchez.
        </p>
        <Button asChild>
          <Link to="/" className="w-full sm:w-auto">
            Retour à l'accueil
          </Link>
        </Button>
      </div>
    </div>
  );
}
