import { Chip } from '@heroui/react';

import { getScoreClass } from '@/lib/scoring';

export default function ScoreOverview({ scoringResult }) {
  return (
    <div
      className="shadow-sm rounded-xl"
      style={{
        border: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs"
              style={{
                color: 'var(--muted)',
              }}
            >
              Overall Score
            </p>
            <p
              className={`text-4xl font-bold ${getScoreClass(scoringResult.overall_score)}`}
              style={{}}
            >
              {scoringResult.overall_score ?? 'N/A'}
              <span className="text-lg" style={{ color: 'var(--muted)' }}>
                /100
              </span>
            </p>
            {scoringResult?.metadata?.short_description && (
              <p
                className="text-sm mt-1"
                style={{
                  color: 'var(--muted)',
                }}
              >
                {scoringResult.metadata.short_description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {scoringResult?.metadata?.industry && (
                <Chip variant="secondary" size="sm">
                  {scoringResult.metadata.industry}
                </Chip>
              )}
              {scoringResult?.metadata?.scale && (
                <Chip variant="secondary" size="sm">
                  {scoringResult.metadata.scale}
                </Chip>
              )}
              {scoringResult?.metadata?.r_strategy && (
                <Chip variant="secondary" size="sm">
                  {scoringResult.metadata.r_strategy}
                </Chip>
              )}
              {scoringResult?.metadata?.primary_material && (
                <Chip variant="secondary" size="sm">
                  {scoringResult.metadata.primary_material}
                </Chip>
              )}
              {scoringResult?.metadata?.geographic_focus && (
                <Chip variant="secondary" size="sm">
                  {scoringResult.metadata.geographic_focus}
                </Chip>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {scoringResult?.confidence_level != null && (
              <Chip
                variant="soft"
                color="warning"
                size="sm"
                className="font-semibold text-xs px-3 py-1"
              >
                Confidence: {scoringResult.confidence_level}%
              </Chip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
