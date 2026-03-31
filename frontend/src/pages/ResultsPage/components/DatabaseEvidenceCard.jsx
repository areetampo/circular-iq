import { ArrowRight, FileText, Frown } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { getMatchStrength } from '@/utils/content';

export function DatabaseEvidenceCard({ actualResult, casesSummaries }) {
  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

  return (
    <div
      className="border-t border-(--color-border) pt-8 mt-8"
      data-export-section="database-evidence"
    >
      {/* Section heading with icon */}
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-4 h-4 text-(--color-accent)" />
        <h3 className="text-xs uppercase tracking-widest text-(--color-text-muted)">
          Database Evidence
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-(--color-text-secondary) mb-6">
        Similar cases and benchmark comparisons from the dataset
      </p>

      {/* Cases list */}
      <div>
        {actualResult.similar_cases && actualResult.similar_cases.length > 0 ? (
          <div className="space-y-0">
            {actualResult.similar_cases.map((caseItem, index) => {
              const matchPercentage = Math.round((caseItem.similarity || 0) * 100);
              const sourceCaseId = caseItem.id || `case-${index}`;
              const caseTitle =
                caseItem.title || casesSummaries[index] || `Related Case ${index + 1}`;
              const { label: matchStrengthLabel } = getMatchStrength(caseItem.similarity || 0);

              return (
                <div
                  key={index}
                  className="flex items-start gap-3 py-3 border-b border-(--color-border) last:border-0 cursor-pointer hover:bg-(--color-accent-light) transition-colors"
                  onClick={() => openResultsDatabaseEvidenceDetailsDrawer(caseItem)}
                >
                  {/* Case content */}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-(--color-text-primary) mb-1">
                      {caseTitle}
                    </h4>

                    {/* Year + Location + Use type chips */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {caseItem.year && <Chip variant="tag">{caseItem.year}</Chip>}
                      {caseItem.location && <Chip variant="tag">{caseItem.location}</Chip>}
                      {caseItem.use_type && <Chip variant="tag">{caseItem.use_type}</Chip>}
                    </div>

                    {/* Match quality chip */}
                    <div className="flex items-center gap-2">
                      <Chip variant="status">{matchStrengthLabel}</Chip>
                      <span className="text-xs text-(--color-text-muted)">
                        {matchPercentage}% match
                      </span>
                    </div>
                  </div>

                  {/* View details link */}
                  <div className="flex items-center gap-1 text-xs text-(--color-accent) hover:underline">
                    View details
                    <ArrowRight size={12} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <Frown size={40} className="text-(--color-text-muted)" />
            <p className="text-sm text-(--color-text-muted)">
              No similar cases were found in the database for this assessment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

DatabaseEvidenceCard.propTypes = {
  actualResult: PropTypes.object.isRequired,
  casesSummaries: PropTypes.arrayOf(PropTypes.string),
};

export default DatabaseEvidenceCard;
