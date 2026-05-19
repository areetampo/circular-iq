/**
 * @module GapAnalysisCard
 * @description Gap analysis vs benchmarks with opportunities and weaknesses.
 */

import PropTypes from 'prop-types';

import { GapAnalysisCard as SharedGapAnalysisCard } from '@/components/results/shared';

/**
 * Gap analysis vs benchmarks with opportunities and weaknesses.
 *
 * @param {Object} props
 * @param {Object} props.actualResult
 * @returns {import('react').ReactElement}
 */
export default function GapAnalysisCard({ actualResult }) {
  return <SharedGapAnalysisCard result={actualResult} variant="transparent" />;
}

GapAnalysisCard.propTypes = {
  actualResult: PropTypes.object,
};
