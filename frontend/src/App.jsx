import { useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import './App.css';

// Import view components
import LandingView from './views/LandingView';
import ResultsView from './views/ResultsView';
import EvaluationCriteriaView from './views/EvaluationCriteriaView';
import TestCaseSelector from './components/TestCaseSelector';

// View states
const VIEWS = {
  LANDING: 'landing',
  RESULTS: 'results',
  CRITERIA: 'criteria',
};

export default function App() {
  const [businessProblem, setBusinessProblem] = useState('');
  const [businessSolution, setBusinessSolution] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState(VIEWS.LANDING);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 8 evaluation parameters - all initialized to 50
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
      const res = await fetch('http://localhost:3001/score', {
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

      // Handle junk input case
      if (data.audit?.is_junk_input) {
        setError(
          data.audit.audit_verdict ||
            'Input was too vague to analyze. Please provide more details.',
        );
        setLoading(false);
        return;
      }

      setResult(data);
      setCurrentView(VIEWS.RESULTS);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Define the 8 valid keys
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

  // Map sub_scores to category names for display
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

  // Calculate market average from similar_cases similarity scores
  const calculateMarketAvg = () => {
    if (!result?.similar_cases || result.similar_cases.length === 0) {
      return 65; // Default fallback
    }
    return (
      result.similar_cases.reduce((acc, curr) => acc + (curr.similarity || 0) * 100, 0) /
      result.similar_cases.length
    );
  };

  const marketAvg = calculateMarketAvg();

  // Prepare radar chart data using sub_scores from response
  // Ensure we only use the 8 valid keys and handle null values
  const radarData = result?.sub_scores
    ? validKeys
        .filter((key) => key in (result.sub_scores || {}))
        .map((key) => {
          const value = result.sub_scores[key];
          // Handle null, undefined, or invalid values - default to 0
          const numValue = value != null && !isNaN(value) ? Number(value) : 0;
          return {
            subject: categoryMapping[key]?.name || key.replace(/_/g, ' '),
            userValue: numValue,
            marketAvg: marketAvg,
          };
        })
    : [];

  // Calculate business viability score (derived from overall score and confidence)
  const businessViabilityScore = result
    ? Math.round(
        result.overall_score * 0.7 +
          (result.audit?.confidence_score <= 1
            ? result.audit.confidence_score * 100
            : result.audit?.confidence_score || 0) *
            0.3,
      )
    : 0;

  // Get rating badge text
  const getRatingBadge = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // Render based on current view
  if (currentView === VIEWS.CRITERIA) {
    return <EvaluationCriteriaView onBack={() => setCurrentView(VIEWS.RESULTS)} />;
  }

  if (currentView === VIEWS.RESULTS && result) {
    return (
      <ResultsView
        result={result}
        radarData={radarData}
        categoryMapping={categoryMapping}
        validKeys={validKeys}
        businessViabilityScore={businessViabilityScore}
        getRatingBadge={getRatingBadge}
        onBack={() => {
          setCurrentView(VIEWS.LANDING);
          setResult(null);
          setBusinessProblem('');
          setBusinessSolution('');
        }}
        onViewCriteria={() => setCurrentView(VIEWS.CRITERIA)}
      />
    );
  }

  return (
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
      testCaseSelector={
        <TestCaseSelector
          onSelectTestCase={(testCaseData) => {
            setBusinessProblem(testCaseData.businessProblem);
            setBusinessSolution(testCaseData.businessSolution);
            setParameters(testCaseData.parameters);
            setShowAdvanced(true); // Auto-expand advanced parameters
          }}
        />
      }
    />
  );
}
