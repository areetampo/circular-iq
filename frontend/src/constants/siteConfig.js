/**
 * Site-wide configuration constants
 * Centralized location for app-wide settings
 */

import Logo from '@/components/common/Logo';

export const SITE_CONFIG = {
  url: 'https://circular-economy-evaluator.vercel.app',
  name: 'CEE',
  fullName: 'Circular Economy Evaluation Platform',
  tagline: 'Sustainable Business Solutions',
  logo: Logo,
  contact: {
    supportEmail: 'zahooriareeb47@gmail.com',
    github: 'https://github.com/areetampo/circular-economy',
  },
  metadata: {
    description: 'A platform for assessing circular economy metrics.',
    keywords: ['sustainability', 'circular economy', 'business assessment'],
  },
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
};

export default SITE_CONFIG;
