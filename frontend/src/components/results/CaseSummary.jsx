import React from 'react';
import PropTypes from 'prop-types';

/**
 * CaseSummary Component
 * Displays case/project information passed via props
 * Fully presentational - no business logic
 *
 * Location: src/components/results/CaseSummary.jsx
 */
export function CaseSummary({ caseInfo = {}, problemSolution = {} }) {
  const { title, industry, scale, matchPercentage, sourceCaseId } = caseInfo;
  const { problem, solution } = problemSolution;

  return (
    <div>
      {title && (
        <div>
          <h3>{title}</h3>
          {matchPercentage !== null && matchPercentage !== undefined && (
            <span>{Math.round(matchPercentage)}% Match</span>
          )}
        </div>
      )}

      {(industry || scale || sourceCaseId) && (
        <div>
          {industry && (
            <div>
              <strong>Industry:</strong> {industry}
            </div>
          )}
          {scale && (
            <div>
              <strong>Scale:</strong> {scale}
            </div>
          )}
          {sourceCaseId && (
            <div>
              <strong>Case ID:</strong> #{sourceCaseId}
            </div>
          )}
        </div>
      )}

      {(problem || solution) && (
        <div>
          {problem && (
            <div>
              <h4>Problem:</h4>
              <p>{problem}</p>
            </div>
          )}
          {solution && (
            <div>
              <h4>Solution:</h4>
              <p>{solution}</p>
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
