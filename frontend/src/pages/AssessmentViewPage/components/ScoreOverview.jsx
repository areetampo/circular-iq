import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

export default function ScoreOverview({ scoringResult }) {
  return (
    <div className="py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-(--color-text-muted)">
            Overall Score
          </p>
          <p className="font-(--font-display) text-7xl text-(--color-text-primary)">
            {scoringResult.overall_score ?? 'N/A'}
            <span className="text-lg text-(--color-text-muted)">/100</span>
          </p>
          {scoringResult?.metadata?.short_description && (
            <p className="text-sm text-(--color-text-muted) mt-1">
              {scoringResult.metadata.short_description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {scoringResult?.metadata?.industry && (
              <Chip variant="tag">{scoringResult.metadata.industry}</Chip>
            )}
            {scoringResult?.metadata?.scale && (
              <Chip variant="tag">{scoringResult.metadata.scale}</Chip>
            )}
            {scoringResult?.metadata?.r_strategy && (
              <Chip variant="tag">{scoringResult.metadata.r_strategy}</Chip>
            )}
            {scoringResult?.metadata?.primary_material && (
              <Chip variant="tag">{scoringResult.metadata.primary_material}</Chip>
            )}
            {scoringResult?.metadata?.geographic_focus && (
              <Chip variant="tag">{scoringResult.metadata.geographic_focus}</Chip>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {scoringResult?.confidence_level != null && (
            <Chip variant="score" size="sm" className="font-semibold text-xs px-3 py-1">
              Confidence: {scoringResult.confidence_level}%
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}

ScoreOverview.propTypes = {
  scoringResult: PropTypes.object.isRequired,
};
