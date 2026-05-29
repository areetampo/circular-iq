/**
 * Lists database evidence snippets supporting the scoring audit.
 */

import { FileText, FolderSearch, MoveRight } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip, SectionHeading, Tilt3D } from '@/components/common';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { getMatchStrength } from '@/utils/content';

/**
 * Lists similar cases with match strength chips and opens case details from the results drawer.
 */
export default function DatabaseEvidenceCard({ actualResult, casesSummaries }) {
  const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();

  return (
    <div data-export-section="database-evidence">
      <SectionHeading variant="small" icon={<FileText className="size-4 text-(--color-accent)" />}>
        Database Evidence
      </SectionHeading>

      {/* Description */}
      <p className="-mt-3 mb-6 text-sm text-(--color-text-secondary)">
        Similar cases and benchmark comparisons from the dataset
      </p>

      {/* Cases list */}
      <div className="space-y-1">
        {actualResult.similar_cases && actualResult.similar_cases.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {actualResult.similar_cases.map((caseItem, index) => {
              // const sourceCaseId = caseItem.id || `case-${index}`;
              const caseTitle =
                caseItem.title || casesSummaries[index] || `Related Case ${index + 1}`;
              const matchPercentage = Math.round((caseItem.similarity || 0) * 100).toFixed(1);
              const matchStrength = getMatchStrength(caseItem.similarity || 0);

              return (
                <Tilt3D
                  rotateRange={{ x: 4, y: 6 }}
                  block
                  key={index}
                  className="group flex h-full cursor-pointer items-start gap-4 rounded-xl border-2 border-(--color-border-strong) p-4 transition-all duration-200 hover:bg-(--color-accent-light)"
                  onClick={() => openResultsDatabaseEvidenceDetailsDrawer(caseItem)}
                >
                  <div className="flex flex-1 flex-col gap-3">
                    <h4 className="text-lg text-(--color-text-primary)">{caseTitle}</h4>

                    {/* Year + Location + Use type + Source + Category + Circular Strategy + Materials chips */}
                    <div className="flex flex-wrap gap-2">
                      {caseItem.year && <Chip variant="source">{caseItem.year}</Chip>}
                      {caseItem.location && <Chip variant="source">{caseItem.location}</Chip>}
                      {caseItem.use_type && <Chip variant="source">{caseItem.use_type}</Chip>}
                      {caseItem.source_display && (
                        <Chip variant="source">{caseItem.source_display}</Chip>
                      )}
                      {caseItem.category && <Chip variant="source">{caseItem.category}</Chip>}
                      {caseItem.circular_strategy && (
                        <Chip variant="strategy">{caseItem.circular_strategy}</Chip>
                      )}
                      {caseItem.materials && <Chip variant="materials">{caseItem.materials}</Chip>}
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-3">
                        <Chip variant="match" color={matchStrength}>
                          {`${matchPercentage}% match`}
                        </Chip>
                      </div>

                      {/* View details link */}
                      <div className="flex items-center gap-2 text-sm font-medium opacity-75 hover:underline">
                        View details
                        <MoveRight
                          size={16}
                          className="transition-transform group-hover:translate-x-0.75"
                        />
                      </div>
                    </div>
                  </div>
                </Tilt3D>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <FolderSearch size={35} className="text-(--color-text-muted)" />
            <p className="text-md text-(--color-text-muted)">
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
