import { AlertCircle, CheckCircle2 } from 'lucide-react';
import PropTypes from 'prop-types';

import { Chip } from '@/components/common';
import { SectionHeading } from '@/components/common/SectionHeading';

export function StrengthsGapsCard({ strengths, gaps }) {
  return (
    <div className="border-2 border-[rgba(180,160,130,0.25)] rounded-3xl bg-transparent">
      <div className="p-2 sm:p-4">
        <SectionHeading variant="small" className="mb-6">
          Strengths & Gaps
        </SectionHeading>
        <p className="text-sm mb-4 -mt-4" style={{ color: 'var(--muted)' }}>
          Highlights from your assessment and improvement areas
        </p>
        <div className="space-y-4">
          <div
            className="p-4 rounded-xl border-2"
            style={{
              background: 'var(--background-secondary)',
              borderColor: 'rgba(107,142,109,0.3)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={20} style={{ color: '#6B8E6D' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Strengths
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              {strengths.length > 0 ? (
                strengths.map((strength, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                      •
                    </span>
                    <span
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      {strength.issue || strength}
                      {strength.evidence_source_id && (
                        <Chip variant="case" className="ml-2 text-xs">
                          Case #{strength.evidence_source_id}
                        </Chip>
                      )}
                    </span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                      •
                    </span>
                    <span
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      Strong focus on material reuse and recycling
                    </span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                      •
                    </span>
                    <span
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      Clear value proposition for sustainability
                    </span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                      •
                    </span>
                    <span
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
                      Potential for scalable implementation
                    </span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {gaps.length > 0 && (
            <div
              className="p-4 rounded-xl border-2"
              style={{
                background: 'var(--background-secondary)',
                borderColor: 'rgba(195,75,75,0.3)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} style={{ color: '#C3916B' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  Areas for Improvement
                </p>
              </div>
              <ul className="space-y-2 text-sm">
                {gaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="font-semibold mt-0.5" style={{ color: 'var(--foreground)' }}>
                      •
                    </span>
                    <span
                      style={{
                        color: 'var(--foreground)',
                      }}
                    >
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

export default StrengthsGapsCard;
