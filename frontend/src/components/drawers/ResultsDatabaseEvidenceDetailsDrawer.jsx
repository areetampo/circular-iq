import { Drawer } from '@heroui/react';
import { ExternalLink, FileText, X } from 'lucide-react';

import { useGlobalDrawer } from '@/contexts/DrawerContext';

export default function ResultsDatabaseEvidenceDetailsDrawer() {
  const { drawerData: caseData, isDrawerOpen, closeDrawer } = useGlobalDrawer();

  if (!caseData) return null;

  return (
    <Drawer isOpen={isDrawerOpen} onClose={closeDrawer} placement="right">
      <Drawer.Backdrop className="bg-black/15 backdrop-blur-sm" />
      <Drawer.Content className="bg-(--color-bg) border-l border-(--color-border-strong) w-full sm:w-130 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-(--color-border) shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-(--color-accent-light) rounded-md flex items-center justify-center text-(--color-accent) shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-base text-(--color-text-primary) font-(--font-body)">
                {caseData.title || caseData.case_id || 'Case Details'}
              </h2>
              <p className="text-xs text-(--color-text-muted) mt-0.5">
                Detailed evidence and matched case context
              </p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center rounded text-(--color-text-muted) hover:text-(--color-text-primary) hover:bg-(--color-accent-light) transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Meta tags */}
          <div className="flex flex-wrap gap-2">
            {caseData.case_id && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)">
                {caseData.case_id}
              </span>
            )}
            {caseData.match_quality && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border) uppercase tracking-wide">
                {caseData.match_quality}
              </span>
            )}
            {caseData.year && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)">
                {caseData.year}
              </span>
            )}
            {caseData.location && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)">
                {caseData.location}
              </span>
            )}
            {caseData.industry && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)">
                {caseData.industry}
              </span>
            )}
          </div>

          {/* Summary / description */}
          {(caseData.description || caseData.summary) && (
            <div className="border-l-2 border-(--color-accent) pl-3 py-1">
              <p className="text-sm text-(--color-text-secondary) leading-relaxed italic">
                {caseData.description || caseData.summary}
              </p>
            </div>
          )}

          {/* Problem Addressed */}
          {caseData.problem_addressed && (
            <div>
              <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-2 border-t border-(--color-border) pt-4">
                Problem Addressed
              </p>
              <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                {caseData.problem_addressed}
              </p>
            </div>
          )}

          {/* Solution Approach */}
          {caseData.solution_approach && (
            <div>
              <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-2 border-t border-(--color-border) pt-4">
                Solution Approach
              </p>
              <p className="text-sm text-(--color-text-secondary) leading-relaxed">
                {caseData.solution_approach}
              </p>
            </div>
          )}

          {/* R-Strategy */}
          {caseData.r_strategy && (
            <div>
              <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-2 border-t border-(--color-border) pt-4">
                R-Strategy
              </p>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-(--color-accent-light) text-(--color-text-secondary) border border-(--color-border)">
                {caseData.r_strategy}
              </span>
            </div>
          )}

          {/* Materials */}
          {caseData.materials && (
            <div>
              <p className="text-xs uppercase tracking-widest text-(--color-text-muted) mb-2 border-t border-(--color-border) pt-4">
                Materials
              </p>
              <p className="text-sm text-(--color-text-secondary)">
                {Array.isArray(caseData.materials)
                  ? caseData.materials.join(', ')
                  : caseData.materials}
              </p>
            </div>
          )}

          {/* Source link */}
          {caseData.source_url && (
            <div className="border-t border-(--color-border) pt-4">
              <a
                href={caseData.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-(--color-accent) hover:underline flex items-center gap-1.5"
              >
                <ExternalLink size={13} />
                View Source
              </a>
            </div>
          )}
        </div>
      </Drawer.Content>
    </Drawer>
  );
}

ResultsDatabaseEvidenceDetailsDrawer.propTypes = {};
