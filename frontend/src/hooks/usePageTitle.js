import { useEffect } from 'react';

import { SITE_NAME } from '@/components/common';

const APP_NAME = SITE_NAME;

/**
 * Applies a page-specific document title while the caller is mounted.
 * Restores the previous `document.title` during cleanup so nested pages leave earlier titles intact.
 *
 * @param {string|undefined} title - Page segment; omit or pass empty for app name only.
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
