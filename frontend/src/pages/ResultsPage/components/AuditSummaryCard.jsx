import PropTypes from 'prop-types';

import { AuditSummaryCard as SharedAuditSummaryCard } from '@/components/results/shared';

export function AuditSummaryCard({ actualResult }) {
  return <SharedAuditSummaryCard result={actualResult} variant="transparent" />;
}

AuditSummaryCard.propTypes = {
  actualResult: PropTypes.object,
};

export default AuditSummaryCard;
