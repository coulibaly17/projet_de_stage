import * as React from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}

export function Label({ 
  htmlFor, 
  className = '', 
  children, 
  ...props 
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
