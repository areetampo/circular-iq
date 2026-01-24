import { React, useState } from 'react';
import testCases from '../../../backend/data/test-cases.json';
import TestCaseInfoModal from './TestCaseInfoModal';
import InfoIconButton from './InfoIconButton';

export default function TestCaseSelector({ onSelectTestCase }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [previewTestCase, setPreviewTestCase] = useState(null);

  const handleSelectCase = (testCase) => {
    setSelectedCase(testCase.id);
    onSelectTestCase({
      businessProblem: testCase.problem,
      businessSolution: testCase.solution,
      parameters: testCase.parameters,
    });
  };

  return (
    <div style={{ marginTop: '24px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>Test Cases</span>
        <InfoIconButton
          onClick={() => setShowInfoModal(true)}
          title="Learn about test cases"
          size={18}
        />
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: isOpen ? '#f8f9fa' : 'white',
          border: '2px solid #e0e0e0',
          borderRadius: '10px',
          padding: '14px 20px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#555',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = '#999';
          e.currentTarget.style.background = '#f8f9fa';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = '#e0e0e0';
          if (!isOpen) e.currentTarget.style.background = 'white';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>🧪</span>
          <span>Load Test Case for Quick Testing</span>
        </div>
        <span
          style={{
            fontSize: '18px',
            color: '#999',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: '12px',
            padding: '16px',
            background: '#fafbfc',
            borderRadius: '10px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '4px',
            }}
          >
            {testCases.testCases.map((testCase, index) => (
              <div
                key={testCase.id}
                onClick={() => handleSelectCase(testCase)}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  border: selectedCase === testCase.id ? '2px solid #5a6c7d' : '1px solid #d0d7de',
                  background: selectedCase === testCase.id ? '#f0f3f6' : 'white',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  if (selectedCase !== testCase.id) {
                    e.currentTarget.style.background = '#f6f8fa';
                    e.currentTarget.style.borderColor = '#8b96a1';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedCase !== testCase.id) {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = '#d0d7de';
                  }
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#24292f',
                      flex: 1,
                      lineHeight: '1.4',
                    }}
                  >
                    {testCase.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <InfoIconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTestCase(testCase);
                      }}
                      title="Preview this test case"
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#656d76',
                        background: '#f0f3f6',
                        padding: '2px 8px',
                        borderRadius: '12px',
                      }}
                    >
                      #{index + 1}
                    </span>
                  </div>
                </div>
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '11px',
                    color: '#656d76',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {testCase.problem.substring(0, 100)}...
                </p>

                <div
                  style={{
                    marginTop: '10px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                  }}
                >
                  {Object.entries(testCase.parameters)
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <span
                        key={key}
                        style={{
                          fontSize: '9px',
                          padding: '3px 6px',
                          background: value >= 75 ? '#d4edda' : value >= 50 ? '#fff3cd' : '#f8d7da',
                          color: value >= 75 ? '#155724' : value >= 50 ? '#856404' : '#721c24',
                          borderRadius: '3px',
                          fontWeight: '600',
                          border: `1px solid ${value >= 75 ? '#c3e6cb' : value >= 50 ? '#ffeaa7' : '#f5c6cb'}`,
                        }}
                      >
                        {key.replace(/_/g, ' ')}: {value}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '12px',
              padding: '10px',
              background: '#fff8e6',
              borderRadius: '6px',
              border: '1px solid #ffeaa7',
            }}
          >
            <p style={{ margin: 0, fontSize: '11px', color: '#856404', lineHeight: '1.5' }}>
              <strong>💡 Tip:</strong> Select a test case to auto-fill the form with realistic
              circular economy data. Great for testing the evaluator or seeing examples of
              well-structured submissions.
            </p>
          </div>
        </div>
      )}

      {showInfoModal && <TestCaseInfoModal onClose={() => setShowInfoModal(false)} />}
      {previewTestCase && (
        <TestCaseInfoModal testCase={previewTestCase} onClose={() => setPreviewTestCase(null)} />
      )}
    </div>
  );
}
