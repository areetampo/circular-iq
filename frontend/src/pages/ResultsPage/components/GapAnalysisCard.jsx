/** Results-page wrapper for shared gap analysis (benchmark gaps, opportunities, weaknesses). */

import PropTypes from 'prop-types';

import { GapAnalysisCard as SharedGapAnalysisCard } from '@/components/results/shared';

/**
 * Passes ResultsPage audit data into the shared transparent gap-analysis card.
 */
export default function GapAnalysisCard({ actualResult }) {
  return <SharedGapAnalysisCard result={actualResult} variant="transparent" />;
}

GapAnalysisCard.propTypes = {
  actualResult: PropTypes.object,
};
