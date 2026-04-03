import { Drawer } from '@heroui/react';
import { ExternalLink, FileText } from 'lucide-react';
import PropTypes from 'prop-types';

import DRAWERS from '@/components/drawers/drawerTypes';
import { useGlobalDrawer } from '@/contexts/DrawerContext';

export default function ResultsDatabaseEvidenceDetailsDrawer({ data }) {
  const { drawer, onClose } = useGlobalDrawer();

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
      <Drawer.Backdrop variant="blur" />
      <Drawer.Content
        placement="right"
        className="bg-(--color-bg) border-l border-(--color-border-strong) w-full sm:w-130 overflow-y-auto"
      >
        <Drawer.Dialog>
          <Drawer.Header>
            <div className="flex items-start justify-between p-6 border-b border-(--color-border) shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-(--color-accent-light) rounded-2xl flex items-center justify-center text-(--color-accent) shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <Drawer.Heading className="font-(--font-display) text-[18px] text-(--color-text-primary) tracking-[-0.02em]">
                    {data.title || data.case_id || 'Case Details'}
                  </Drawer.Heading>
                  <p className="text-[12px] text-(--color-text-muted) mt-1">
                    Detailed evidence and matched case context
                  </p>
                </div>
              </div>
            </div>
          </Drawer.Header>

          <Drawer.Body className="p-6 space-y-6">
            {/* Meta tags */}
            <div className="flex flex-wrap gap-2">
              {data.case_id && (
                <span className="text-[11px] px-3 py-1 rounded-xl bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)">
                  {data.case_id}
                </span>
              )}
              {data.match_quality && (
                <span className="text-[11px] px-3 py-1 rounded-xl bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border) uppercase tracking-widest">
                  {data.match_quality}
                </span>
              )}
              {data.year && (
                <span className="text-[11px] px-3 py-1 rounded-xl bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)">
                  {data.year}
                </span>
              )}
              {data.location && (
                <span className="text-[11px] px-3 py-1 rounded-xl bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)">
                  {data.location}
                </span>
              )}
              {data.industry && (
                <span className="text-[11px] px-3 py-1 rounded-xl bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)">
                  {data.industry}
                </span>
              )}
            </div>

            {/* Summary / description */}
            {(data.description || data.summary) && (
              <div className="border-l-3 border-(--color-accent) pl-4 py-2 bg-(--color-accent-light) rounded-r-2xl">
                <p className="text-[13px] text-(--color-text-secondary) leading-relaxed italic">
                  {data.description || data.summary}
                </p>
              </div>
            )}

            {/* Problem */}
            {data.problem && (
              <div>
                <h3 className="text-[14px] font-semibold text-(--color-text-primary) mb-2">
                  Problem Statement
                </h3>
                <p className="text-[13px] text-(--color-text-secondary) leading-relaxed">
                  {data.problem}
                </p>
              </div>
            )}

            {/* Solution */}
            {data.solution && (
              <div>
                <h3 className="text-[14px] font-semibold text-(--color-text-primary) mb-2">
                  Solution Approach
                </h3>
                <p className="text-[13px] text-(--color-text-secondary) leading-relaxed">
                  {data.solution}
                </p>
              </div>
            )}

            {/* Materials */}
            {data.materials && (
              <div>
                <p className="text-[10px] tracking-widest text-(--color-text-muted) mb-2 border-t border-(--color-border) pt-4 font-semibold">
                  Materials
                </p>
                <p className="text-[13px] text-(--color-text-secondary)">
                  {Array.isArray(data.materials) ? data.materials.join(', ') : data.materials}
                </p>
              </div>
            )}
          </Drawer.Body>

          {/* Source link */}
          {data.source_url && (
            <div className="border-t border-(--color-border) pt-4">
              <a
                href={data.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-(--color-accent) hover:underline flex items-center gap-1.5 font-semibold"
              >
                <ExternalLink size={14} />
                View Source
              </a>
            </div>
          )}
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer>
  );
}

ResultsDatabaseEvidenceDetailsDrawer.propTypes = {
  data: PropTypes.object,
};
