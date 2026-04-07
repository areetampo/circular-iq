import PropTypes from 'prop-types';

import { Chip } from '@/components/common';

/**
 * CaseSummary Component
 * Displays case/project information passed via props
 * Fully presentational - no business logic
 *
 * Location: src/pages/ResultsPage/components/CaseSummary.jsx
 */
export function CaseSummary({ caseInfo = {}, problemSolution = {} }) {
  const { title, industry, scale, matchPercentage, sourceCaseId } = caseInfo;
  const { problem, solution } = problemSolution;

  return (
    <div className="mt-6 border-t border-border pt-6">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="mb-1 text-lg font-bold text-(--color-text-primary)">
            {title || 'Case Study'}
          </h3>
          <div className="flex items-center gap-3 text-sm text-(--color-text-secondary)">
            {industry && <span>{industry}</span>}
            {scale && <span>• {scale}</span>}
            {sourceCaseId && <span>• Case #{sourceCaseId}</span>}
          </div>
        </div>
        {matchPercentage !== null && matchPercentage !== undefined && (
          <Chip variant="info" color="default" className="font-mono">
            {Math.round(matchPercentage)}% Match
          </Chip>
        )}
      </div>

      {/* Problem & Solution */}
      {(problem || solution) && (
        <div className="space-y-4">
          {problem && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">Problem</h4>
              <p className="text-sm/relaxed text-(--color-text-secondary)">{problem}</p>
            </div>
          )}
          {solution && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-(--color-text-primary)">Solution</h4>
              <p className="text-sm/relaxed text-(--color-text-secondary)">{solution}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

CaseSummary.propTypes = {
  caseInfo: PropTypes.shape({
    title: PropTypes.string,
    industry: PropTypes.string,
    scale: PropTypes.string,
    matchPercentage: PropTypes.number,
    sourceCaseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  problemSolution: PropTypes.shape({
    problem: PropTypes.string,
    solution: PropTypes.string,
  }),
};
