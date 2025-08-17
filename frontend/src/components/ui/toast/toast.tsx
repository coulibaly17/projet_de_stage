import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '../use-toast';

type ToastProps = {
  id: string;
  title: string;
  description?: string;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  onDismiss?: (id: string) => void;
};

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  type = 'default',
  onDismiss,
}) => {
  const typeClasses = {
    default: 'bg-background border',
    success: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
  };

  return (
    <div
      className={cn(
        'relative flex w-full flex-col rounded-lg border p-4 shadow-lg',
        typeClasses[type]
      )}
      role="alert"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(id)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
};

export const Toaster: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          type={toast.type}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
};

export { Toaster as ToastProvider };
