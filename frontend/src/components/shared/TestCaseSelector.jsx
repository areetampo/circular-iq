import { React, useState, useEffect } from 'react';
import testCases from '../../../../backend/data/test-cases.json';
import TestCaseInfoModal from '../modals/TestCaseInfoModal';
import InfoIconButton from './InfoIconButton';

export default function TestCaseSelector({ onSelectTestCase }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [previewTestCase, setPreviewTestCase] = useState(null);
  const [isMobileLayout, setIsMobileLayout] = useState(window.innerWidth <= 820);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileLayout(window.innerWidth <= 820);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectCase = (testCase) => {
    setSelectedCase(testCase.id);
    onSelectTestCase({
      businessProblem: testCase.problem,
      businessSolution: testCase.solution,
      parameters: testCase.parameters,
    });
  };

  const getParameterColor = (value) => {
    if (value >= 75) return { bg: '#d4edda', text: '#155724', border: '#c3e6cb' };
    if (value >= 50) return { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' };
    return { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' };
  };

  return (
    <div className="mt-6 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-m font-semibold text-gray-600">Test Cases</span>
        <div className="mt-0.5">
          <InfoIconButton
            onClick={() => setShowInfoModal(true)}
            title="Learn about test cases"
            size={18}
          />
        </div>
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border-2 border-gray-300 rounded-lg px-5 py-3.5 text-sm font-semibold text-gray-600 cursor-pointer flex items-center justify-between transition-all duration-200 hover:border-gray-600 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🧪</span>
          <span>Load Test Case for Quick Testing</span>
        </div>
        <span
          className={`text-lg text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-gray-300">
          <div
            className="grid gap-3 max-h-96 overflow-y-auto p-1"
            style={{
              gridTemplateColumns: isMobileLayout ? '1fr' : 'repeat(2, 1fr)',
            }}
          >
            {testCases.testCases.map((testCase, index) => (
              <div
                key={testCase.id}
                onClick={() => handleSelectCase(testCase)}
                className={`p-3.5 rounded-lg cursor-pointer transition-all duration-200 relative ${
                  selectedCase === testCase.id
                    ? 'border-2 border-slate-500 bg-slate-100'
                    : 'border border-gray-300 bg-white hover:bg-slate-50 hover:border-slate-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-semibold text-gray-900 flex-1 leading-tight">
                    {testCase.title}
                  </h4>
                  <div className="flex gap-1.5 items-center">
                    <InfoIconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTestCase(testCase);
                      }}
                      title="Preview this test case"
                    />
                    <span className="text-xs font-bold text-gray-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {testCase.problem.substring(0, 100)}...
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {Object.entries(testCase.parameters)
                    .slice(0, 4)
                    .map(([key, value]) => {
                      const color = getParameterColor(value);
                      return (
                        <span
                          key={key}
                          style={{
                            fontSize: '9px',
                            padding: '3px 6px',
                            background: color.bg,
                            color: color.text,
                            borderRadius: '3px',
                            fontWeight: '600',
                            border: `1px solid ${color.border}`,
                          }}
                        >
                          {key.replace(/_/g, ' ')}: {value}
                        </span>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 p-2.5 bg-yellow-50 rounded border border-yellow-300">
            <p className="m-0 text-xs text-yellow-700 leading-relaxed">
              <strong>💡 Tip:</strong> Select a test case to auto-fill the form with realistic
              circular economy data. Great for testing the evaluator or seeing examples of
              well-structured submissions.
            </p>
          </div>
        </div>
      )}

      <TestCaseInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <TestCaseInfoModal
        isOpen={!!previewTestCase}
        testCase={previewTestCase}
        onClose={() => setPreviewTestCase(null)}
      />
    </div>
  );
}
