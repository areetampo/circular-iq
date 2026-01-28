import React from 'react';
import PropTypes from 'prop-types';
import { extractCaseInfo, extractProblemSolution } from '../../utils/helpers';

export default function EvidenceCard({ caseItem, index, totalCases, caseTitle, onViewContext }) {
  const { matchPercentage, sourceCaseId, content } = extractCaseInfo(caseItem, index);

  // Use structured metadata if available, otherwise parse content
  const { problem: problemText, solution: solutionText } = extractProblemSolution(caseItem);

  // Get match strength label
  const getMatchStrength = (percentage) => {
    if (percentage >= 80) return { label: 'Excellent Match', color: '#059669' };
    if (percentage >= 65) return { label: 'Strong Match', color: '#34a83a' };
    if (percentage >= 50) return { label: 'Decent Match', color: '#65a30d' };
    return { label: 'Poor Match', color: '#ca8a04' };
  };

  const matchStrength = getMatchStrength(matchPercentage);

  return (
    <div className="">
      {index > 0 && <div className="mb-6 h-[1.5px] w-[50%] mx-auto bg-slate-300" />}
      <div className="flex flex-wrap items-start gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="px-3 py-2 text-xs font-bold text-white rounded-full bg-emerald-600">
            {matchPercentage}%&nbsp;&nbsp;Similarity
          </div>
          &middot;
          <div
            className={`pt-0.5 text-xs font-semibold tracking-wide uppercase text-[${matchStrength.color}]`}
          >
            {matchStrength.label}
          </div>
          &middot;
        </div>
        <div className="flex items-center justify-center gap-2 text-sm py-1 px-2 mt-0.5 text-gray-700 rounded-sm bg-[#f3f4f6] font-semibold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 8 L16 8 M8 12 L16 12 M8 16 L12 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="pt-[0.5px]">Source Case {sourceCaseId}</span>
        </div>
      </div>

      {/* Visual similarity bar */}
      <div className="w-full h-1 mb-3 overflow-hidden bg-gray-300 rounded">
        <div
          className="h-full transition-all duration-300 rounded"
          style={{ width: `${matchPercentage}%`, background: matchStrength.color }}
        ></div>
      </div>

      <h3 className="m-0 mb-4 text-base font-semibold leading-relaxed text-gray-900">
        {caseTitle}
      </h3>

      <div className="flex flex-col gap-3">
        <div className="p-3 border-l-4 rounded bg-gray-50 border-emerald-600">
          <div className="flex items-center gap-1.5 mb-1.5 text-slate-800 text-xs">
            <span className="text-sm">🎯</span>
            <strong>Problem Addressed:</strong>
          </div>
          <p className="m-0 text-xs leading-relaxed text-gray-700">
            {problemText.substring(0, 200)}...
          </p>
        </div>
        <div className="p-3 border-l-4 rounded bg-gray-50 border-emerald-600">
          <div className="flex items-center gap-1.5 mb-1.5 text-slate-800 text-xs">
            <span className="text-sm">💡</span>
            <strong>Solution Approach:</strong>
          </div>
          <p className="m-0 text-xs leading-relaxed text-gray-700">
            {solutionText.substring(0, 200)}...
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center sm:justify-start">
        <button
          className="mt-3.5 bg-none border-none text-emerald-600 font-semibold cursor-pointer p-2 px-0 text-sm transition-colors hover:text-emerald-700 hover:underline"
          onClick={() =>
            onViewContext({
              caseItem,
              content,
              title: caseTitle,
              matchPercentage,
              matchStrength: matchStrength.label,
              matchColor: matchStrength.color,
              sourceCaseId,
            })
          }
        >
          View Full Details →
        </button>
      </div>
    </div>
  );
}

EvidenceCard.propTypes = {
  caseItem: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  totalCases: PropTypes.number.isRequired,
  caseTitle: PropTypes.string.isRequired,
  onViewContext: PropTypes.func.isRequired,
};
