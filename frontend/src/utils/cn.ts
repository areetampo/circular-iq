/**
 * @module cn
 * @description Utility for merging Tailwind/CSS class names safely.
 * Combines clsx with tailwind-merge to dedupe and merge Tailwind utility classes.
 *
 * @param {...import('clsx').ClassValue} inputs - CSS class names and conditional values.
 * @returns {string} Merged class string.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
