import { Loader2 } from 'lucide-react';

interface PageLoadingProps {
  readonly children?: React.ReactNode;
  readonly className?: string;
}

export function PageLoading({ children, className = '' }: PageLoadingProps) {
  return (
    <div className={`flex items-center justify-center min-h-[calc(100vh-200px)] ${className}`}>
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
        <p className="text-gray-600">{children || 'Chargement en cours...'}</p>
      </div>
    </div>
  );
}
