/** Results-page wrapper for the shared audit summary (tier, confidence, headline metrics). */

import PropTypes from 'prop-types';

import { AuditSummaryCard as SharedAuditSummaryCard } from '@/components/results/shared';

/**
 * Passes ResultsPage audit data into the shared transparent audit-summary card.
 */
export default function AuditSummaryCard({ actualResult }) {
  return <SharedAuditSummaryCard result={actualResult} variant="transparent" />;
}

AuditSummaryCard.propTypes = {
  actualResult: PropTypes.object,
};
