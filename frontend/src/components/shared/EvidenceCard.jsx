import { extractCaseInfo, extractProblemSolution } from '../../utils/helpers';

export default function EvidenceCard({ caseItem, index, caseTitle, onViewContext }) {
  const { matchPercentage, sourceCaseId, content } = extractCaseInfo(caseItem, index);

  // Use structured metadata if available, otherwise parse content
  const { problem: problemText, solution: solutionText } = extractProblemSolution(caseItem);

  // Get match strength label
  const getMatchStrength = (percentage) => {
    if (percentage >= 80) return { label: 'Excellent Match', color: '#059669' };
    if (percentage >= 65) return { label: 'Strong Match', color: '#34a83a' };
    if (percentage >= 50) return { label: 'Good Match', color: '#65a30d' };
    return { label: 'Moderate Match', color: '#ca8a04' };
  };

  const matchStrength = getMatchStrength(matchPercentage);

  return (
    <div>
      <div className="flex justify-between items-start gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            {matchPercentage}% Match
          </div>
          <div
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: matchStrength.color }}
          >
            {matchStrength.label}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path
              d="M8 8 L16 8 M8 12 L16 12 M8 16 L12 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Source Case {sourceCaseId}
        </div>
      </div>

      {/* Visual similarity bar */}
      <div className="w-full h-1 bg-gray-300 rounded overflow-hidden mb-3">
        <div
          className="h-full rounded transition-all duration-300"
          style={{ width: `${matchPercentage}%`, background: matchStrength.color }}
        ></div>
      </div>

      <h3 className="m-0 mb-4 text-base text-gray-900 font-semibold leading-relaxed">
        {caseTitle}
      </h3>

      <div className="flex flex-col gap-3">
        <div className="bg-gray-50 p-3 rounded border-l-4 border-emerald-600">
          <div className="flex items-center gap-1.5 mb-1.5 text-slate-800 text-xs">
            <span className="text-sm">🎯</span>
            <strong>Problem Addressed:</strong>
          </div>
          <p className="m-0 text-xs leading-relaxed text-gray-700">
            {problemText.substring(0, 200)}...
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded border-l-4 border-emerald-600">
          <div className="flex items-center gap-1.5 mb-1.5 text-slate-800 text-xs">
            <span className="text-sm">💡</span>
            <strong>Solution Approach:</strong>
          </div>
          <p className="m-0 text-xs leading-relaxed text-gray-700">
            {solutionText.substring(0, 200)}...
          </p>
        </div>
      </div>

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
  );
}
