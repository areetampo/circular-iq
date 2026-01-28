import React from 'react';
import PropTypes from 'prop-types';
import { extractProblemSolution } from '../../utils/helpers';

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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] bg-white shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Clean with just title */}
        <h2 className="flex-shrink-0 p-4 mb-0 text-2xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600">
          {title || 'Full Context'}
        </h2>

        {/* Body - with custom scrollbar */}
        <div
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#10b981 #f3f4f6',
          }}
        >
          <style>{`
            /* Custom scrollbar for webkit browsers (Chrome, Safari, Edge) */
            .overflow-y-auto::-webkit-scrollbar {
              width: 8px;
            }

            .overflow-y-auto::-webkit-scrollbar-track {
              background: #f3f4f6;
              border-radius: 10px;
            }

            .overflow-y-auto::-webkit-scrollbar-thumb {
              background: #10b981;
              border-radius: 10px;
              transition: background 0.2s ease;
            }

            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
              background: #059669;
            }
          `}</style>

          <div className="p-6">
            {/* Metadata badges */}
            {matchPercentage && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="px-3 py-2 text-xs font-bold text-white rounded-full bg-emerald-600">
                  {matchPercentage}% Similarity
                </div>
                <span className="text-gray-400">•</span>
                <div
                  className="text-xs font-semibold tracking-wide uppercase"
                  style={{ color: matchColor || '#34a83a' }}
                >
                  {matchStrength || 'Match'}
                </div>
                {sourceCaseId && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect
                          x="4"
                          y="4"
                          width="16"
                          height="16"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M8 8 L16 8 M8 12 L16 12 M8 16 L12 16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      Source Case {sourceCaseId}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Content sections */}
            {hasSeparateSections ? (
              <>
                <div style={{ marginBottom: '1.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #34a83a',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🎯</span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1e293b',
                      }}
                    >
                      Problem Addressed
                    </h3>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      lineHeight: '1.75',
                      color: '#1e293b',
                    }}
                  >
                    {problemPart}
                  </p>
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      marginBottom: '0.75rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '2px solid #34a83a',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>💡</span>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1e293b',
                      }}
                    >
                      Solution Approach
                    </h3>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '1rem',
                      lineHeight: '1.75',
                      color: '#1e293b',
                    }}
                  >
                    {solutionPart}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p
                  style={{
                    margin: 0,
                    lineHeight: '1.75',
                    color: '#1e293b',
                    marginBottom: '1.5rem',
                  }}
                >
                  {content}
                </p>
              </>
            )}

            {/* Close button - appears right after solution text */}
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-semibold text-white transition-colors border-none rounded-lg cursor-pointer bg-emerald-600 hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ContextModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  caseItem: PropTypes.object,
  content: PropTypes.string,
  title: PropTypes.string,
  matchPercentage: PropTypes.number,
  matchStrength: PropTypes.string,
  matchColor: PropTypes.string,
  sourceCaseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ContextModal.defaultProps = {
  caseItem: null,
  content: '',
  title: '',
  matchPercentage: null,
  matchStrength: '',
  matchColor: '',
  sourceCaseId: null,
};
