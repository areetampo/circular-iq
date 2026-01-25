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
    <div className="evidence-case-card">
      <div className="case-header">
        <div className="similarity-metrics">
          <div className="similarity-badge-bold">{matchPercentage}% Match</div>
          <div className="match-strength" style={{ color: matchStrength.color }}>
            {matchStrength.label}
          </div>
        </div>
        <div className="case-id-badge">
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
      <div className="similarity-bar-container">
        <div
          className="similarity-bar"
          style={{ width: `${matchPercentage}%`, background: matchStrength.color }}
        ></div>
      </div>

      <h3 className="case-title">{caseTitle}</h3>

      <div className="case-sections">
        <div className="case-section">
          <div className="section-label">
            <span className="icon">🎯</span>
            <strong>Problem Addressed:</strong>
          </div>
          <p className="section-content">{problemText.substring(0, 200)}...</p>
        </div>
        <div className="case-section">
          <div className="section-label">
            <span className="icon">💡</span>
            <strong>Solution Approach:</strong>
          </div>
          <p className="section-content">{solutionText.substring(0, 200)}...</p>
        </div>
      </div>

      <button
        className="view-context-btn"
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

      <style jsx>{`
        .case-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }
        .similarity-metrics {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .similarity-badge-bold {
          background: #34a83a;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: bold;
        }
        .match-strength {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .similarity-bar-container {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .similarity-bar {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .case-title {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #333;
          font-weight: 600;
          line-height: 1.4;
        }
        .case-sections {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .case-section {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #34a83a;
        }
        .section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          color: #2c3e50;
          font-size: 13px;
        }
        .icon {
          font-size: 14px;
        }
        .section-content {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #555;
        }
        .view-context-btn {
          margin-top: 14px;
          background: none;
          border: none;
          color: #34a83a;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 0;
          font-size: 14px;
          transition: color 0.2s;
        }
        .view-context-btn:hover {
          color: #2d8f32;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
