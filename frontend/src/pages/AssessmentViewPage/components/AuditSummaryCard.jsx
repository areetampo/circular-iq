import PropTypes from 'prop-types';

import { AuditSummaryCard as SharedAuditSummaryCard } from '@/components/results/shared';

export default function AuditSummaryCard({ scoringResult }) {
  return <SharedAuditSummaryCard result={scoringResult} variant="assessment" />;
}

AuditSummaryCard.propTypes = { scoringResult: PropTypes.object };
