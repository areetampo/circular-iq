/**
 * @module AuditSummaryCard
 * @description High-level audit summary card (tier, confidence, headline metrics) on Results.
 */

import PropTypes from 'prop-types';

import { AuditSummaryCard as SharedAuditSummaryCard } from '@/components/results/shared';

/**
 * High-level audit summary card (tier, confidence, headline metrics) on Results.
 *
 * @param {Object} props
 * @param {Object} props.actualResult
 * @returns {import('react').ReactElement}
 */
export default function AuditSummaryCard({ actualResult }) {
  return <SharedAuditSummaryCard result={actualResult} variant="transparent" />;
}

AuditSummaryCard.propTypes = {
  actualResult: PropTypes.object,
};
