import { ArrowRight, FileText, Frown } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { SectionHeading } from '@/components/common/SectionHeading';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { getMatchStrength } from '@/utils/content';

export function DatabaseEvidenceCard({ actualResult, casesSummaries }) {
  const { openResultsDatabaseEvidenceDetailsDrawer, drawer } = useGlobalDrawer();

  const handleViewDetails = (caseItem) => {
    console.log('=== Clicking View Details ===');
    console.log('Current drawer state:', drawer);
    console.log('Case item being opened:', caseItem);

    // Debug: Check if the function exists and is callable
    if (typeof openResultsDatabaseEvidenceDetailsDrawer !== 'function') {
      console.error('openResultsDatabaseEvidenceDetailsDrawer is not a function!');
      return;
    }

    // Call the drawer opening function
    openResultsDatabaseEvidenceDetailsDrawer(caseItem);
  };

  return (
    <div
      className="border-t border-(--color-border) pt-8 mt-8"
      data-export-section="database-evidence"
    >
      <SectionHeading variant="small" icon={<FileText className="w-4 h-4 text-(--color-accent)" />}>
        Database Evidence
      </SectionHeading>

      {/* Description */}
      <p className="text-sm text-(--color-text-secondary) mb-6">
        Similar cases and benchmark comparisons from the dataset
      </p>

      {/* Cases list */}
      <div className="space-y-1">
        {actualResult.similar_cases && actualResult.similar_cases.length > 0 ? (
          <div className="space-y-2">
            {actualResult.similar_cases.map((caseItem, index) => {
              const matchPercentage = Math.round((caseItem.similarity || 0) * 100);
              const sourceCaseId = caseItem.id || `case-${index}`;
              const caseTitle =
                caseItem.title || casesSummaries[index] || `Related Case ${index + 1}`;
              const { label: matchStrengthLabel, color: matchColor } = getMatchStrength(
                caseItem.similarity || 0,
              );

              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 border-2 rounded-xl border-(--color-border) hover:bg-(--color-accent-light) transition-all duration-200 cursor-pointer group"
                  onClick={() => handleViewDetails(caseItem)}
                >
                  {/* Case content */}
                  <div className="flex-1">
                    <h4 className="text-md font-medium text-(--color-text-primary) mb-2">
                      <span className="font-mono">{caseTitle}</span>
                    </h4>

                    {/* Year + Location + Use type + Source + Category + Circular Strategy + Materials chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {caseItem.year && <Chip variant="source">{caseItem.year}</Chip>}
                      {caseItem.location && <Chip variant="source">{caseItem.location}</Chip>}
                      {caseItem.use_type && <Chip variant="source">{caseItem.use_type}</Chip>}
                      {caseItem.source_display && (
                        <Chip variant="source">{caseItem.source_display}</Chip>
                      )}
                      {caseItem.category && <Chip variant="source">{caseItem.category}</Chip>}
                      {caseItem.circular_strategy && (
                        <Chip variant="strategy">
                          <span className="font-mono">{caseItem.circular_strategy}</span>
                        </Chip>
                      )}
                      {caseItem.materials && (
                        <Chip variant="materials">
                          <span className="font-mono">{caseItem.materials}</span>
                        </Chip>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Chip variant="match" color={matchColor}>
                        <span className="font-mono">{matchPercentage}% match</span>
                      </Chip>
                    </div>
                  </div>

                  {/* View details link */}
                  <div className="flex items-center gap-2 text-sm hover:underline font-medium text-(--color-accent-dark)">
                    View details
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
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
