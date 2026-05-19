/**
 * @module GlobalActivityPage
 * @description Route wrapper for the global activity / analytics dashboard.
 */

import { GlobalActivity, GlobalActivityHeader } from './components';

/**
 * Mounts the `GlobalActivity` charts and KPI layout.
 * @returns {import('react').ReactElement}
 */
export default function GlobalActivityPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      <GlobalActivityHeader
        title="Global Activity"
        description="Live insights from all circular economy assessments worldwide"
      />

      <GlobalActivity />
    </div>
  );
}
