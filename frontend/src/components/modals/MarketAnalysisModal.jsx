import { Suspense, lazy } from 'react';

const MarketAnalysisView = lazy(() => import('../../views/MarketAnalysisView'));

export default function MarketAnalysisModal({
  isOpen,
  onClose,
  currentAssessmentScore,
  currentIndustry,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '1000px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'white',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#999',
            padding: '4px 8px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            zIndex: 10,
            transition: 'all 0.2s ease',
          }}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.target.style.background = '#f5f5f5';
            e.target.style.color = '#333';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'white';
            e.target.style.color = '#999';
          }}
        >
          ✕
        </button>

        {/* Content */}
        <div style={{ overflowY: 'auto', flex: 1, paddingTop: '40px' }}>
          <Suspense
            fallback={
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#666' }}>Loading market analysis...</p>
              </div>
            }
          >
            <MarketAnalysisView
              currentAssessmentScore={currentAssessmentScore}
              currentIndustry={currentIndustry}
              onBack={onClose}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
