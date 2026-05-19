/**
 * @module StrengthsGapsCard
 * @description Combined strengths and gaps summary from audit analysis.
 */

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip, SectionHeading } from '@/components/common';

/**
 * Combined strengths and gaps summary from audit analysis.
 *
 * @param {Object} props
 * @param {Array<string>} props.strengths
 * @param {Array<string>} props.gaps
 * @returns {import('react').ReactElement}
 */
export default function StrengthsGapsCard({ strengths, gaps, ...props }) {
  return (
    <div {...props} className="rounded-3xl border-2 border-(--color-border-ui) bg-transparent">
      <div className="p-2 sm:p-4">
        <SectionHeading variant="small" className="mb-6">
          Strengths & Gaps
        </SectionHeading>
        <p className="-mt-4 mb-4 text-sm text-(--color-text-muted)">
          Highlights from your assessment and improvement areas
        </p>
        <div className="space-y-4">
          <div className="rounded-xl bg-green-600/7 p-4">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-700" />
              <p className="text-sm font-medium text-(--color-text-primary)">Strengths</p>
            </div>
            <ul className="space-y-2 text-sm">
              {strengths.length > 0
                ? strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="mt-0.5 font-semibold text-(--color-text-primary)">•</span>
                      <span className="text-(--color-text-primary)">
                        {strength.issue || strength}
                        {strength.evidence_source_id && (
                          <Chip variant="case" className="ml-2 text-xs">
                            Case #{strength.evidence_source_id}
                          </Chip>
                        )}
                      </span>
                    </li>
                  ))
                : [
                    'Strong focus on material reuse and recycling',
                    'Clear value proposition for sustainability',
                    'Potential for scalable implementation',
                  ].map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <span className="mt-0.5 font-semibold text-(--color-text-primary)">•</span>
                      <span className="text-(--color-text-primary)">{strength}</span>
                    </li>
                  ))}
            </ul>
          </div>

          {gaps.length > 0 && (
            <div className="rounded-xl bg-red-600/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <AlertCircle size={20} className="text-orange-700" />
                <p className="text-sm font-medium text-(--color-text-primary)">
                  Areas for Improvement
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="mt-0.5 font-semibold text-(--color-text-primary)">•</span>
                    <span className="text-(--color-text-primary)">
                      {gap.issue || gap}
                      {gap.evidence_source_id && (
                        <Chip variant="case" className="ml-2 text-xs">
                          Case #{gap.evidence_source_id}
                        </Chip>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

StrengthsGapsCard.propTypes = {
  strengths: PropTypes.array,
  gaps: PropTypes.array,
};
