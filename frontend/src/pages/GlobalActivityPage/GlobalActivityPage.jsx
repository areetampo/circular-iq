/**
 * Route wrapper for the global activity analytics dashboard.
 */

import { GlobalActivity, GlobalActivityHeader } from './components';

/**
 * Renders the global activity dashboard shell with header copy and analytics content.
 *
 * @returns {import('react').ReactElement} Page layout containing the dashboard header and activity sections.
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
