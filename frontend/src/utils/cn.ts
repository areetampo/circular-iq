import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with clsx and tailwind-merge deduplication.
 *
 * @param {...ClassValue} inputs - Conditional class values accepted by `clsx`.
 * @returns {string} Conflict-resolved className string safe to pass to React elements.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
