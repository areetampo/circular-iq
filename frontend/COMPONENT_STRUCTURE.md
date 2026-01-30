# Component Structure Guide

## Directory Organization

```
src/
├── components/
│   ├── modals/              # Modal dialogs for complex interactions
│   │   ├── AssessmentMethodologyModal.jsx
│   │   ├── ResultSimilarityMatchModal.jsx
│   │   ├── EvaluationCriteriaModal.jsx
│   │   ├── MarketAnalysisModal.jsx          # NEW: Wraps MarketAnalysisView in modal
│   │   ├── MetricInfoModal.jsx
│   │   └── TestCaseInfoModal.jsx
│   ├── forms/               # Form input components
│   │   └── ParameterSliders.jsx
│   └── shared/              # Reusable UI components
│       ├── ErrorBoundary.jsx
│       ├── EvidenceCard.jsx
│       ├── ExportButton.jsx
│       ├── InfoIconButton.jsx
│       ├── RadarChartSection.jsx
│       ├── SessionRestorePrompt.jsx
│       ├── SampleTestCasesContainer.jsx
│       ├── TipCard.jsx
│       └── Toast.jsx
├── constants/
│   └── evaluationData.js    # Centralized evaluation framework data
├── hooks/
│   ├── useExportState.js    # Export state management
│   └── useToast.js          # Toast notification hook
├── utils/
│   ├── exportSimple.js      # CSV/PDF export utilities (consolidated)
│   ├── helpers.js           # Utility functions
│   ├── session.js           # Session management
│   ├── storage.js           # LocalStorage utilities
│   └── text.js              # Text processing utilities
├── views/                   # Full-page views
│   ├── ComparisonView.jsx
│   ├── EvaluationCriteriaView.jsx
│   ├── MyAssessmentsPage.jsx
│   ├── LandingPage.jsx
│   ├── MarketAnalysisView.jsx
│   ├── NotFoundPage.jsx
│   └── ResultsPage.jsx
├── styles/                  # Component-specific styles
├── App.jsx                  # Main app router
├── App.css                  # Global styles
└── main.jsx                 # Entry point
```

## Key Changes (Latest Refactor)

### Consolidated Utilities

- **Removed**: `export.js`, `exportEnhanced.js`, `apiClient.js`
- **Active**: `exportSimple.js` provides `exportAssessmentCSV`, `exportAssessmentPDF`, `exportComparisonCSV`

### Reorganized Components

#### Modals Folder

- All modal dialogs grouped together for easy discovery
- **NEW**: `MarketAnalysisModal.jsx` wraps `MarketAnalysisView` for inline display
  - No route navigation required
  - Cleaner UX from `/results` and `/assessments/:id`

#### Forms Folder

- Input-related components isolated from general UI

#### Shared Folder

- Reusable components used across views
- Self-contained utilities and visual elements

## Import Patterns

### From Views

```jsx
import ResultsPage from '../views/ResultsPage';
import MarketAnalysisView from '../views/MarketAnalysisView';
```

### From Components/Modals

```jsx
import MarketAnalysisModal from '../components/modals/MarketAnalysisModal';
import ResultSimilarityMatchModal from '../components/modals/ResultSimilarityMatchModal';
```

### From Components/Shared

```jsx
import Toast from '../components/shared/Toast';
import ErrorBoundary from '../components/shared/ErrorBoundary';
```

### From Components/Forms

```jsx
import ParameterSliders from '../components/forms/ParameterSliders';
```

### From Utils

```jsx
import { exportAssessmentCSV } from '../utils/exportSimple';
import { useToast } from '../hooks/useToast';
```

## Modal Implementation (MarketAnalysisModal)

Instead of navigating to a separate route, `MarketAnalysisModal` renders inline:

```jsx
// In ResultsPage.jsx
const [showMarketAnalysisModal, setShowMarketAnalysisModal] = useState(false);

const handleMarketAnalysis = () => setShowMarketAnalysisModal(true);

// In render
<MarketAnalysisModal
  isOpen={showMarketAnalysisModal}
  onClose={() => setShowMarketAnalysisModal(false)}
  currentAssessmentScore={actualResult?.overall_score}
  currentIndustry={actualResult?.metadata?.industry}
/>;
```

## Best Practices

1. **Modals**: Use for complex, multi-step interactions or detailed overlays
2. **Shared Components**: Keep self-contained, prop-driven, and testable
3. **Forms**: Group form inputs logically by interaction pattern
4. **Utilities**: One responsibility per function; compose larger operations
5. **Hooks**: Encapsulate stateful logic; name with `use` prefix

## Maintenance

- **Adding new modals**: Place in `components/modals/`
- **Adding shared components**: Place in `components/shared/`
- **Adding utilities**: Consolidate into existing `utils/` files when related
- **Updating imports**: Always adjust relative paths after moving files
