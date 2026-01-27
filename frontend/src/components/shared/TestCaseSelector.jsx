import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import testCases from '../../../../backend/data/test-cases.json';
import TestCaseInfoModal from '../modals/TestCaseInfoModal';
import InfoIconButton from './InfoIconButton';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="flex items-center gap-2 mt-8 mb-4 ml-2">
        <span className="font-semibold text-gray-600 text-m">Sample Test Cases</span>
        <InfoIconButton onClick={() => setShowInfoModal(true)} title="Learn about test cases" />
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border-2 border-gray-300 rounded-lg px-5 py-3.5 text-sm font-semibold text-gray-600 cursor-pointer flex items-center justify-between transition-all duration-200 hover:border-gray-600 hover:bg-gray-50"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🧪</span>
          <span>Load for Quick Testing</span>
        </div>
        <span
          className={`text-lg text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-90' : 'rotate-0'}`}
        >
          ▶
        </span>
      </button>

      <TestCaseInfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <TestCaseInfoModal
        isOpen={!!previewTestCase}
        testCase={previewTestCase}
        onClose={() => setPreviewTestCase(null)}
      />

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 mt-3 border border-gray-300 rounded-lg bg-slate-50">
              <div
                className="grid gap-3 p-1 overflow-y-auto max-h-96"
                style={{
                  gridTemplateColumns: isMobileLayout ? '1fr' : 'repeat(2, 1fr)',
                }}
              >
                {testCases.testCases.map((testCase, index) => (
                  <div
                    key={testCase.id}
                    onClick={() => handleSelectCase(testCase)}
                    className={`p-3.5 pt-2.5 rounded-lg cursor-pointer transition-all duration-200 relative border ${
                      selectedCase === testCase.id
                        ? 'border-slate-500 bg-slate-100'
                        : 'border-gray-300 bg-white hover:bg-slate-50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="flex-1 text-xs font-semibold leading-tight text-gray-900">
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
                        <span className="px-2 text-xs font-medium text-black rounded-md pb-0.5 pt-[2.4px] bg-slate-200">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500 line-clamp-2">
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
                <p className="m-0 text-xs leading-relaxed text-yellow-700">
                  <strong>💡 Tip:</strong> Select a test case to auto-fill the form with realistic
                  circular economy data. Great for testing the evaluator or seeing examples of
                  well-structured submissions.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

TestCaseSelector.propTypes = {
  onSelectTestCase: PropTypes.func.isRequired,
};
