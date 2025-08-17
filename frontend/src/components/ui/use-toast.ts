import * as React from 'react';

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

type ToastOptions = Omit<Toast, 'id'> & {
  id?: string;
  variant?: 'default' | 'destructive';
};

type ToastContextType = {
  toasts: Toast[];
  toast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const toastTimers = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Clear all timers on unmount
  React.useEffect(() => {
    return () => {
      Object.values(toastTimers.current).forEach((timer) => clearTimeout(timer));
      toastTimers.current = {};
    };
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((currentToasts) => {
      // Clear the timer when toast is dismissed
      if (toastTimers.current[id]) {
        clearTimeout(toastTimers.current[id]);
        delete toastTimers.current[id];
      }
      
      return currentToasts.filter((toast) => toast.id !== id);
    });
  }, []);

  const toast = React.useCallback(({ id, ...options }: ToastOptions): string => {
    const toastId = id || Math.random().toString(36).substring(2, 9);
    const duration = options.duration ?? 5000;

    // Clear any existing timer for this toast
    if (toastTimers.current[toastId]) {
      clearTimeout(toastTimers.current[toastId]);
      delete toastTimers.current[toastId];
    }

    // Add the new toast
    setToasts((currentToasts) => {
      // If toast with this ID already exists, remove it first
      const filteredToasts = currentToasts.filter((t) => t.id !== toastId);
      return [...filteredToasts, { ...options, id: toastId, duration }];
    });

    // Set up auto-dismissal if duration is provided
    if (duration > 0) {
      toastTimers.current[toastId] = setTimeout(() => {
        setToasts((currentToasts) => 
          currentToasts.filter((toast) => toast.id !== toastId)
        );
        delete toastTimers.current[toastId];
      }, duration);
    }

    return toastId;
  }, []);

  const contextValue = React.useMemo<ToastContextType>(
    () => ({
      toasts,
      toast,
      dismissToast,
    }),
    [toasts, toast, dismissToast]
  );

  return React.createElement(
    ToastContext.Provider,
    { value: contextValue },
    children
  );
};

export const useToast = (): ToastContextType => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
