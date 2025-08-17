declare module 'sonner' {
  export const toast: {
    (message: string, options?: any): void;
    success(message: string, options?: any): void;
    error(message: string, options?: any): void;
    warning(message: string, options?: any): void;
    info(message: string, options?: any): void;
    loading(message: string, options?: any): void;
    dismiss(id?: string): void;
    custom(component: React.ReactNode, options?: any): void;
  };
}
