import { Chip, Drawer } from '@heroui/react';
import { ExternalLink, Lightbulb, MapPin, NotebookText, Target, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function ResultsDatabaseEvidenceDetailsDrawer({ data = {} }) {
  // if data is {} return null
  if (Object.keys(data).length === 0) return null;
  const {
    title = '',
    content = '',
    caseItem = null,
    matchPercentage = null,
    matchStrengthLabel = '',
    matchColor = '',
    sourceCaseId = null,
  } = data;

  // Robust fallback for partial invocation from AssessmentComparisonPage
  const derivedMatchPercentage =
    matchPercentage != null
      ? matchPercentage
      : caseItem?.similarity != null
        ? Math.round(caseItem.similarity * 100)
        : null;
  const derivedMatchStrengthLabel =
    matchStrengthLabel ||
    (derivedMatchPercentage >= 80
      ? 'Very Strong Match'
      : derivedMatchPercentage >= 60
        ? 'Strong Match'
        : derivedMatchPercentage >= 40
          ? 'Moderate Match'
          : derivedMatchPercentage != null
            ? 'Weak Match'
            : 'No match label');
  const derivedMatchColor =
    matchColor ||
    (derivedMatchPercentage >= 80
      ? '#22c55e'
      : derivedMatchPercentage >= 60
        ? '#3b82f6'
        : derivedMatchPercentage >= 40
          ? '#f59e0b'
          : derivedMatchPercentage != null
            ? '#ef4444'
            : '#94a3b8');
  const derivedSourceCaseId =
    sourceCaseId ?? caseItem?.id ?? caseItem?.source_case_id ?? caseItem?.sourceId ?? null;

  const derivedTitle =
    title || caseItem?.title || caseItem?.case_title || `Case ${derivedSourceCaseId || 'N/A'}`;
  const derivedContent = content || caseItem?.summary || caseItem?.problem || '';

  // Use structured fields from caseItem (preferred) — these are now cleaned
  // by the LLM cleanup pass before being sent to the frontend
  const problem = caseItem?.problem || derivedContent || '';
  const solution = caseItem?.solution || '';
  const impact = caseItem?.impact || '';
  const summary = caseItem?.summary || '';
  const year = caseItem?.year || '';
  const location = caseItem?.location || '';
  const useType = caseItem?.use_type || '';
  const sourceDisplay = caseItem?.source_display || '';
  const sourceUrl = caseItem?.source_url || '';
  const materials = caseItem?.materials || '';
  const circularStrategy = caseItem?.circular_strategy || '';
  const caseScores = caseItem?.case_scores || null;

  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger aria-label="Close drawer" />}
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg bg-slate-100 shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                  >
                    <NotebookText className="size-5 text-slate-600" />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      {derivedTitle || 'Evidence Details'}
                    </Drawer.Heading>
                    <p className="text-sm text-gray-600">
                      Detailed evidence and matched case context
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Header>

            <Drawer.Body className="gap-6 mt-4">
              <div className="space-y-6">
                {/* ── Metadata badges ──────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-gray-100">
                  {derivedMatchPercentage != null && (
                    <>
                      <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-md bg-gray-100 font-semibold text-gray-600">
                        <NotebookText className="size-4" />
                        <span>Case {derivedSourceCaseId}</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <Chip
                        size="sm"
                        variant="secondary"
                        className="text-xs font-bold text-white"
                        style={{ backgroundColor: derivedMatchColor }}
                      >
                        {derivedMatchPercentage}% Similar
                      </Chip>
                      <span className="text-gray-300">•</span>
                      <span
                        className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: derivedMatchColor }}
                      >
                        {derivedMatchStrengthLabel}
                      </span>
                    </>
                  )}

                  {/* Year + Location + Use type */}
                  {(year || location || useType) && (
                    <div className="flex flex-wrap gap-2 mt-1 w-full">
                      {year && (
                        <Chip size="sm" variant="secondary" className="text-xs">
                          {year}
                        </Chip>
                      )}
                      {location && (
                        <Chip
                          size="sm"
                          variant="secondary"
                          className="text-xs flex items-center gap-1"
                        >
                          <MapPin size={10} />
                          {location}
                        </Chip>
                      )}
                      {useType && (
                        <Chip size="sm" variant="secondary" className="text-xs">
                          {useType}
                        </Chip>
                      )}
                    </div>
                  )}

                  {/* Strategy + Materials + Source */}
                  <div className="flex flex-wrap gap-2 mt-1 w-full">
                    {circularStrategy && (
                      <Chip size="sm" variant="flat" color="success" className="text-xs">
                        {circularStrategy}
                      </Chip>
                    )}
                    {materials && (
                      <Chip size="sm" variant="flat" color="default" className="text-xs">
                        {materials}
                      </Chip>
                    )}
                    {sourceDisplay && (
                      <a
                        href={sourceUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <ExternalLink size={10} />
                        {sourceDisplay}
                      </a>
                    )}
                  </div>
                </div>

                {/* ── Summary ──────────────────────────────────────────────────── */}
                {summary && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700 leading-relaxed italic">{summary}</p>
                  </div>
                )}

                {/* ── Problem ──────────────────────────────────────────────────── */}
                {problem && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-emerald-600">
                      <Target className="size-5 text-emerald-600" strokeWidth={2} />
                      <h3 className="text-base font-semibold text-gray-900">Problem Addressed</h3>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-sm leading-7 text-gray-700">{problem}</p>
                    </div>
                  </div>
                )}

                {/* ── Solution ─────────────────────────────────────────────────── */}
                {solution && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-emerald-600">
                      <Lightbulb className="size-5 text-emerald-600" strokeWidth={2} />
                      <h3 className="text-base font-semibold text-gray-900">Solution Approach</h3>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-sm leading-7 text-gray-700">{solution}</p>
                    </div>
                  </div>
                )}

                {/* ── Impact ───────────────────────────────────────────────────── */}
                {impact && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-blue-500">
                      <TrendingUp className="size-5 text-blue-500" strokeWidth={2} />
                      <h3 className="text-base font-semibold text-gray-900">Impact & Outcomes</h3>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-sm leading-7 text-gray-700">{impact}</p>
                    </div>
                  </div>
                )}

                {/* ── Score Comparison ─────────────────────────────────────────── */}
                {caseScores && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-purple-500">
                      <NotebookText className="size-5 text-purple-500" strokeWidth={2} />
                      <h3 className="text-base font-semibold text-gray-900">
                        Their Scores vs Yours
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(caseScores).map(([factor, caseScore]) => {
                        const userScore = caseItem?.metadata?.scores
                          ? null // user scores not stored on caseItem — shown via label only
                          : null;
                        const label = factor
                          .split('_')
                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                          .join(' ');
                        const diff = null; // user scores not available here — show case score only
                        const barColor =
                          caseScore >= 75
                            ? 'bg-green-500'
                            : caseScore >= 50
                              ? 'bg-blue-500'
                              : caseScore >= 25
                                ? 'bg-amber-500'
                                : 'bg-red-500';
                        return (
                          <div key={factor} className="flex items-center gap-3">
                            <div className="w-32 text-xs font-medium text-slate-600 truncate shrink-0">
                              {label}
                            </div>
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${barColor}`}
                                style={{ width: `${caseScore}%` }}
                              />
                            </div>
                            <div className="text-xs font-bold text-slate-700 w-8 text-right shrink-0">
                              {caseScore}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 italic">
                      Scores assigned to this case from the database.
                    </p>
                  </div>
                )}
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

ResultsDatabaseEvidenceDetailsDrawer.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string,
    content: PropTypes.string,
    caseItem: PropTypes.object,
    matchPercentage: PropTypes.number,
    matchStrengthLabel: PropTypes.string,
    matchColor: PropTypes.string,
    sourceCaseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
};
