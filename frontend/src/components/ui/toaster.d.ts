import * as React from 'react';

declare const Toaster: React.FC<{
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  toastOptions?: {
    duration?: number;
    className?: string;
    style?: React.CSSProperties;
  };
  children?: React.ReactNode;
}>;

declare const toast: {
  (message: string, options?: {
    duration?: number;
    className?: string;
    style?: React.CSSProperties;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  }): void;
  success(message: string, options?: any): void;
  error(message: string, options?: any): void;
  warning(message: string, options?: any): void;
  info(message: string, options?: any): void;
  loading(message: string, options?: any): void;
};

export { Toaster, toast };
