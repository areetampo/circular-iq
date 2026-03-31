import PropTypes from 'prop-types';

import { GapAnalysisCard as SharedGapAnalysisCard } from '@/components/results/shared';

export function GapAnalysisCard({ actualResult }) {
  return <SharedGapAnalysisCard result={actualResult} variant="transparent" />;
}

GapAnalysisCard.propTypes = {
  actualResult: PropTypes.object,
};

export default GapAnalysisCard;
