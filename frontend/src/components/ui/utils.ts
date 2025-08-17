import { type ClassValue, clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import { twMerge } from 'tailwind-merge';

/**
 * Combine multiple class names together and merge Tailwind CSS classes
 * @param inputs - Class names or class name objects to merge
 * @returns Merged class names string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 * @param date - Date object or string to format
 * @param options - Intl.DateTimeFormatOptions to customize the output format
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
) {
  return new Intl.DateTimeFormat('fr-FR', options).format(new Date(date));
}

/**
 * Format a number to a currency string
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'EUR')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR'
): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncate a string to a specified length
 * @param str - String to truncate
 * @param length - Maximum length of the string
 * @returns Truncated string with ellipsis if needed
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

/**
 * Generate a stable unique ID using UUID
 * @param length - Length of the ID (default: 8, ignored when using UUID)
 * @returns Stable unique ID
 */
export function generateId(length: number = 8): string {
  // Use UUID for stable, unique IDs to avoid React DOM conflicts
  return uuidv4();
}

/**
 * Debounce a function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Check if a value is empty
 * @param value - Value to check
 * @returns Boolean indicating if the value is empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
}
