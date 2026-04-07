import { Drawer } from '@heroui/react';
import { FileText } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import DRAWERS from '@/components/drawers/drawerTypes';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';

export default function ResultsDatabaseEvidenceDetailsDrawer({ data }) {
  const { drawer, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  // Check if this specific drawer is open and matches the expected type
  const isThisDrawerOpen =
    drawer?.type === DRAWERS.RESULTS_DATABASE_EVIDENCE_DETAILS && drawer?.isOpen;

  console.log('=== ResultsDatabaseEvidenceDetailsDrawer rendering ===');
  console.log('Received data:', data);
  console.log('Current drawer type:', drawer?.type);
  console.log('Is this drawer open:', isThisDrawerOpen);

  if (!data) return null;

  return (
    <Drawer
      isOpen={isThisDrawerOpen}
      shouldCloseOnInteractOutside={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(180,160,130,0.12)]">
                  <FileText size={16} className="text-[#7a5c2e]" strokeWidth={1.75} />
                </div>
                <div>
                  <Drawer.Heading className="drawer__heading">
                    {data.title || data.case_id || 'Case Details'}
                  </Drawer.Heading>
                  <p className="mt-0.5 text-[0.7rem] font-normal text-[#6b5f56]">
                    Detailed evidence and matched case context
                  </p>
                </div>
              </div>
            </Drawer.Header>

            <Drawer.Body className="space-y-6 p-6">
              {/* Meta Information */}
              <div className="mb-6 grid grid-cols-2 gap-4">
                {data.id && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                      Case ID
                    </span>
                    <p className="font-mono text-sm break-all text-(--color-text-primary)">
                      {data.id}
                    </p>
                  </div>
                )}
                {data.similarity && (
                  <div>
                    <p className="mb-1 text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                      Similarity
                    </p>
                    <Chip
                      variant="match"
                      color={
                        data.similarity >= 0.75
                          ? 'strong'
                          : data.similarity >= 0.5
                            ? 'decent'
                            : 'weak'
                      }
                    >
                      <span className="font-mono">{(data.similarity * 100).toFixed(1)}%</span>
                    </Chip>
                  </div>
                )}
                {data.source_display && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                      Source
                    </span>
                    <p className="text-sm text-(--color-text-primary)">{data.source_display}</p>
                  </div>
                )}
                {data.year && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold tracking-wider text-(--color-text-muted) uppercase">
                      Year
                    </span>
                    <p className="text-sm text-(--color-text-primary)">
                      {data.year || 'Not specified'}
                    </p>
                  </div>
                )}
              </div>

              {/* Problem Statement */}
              {data.problem && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                    Problem Statement
                  </h4>
                  <p className="text-sm/relaxed text-(--color-text-secondary)">{data.problem}</p>
                </div>
              )}

              {/* Solution Approach */}
              {data.solution && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                    Solution Approach
                  </h4>
                  <p className="text-sm/relaxed text-(--color-text-secondary)">{data.solution}</p>
                </div>
              )}

              {/* Impact */}
              {data.impact && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">Impact</h4>
                  <p className="text-sm/relaxed text-(--color-text-secondary)">{data.impact}</p>
                </div>
              )}

              {/* Materials */}
              {data.materials && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                    Materials
                  </h4>
                  <p className="font-mono text-sm/relaxed text-(--color-text-secondary)">
                    {data.materials}
                  </p>
                </div>
              )}

              {/* Circular Strategy */}
              {data.circular_strategy && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                    Circular Strategy
                  </h4>
                  <p className="font-mono text-sm/relaxed text-(--color-text-secondary)">
                    {data.circular_strategy}
                  </p>
                </div>
              )}

              {/* Industry */}
              {data.industry && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                    Industry
                  </h4>
                  <p className="text-sm/relaxed text-(--color-text-secondary)">{data.industry}</p>
                </div>
              )}

              {/* Location */}
              {data.location && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                    Location
                  </h4>
                  <p className="text-sm/relaxed text-(--color-text-secondary)">
                    {data.location || 'Not specified'}
                  </p>
                </div>
              )}

              {/* Use Type */}
              {data.use_type && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                    Use Type
                  </h4>
                  <p className="text-sm/relaxed text-(--color-text-secondary)">{data.use_type}</p>
                </div>
              )}

              {/* Category */}
              {data.category && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">
                    Category
                  </h4>
                  <p className="text-sm/relaxed text-(--color-text-secondary)">{data.category}</p>
                </div>
              )}

              {/* Case Scores */}
              {data.case_scores && (
                <div className="space-y-3">
                  <h4 className="mb-3 text-sm font-semibold text-(--color-text-primary)">
                    Performance Scores
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(data.case_scores).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg bg-(--color-bg-field) p-2"
                      >
                        <span className="text-xs font-medium text-(--color-text-muted) capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-sm font-semibold text-(--color-text-primary)">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source URL */}
              {data.source_url && (
                <div className="space-y-2">
                  <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">Source</h4>
                  <a
                    href={data.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm/relaxed break-all text-(--color-accent) hover:underline"
                  >
                    {data.source_url}
                  </a>
                </div>
              )}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

ResultsDatabaseEvidenceDetailsDrawer.propTypes = {
  data: PropTypes.object,
};
