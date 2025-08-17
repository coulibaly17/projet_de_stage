import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg';
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary',
    size = 'default',
    isLoading = false, 
    children, 
    disabled,
    asChild = false,
    ...props 
  }, ref) => {
    // Styles de base communs à tous les boutons
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none';
    
    // Styles de variante
    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
      ghost: 'hover:bg-gray-100',
      link: 'text-blue-600 underline-offset-4 hover:underline',
    };
    
    // Tailles
    const sizeStyles = {
      sm: 'h-8 px-3 text-xs',
      default: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    const buttonClassName = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      className
    );
    
    if (asChild && React.Children.count(children) === 1) {
      const child = React.Children.only(children) as React.ReactElement<{
        className?: string;
        disabled?: boolean;
        ref?: React.Ref<unknown>;
      }>;
      
      return React.cloneElement(child, {
        className: cn(buttonClassName, child.props?.className),
        disabled: disabled || isLoading || child.props?.disabled,
        ref: ref as React.Ref<unknown>,
        ...props
      });
    }
    
    return (
      <button
        className={buttonClassName}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        <span className="flex items-center">
          {isLoading && (
            <span className="mr-2">
              <svg
                className="animate-spin h-4 w-4 text-current"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                />
              </svg>
            </span>
          )}
          <span>{children}</span>
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
