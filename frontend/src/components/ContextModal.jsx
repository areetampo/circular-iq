import { extractProblemSolution } from '../utils/helpers';

export default function ContextModal({
  onClose,
  caseItem,
  content,
  title,
  matchPercentage,
  matchStrength,
  matchColor,
  sourceCaseId,
}) {
  // Use structured metadata if available (preferred), otherwise parse content
  const { problem: problemPart, solution: solutionPart } = extractProblemSolution(
    caseItem || content,
  );

  // Check if we have valid problem and solution
  const hasSeparateSections =
    problemPart &&
    solutionPart &&
    problemPart !== 'Problem data not clearly formatted' &&
    solutionPart !== 'Solution data not clearly formatted';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <h2>{title || 'Full Context'}</h2>
            {matchPercentage && (
              <div className="header-metrics">
                <div className="metric-badge" style={{ background: matchColor || '#34a83a' }}>
                  {matchPercentage}% Similarity
                </div>
                <div className="metric-label" style={{ color: matchColor || '#34a83a' }}>
                  {matchStrength || 'Match'}
                </div>
                {sourceCaseId && <div className="source-badge">📄 Source Case {sourceCaseId}</div>}
              </div>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {hasSeparateSections ? (
            <>
              <div className="content-section">
                <div className="section-header">
                  <span className="icon">🎯</span>
                  <h3>Problem Addressed</h3>
                </div>
                <p className="section-text">{problemPart}</p>
              </div>

              <div className="content-section">
                <div className="section-header">
                  <span className="icon">💡</span>
                  <h3>Solution Approach</h3>
                </div>
                <p className="section-text">{solutionPart}</p>
              </div>
            </>
          ) : (
            <p style={{ lineHeight: '1.8', color: '#333' }}>{content}</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 700px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px;
          border-bottom: 1px solid #eee;
        }
        .header-content {
          flex: 1;
        }
        .modal-header h2 {
          margin: 0 0 12px 0;
          color: #34a83a;
          font-size: 22px;
        }
        .header-metrics {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .metric-badge {
          color: white;
          padding: 5px 14px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 600;
        }
        .metric-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .source-badge {
          background: #f3f4f6;
          color: #6b7280;
          padding: 5px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }
        .modal-body {
          padding: 24px;
        }
        .content-section {
          margin-bottom: 28px;
        }
        .content-section:last-child {
          margin-bottom: 0;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #34a83a;
        }
        .section-header .icon {
          font-size: 20px;
        }
        .section-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }
        .section-text {
          line-height: 1.8;
          color: #333;
          margin: 0;
          font-size: 15px;
        }
      `}</style>
    </div>
  );
}
