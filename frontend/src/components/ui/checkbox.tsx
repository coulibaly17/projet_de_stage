import * as React from 'react';
import { cn } from '@/lib/utils';

type CheckedState = boolean | 'indeterminate';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'checked'> {
  id: string;
  checked?: CheckedState;
  onCheckedChange?: (checked: CheckedState) => void;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({
  id,
  checked = false,
  onCheckedChange,
  className = '',
  disabled = false,
  ...props
}: CheckboxProps) {
  const isIndeterminate = checked === 'indeterminate';
  const isChecked = checked === true;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
  };

  return (
    <input
      type="checkbox"
      id={id}
      checked={isChecked}
      ref={(el) => {
        if (el) {
          el.indeterminate = isIndeterminate;
        }
      }}
      onChange={handleChange}
      disabled={disabled}
      className={cn(
        'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500',
        'dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
}
