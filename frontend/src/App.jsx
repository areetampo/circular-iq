import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

// Import view components
import LandingView from './views/LandingView';
import ResultsView from './views/ResultsView';
import EvaluationCriteriaView from './views/EvaluationCriteriaView';
import HistoryView from './views/HistoryView';
import ComparisonView from './views/ComparisonView';
import MarketAnalysisView from './views/MarketAnalysisView';
import TestCaseSelector from './components/TestCaseSelector';

export default function App() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const navigate = useNavigate();

  // Global state for evaluation workflow
  const [businessProblem, setBusinessProblem] = useState('');
  const [businessSolution, setBusinessSolution] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 8 evaluation parameters
  const [parameters, setParameters] = useState({
    public_participation: 50,
    infrastructure: 50,
    market_price: 50,
    maintenance: 50,
    uniqueness: 50,
    size_efficiency: 50,
    chemical_safety: 50,
    tech_readiness: 50,
  });

  const validKeys = [
    'public_participation',
    'infrastructure',
    'market_price',
    'maintenance',
    'uniqueness',
    'size_efficiency',
    'chemical_safety',
    'tech_readiness',
  ];

  const categoryMapping = {
    public_participation: {
      name: 'Public Participation',
      desc: 'How easily stakeholders, communities, and end-users can engage with and contribute to the circular system',
    },
    infrastructure: {
      name: 'Infrastructure & Accessibility',
      desc: 'Availability of necessary infrastructure and ease of access to circular economy resources and processes',
    },
    market_price: {
      name: 'Market Price',
      desc: 'Economic value and market demand for recovered or repurposed materials',
    },
    maintenance: {
      name: 'Maintenance',
      desc: 'Ease and cost of maintaining products, materials, or systems throughout their lifecycle',
    },
    uniqueness: {
      name: 'Uniqueness',
      desc: 'Rarity, specialty, or distinctive value of materials and their potential for reuse',
    },
    size_efficiency: {
      name: 'Size Efficiency',
      desc: 'Physical dimensions and volume, affecting handling, storage, and transportation efficiency',
    },
    chemical_safety: {
      name: 'Chemical Safety',
      desc: 'Potential environmental and health hazards, impacting safe processing and disposal methods',
    },
    tech_readiness: {
      name: 'Tech Readiness',
      desc: 'Complexity and availability of technology required for effective processing and recovery',
    },
  };

  async function submit() {
    if (!businessProblem.trim() || businessProblem.trim().length < 200) {
      setError('Business Problem must be at least 200 characters.');
      return;
    }

    if (!businessSolution.trim() || businessSolution.trim().length < 200) {
      setError('Business Solution must be at least 200 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProblem,
          businessSolution,
          parameters,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'API error');
      }

      const data = await res.json();

      if (data.audit?.is_junk_input) {
        setError(
          data.audit.audit_verdict ||
            'Input was too vague to analyze. Please provide more details.',
        );
        setLoading(false);
        return;
      }

      setResult(data);
      navigate('/results');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const calculateMarketAvg = () => {
    if (!result?.similar_cases || result.similar_cases.length === 0) {
      return 65;
    }
    return (
      result.similar_cases.reduce((acc, curr) => acc + (curr.similarity || 0) * 100, 0) /
      result.similar_cases.length
    );
  };

  const marketAvg = calculateMarketAvg();

  const radarData = result?.sub_scores
    ? validKeys
        .filter((key) => key in (result.sub_scores || {}))
        .map((key) => {
          const value = result.sub_scores[key];
          const numValue = value != null && !isNaN(value) ? Number(value) : 0;
          return {
            subject: categoryMapping[key]?.name || key.replace(/_/g, ' '),
            userValue: numValue,
            marketAvg: marketAvg,
          };
        })
    : [];

  const businessViabilityScore = result
    ? Math.round(
        result.overall_score * 0.7 +
          (result.audit?.confidence_score <= 1
            ? result.audit.confidence_score * 100
            : result.audit?.confidence_score || 0) *
            0.3,
      )
    : 0;

  const getRatingBadge = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const handleClear = () => {
    setBusinessProblem('');
    setBusinessSolution('');
    setResult(null);
    setError(null);
    setShowAdvanced(false);
    setParameters({
      public_participation: 50,
      infrastructure: 50,
      market_price: 50,
      maintenance: 50,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    });
  };

  const handleSaveAssessment = async (title) => {
    if (!result) {
      setError('No evaluation result to save');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          businessProblem,
          businessSolution,
          result,
          userId: null,
        }),
      });

      if (!res.ok) throw new Error('Failed to save assessment');

      navigate('/assessments');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingView
            businessProblem={businessProblem}
            setBusinessProblem={setBusinessProblem}
            businessSolution={businessSolution}
            setBusinessSolution={setBusinessSolution}
            parameters={parameters}
            setParameters={setParameters}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            onSubmit={submit}
            loading={loading}
            error={error}
            showInfoIcons={!result}
            onViewHistory={() => navigate('/assessments')}
            testCaseSelector={
              <TestCaseSelector
                onSelectTestCase={(testCaseData) => {
                  setBusinessProblem(testCaseData.businessProblem);
                  setBusinessSolution(testCaseData.businessSolution);
                  setParameters(testCaseData.parameters);
                  setShowAdvanced(true);
                }}
              />
            }
          />
        }
      />
      <Route
        path="/results"
        element={
          <ResultsView
            result={result}
            radarData={radarData}
            categoryMapping={categoryMapping}
            validKeys={validKeys}
            businessViabilityScore={businessViabilityScore}
            getRatingBadge={getRatingBadge}
            onBack={() => {
              handleClear();
              navigate('/');
            }}
            onSaveAssessment={handleSaveAssessment}
            onViewHistory={() => navigate('/assessments')}
            onViewMarketAnalysis={() => navigate('/market-analysis')}
          />
        }
      />
      <Route path="/criteria" element={<EvaluationCriteriaView onBack={() => navigate(-1)} />} />
      <Route
        path="/assessments"
        element={
          <HistoryView
            onBack={() => navigate('/')}
            onViewDetail={(id) => navigate(`/assessments/${id}`)}
          />
        }
      />
      <Route
        path="/assessments/:id"
        element={<ResultsView isDetailView={true} onBack={() => navigate('/assessments')} />}
      />
      <Route
        path="/compare/:id1/:id2"
        element={<ComparisonView onBack={() => navigate('/assessments')} />}
      />
      <Route
        path="/market-analysis"
        element={
          <MarketAnalysisView
            currentAssessmentScore={result?.overall_score}
            currentIndustry={result?.metadata?.industry}
            onBack={() => navigate(-1)}
          />
        }
      />
    </Routes>
  );
}
