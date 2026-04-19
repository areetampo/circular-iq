# Frontend — Circular Economy Assessor

React 19 + Vite 7 SPA for assessing, visualising, comparing, and managing circular economy evaluations.

**Author:** Areeb Ahmed Zahoori <zahooriareeb47@gmail.com>
**License:** UNLICENSED

## Overview

The frontend provides:

1. **Assessment Flow** — guided questionnaires with optional business context + 8 evaluation parameters
2. **Results Display** — interactive charts, enrichment sections (tier, consistency, alignment, audit, similar cases, gap analysis)
3. **Global Dashboard** — live analytics from all scoring calls worldwide
4. **Export Functionality** — PDF reports and CSV data exports
5. **Assessment History** — save, rename, delete, compare, and share assessments
6. **Session Management** — automatic save/restore across browser sessions
7. **Anonymous Usage** — 5 free assessments with IP-based tracking; unlimited for logged-in users

## Tech Stack

| Technology                | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| **React 19**              | UI framework                               |
| **Vite 7**                | Build tool and dev server                  |
| **TypeScript**            | Type safety (selective — hooks and utils)  |
| **Tailwind CSS v4**       | Utility-first styling                      |
| **HeroUI v3**             | Pre-built component library                |
| **Recharts**              | Data visualisation (Bar, Line, Pie, Radar) |
| **React Router v7**       | Client-side routing                        |
| **TanStack React Query**  | Server state management + caching          |
| **Supabase JS**           | Authentication client                      |
| **Vitest**                | Unit testing                               |
| **React Testing Library** | Component testing                          |

## Directory Structure

```txt
frontend/src/
│
├── app/
│   ├── App.jsx              # Root component with providers and routing
│   ├── AppRoutes.jsx        # All route definitions
│   └── AppProvider.jsx      # Global context providers (Auth, Dialog, Drawer, Modal, QueryClient)
│
├── pages/
│   ├── LandingPage/
│   │   ├── LandingPage.jsx
│   │   └── components/
│   │       ├── BusinessContextContainer.jsx    # Optional context fields (model type, stage, geography, etc.)
│   │       ├── EvaluationParametersContainer.jsx  # Guided mode toggle + 8-parameter scoring inputs
│   │       ├── LiveCharacterCounter.jsx
│   │       └── SampleTestCasesContainer.jsx    # Pre-filled example assessments
│   │
│   ├── ResultsPage/
│   │   ├── ResultsPage.jsx
│   │   └── components/
│   │       ├── ScoreOverviewSection.jsx        # Overall score + derived metrics row
│   │       ├── ScoreCategoryBreakdown.jsx      # Access/Embedded/Processing value category cards
│   │       ├── WeightedScoreCard.jsx           # Per-factor contribution table (Layer 2)
│   │       ├── CircularEconomyTierCard.jsx     # Tier badge + milestone guidance (Layer 2)
│   │       ├── ParameterConsistencyCard.jsx    # Consistency score + detected issues (Layer 2)
│   │       ├── RStrategyAlignmentCard.jsx      # R-strategy profile alignment (Layer 2)
│   │       ├── AuditSummaryCard.jsx            # Full LLM audit: verdict, gaps, roadmap, SDGs, market opp.
│   │       ├── DatabaseEvidenceCard.jsx        # Similar cases with drawer integration
│   │       ├── GapAnalysisCard.jsx             # Benchmark comparison against similar cases
│   │       ├── CaseSummary.jsx                 # Individual similar case display
│   │       └── ResultsSkeleton.jsx             # Loading skeleton
│   │
│   ├── AssessmentViewPage/
│   │   └── AssessmentViewPage.jsx              # Saved assessment view (same result sections as ResultsPage)
│   │
│   ├── AssessmentComparisonPage/
│   │   ├── AssessmentComparisonPage.jsx
│   │   └── components/
│   │       ├── ComparisonSkeleton.jsx          # Loading skeleton
│   │       ├── ChangeIndicator.jsx             # +/- change chip component
│   │       ├── OverviewTab.jsx                 # Input data, key insights, score snapshot, verdict
│   │       ├── FactorAnalysisTab.jsx           # Radar chart, bar chart, detailed factor table
│   │       ├── DetailsTab.jsx                  # Project details, gap analysis, enrichment cards
│   │       └── DatabaseEvidenceTab.jsx         # Side-by-side similar cases with score grids
│   │
│   ├── DashboardPage/
│   │   ├── DashboardPage.jsx                   # Global Intelligence Dashboard
│   │   └── components/
│   │       ├── StatCard.jsx                    # Metric display card with icon + label + value
│   │       ├── ChartPanel.jsx                  # Chart container with title, icon, loading skeleton
│   │       ├── SingleValueChart.jsx            # Fallback for single-data-point pie chart scenarios
│   │       ├── EmptyChart.jsx                  # Empty state placeholder for charts
│   │       └── SolutionCard.jsx                # Featured solution card with preview + drawer trigger
│   │
│   ├── MyAssessmentsPage/
│   │   ├── MyAssessmentsPage.jsx
│   │   ├── sortUtils.js                        # Sort helper functions
│   │   └── components/
│   │       ├── AssessmentListItem.jsx          # Individual assessment card/row
│   │       ├── FilterBar.jsx                   # Sort/filter/search controls
│   │       └── IndustryFilterChip.jsx          # Industry chip filter toggle
│   │
│   ├── AuthPage/AuthPage.jsx
│   ├── ComparePage/ComparePage.jsx             # Route wrapper → AssessmentComparisonPage
│   ├── GuidePage/GuidePage.jsx
│   ├── SharePage/SharePage.jsx                 # Public shared assessment view
│   └── NotFoundPage/NotFoundPage.jsx
│
├── components/                                 # Shared, page-agnostic components
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── SignupForm.jsx
│   │
│   ├── background/
│   │   └── DriftingShapesBackground.jsx        # Animated background component
│   │
│   ├── charts/
│   │   ├── BarChart.jsx      # Props: barConfigs, xAxisKey, height, showGrid, showLegend
│   │   ├── LineChart.jsx     # Props: lines, xAxisKey, height, showGrid
│   │   ├── PieChart.jsx      # Props: dataKey, nameKey, colors, innerRadius, showLegend
│   │   ├── RadarChart.jsx
│   │   └── index.js
│   │
│   ├── common/
│   │   ├── Button.jsx, Brand.jsx, Switch.jsx
│   │   ├── ErrorDisplay.jsx, LoaderComponent.jsx, LoaderIcon.jsx
│   │   ├── GlobalLoadingBar.jsx, ScrollToTop.jsx
│   │   ├── ChartWrapper.jsx
│   │   └── index.js
│   │
│   ├── dialogs/
│   │   ├── SaveAssessmentDialog.jsx
│   │   ├── DeleteAssessmentDialog.jsx
│   │   ├── RenameAssessmentDialog.jsx
│   │   ├── ResultsRestoreDialog.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── LimitReachedDialog.jsx
│   │   ├── ReplaceInputsDialog.jsx
│   │   ├── DialogManager.jsx
│   │   ├── dialogTypes.js
│   │   └── index.js
│   │   └── README.md         # Comprehensive dialog system documentation
│   │
│   ├── drawers/
│   │   ├── ResultsDatabaseEvidenceDetailsDrawer.jsx  # Single case full detail view
│   │   ├── AssessmentMethodologyDrawer.jsx
│   │   ├── BusinessContextHeadingInfoDrawer.jsx
│   │   ├── BusinessProblemInfoDrawer.jsx
│   │   ├── BusinessSolutionInfoDrawer.jsx
│   │   ├── EvaluationCriteriaDrawer.jsx
│   │   ├── EvaluationParametersHeadingInfoDrawer.jsx
│   │   ├── SampleTestCasesHeadingInfoDrawer.jsx
│   │   ├── SpecificEvaluationParameterInfoDrawer.jsx
│   │   ├── SpecificSampleTestCaseViewDetailsDrawer.jsx
│   │   ├── DrawerManager.jsx
│   │   ├── drawerTypes.js
│   │   └── index.js
│   │
│   ├── error-boundaries/
│   │   ├── GlobalErrorBoundary.jsx
│   │   ├── PageErrorBoundary.jsx
│   │   ├── ResultsErrorBoundary.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── index.js
│   │
│   ├── export/
│   │   ├── ExportActions.jsx
│   │   └── index.js
│   │
│   └── layout/
│       ├── Navbar.jsx, Header.jsx, Footer.jsx, AppContainer.jsx
│
├── features/
│   ├── assessments/
│   │   ├── api/
│   │   │   └── assessmentApi.js     # All API functions: scoreAssessment, getAssessments, saveAssessment,
│   │   │                              #   compareAssessments, getGlobalStats, getDocumentStats, etc.
│   │   ├── schemas/
│   │   │   └── assessmentSchema.js  # Zod response validation schemas
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAssessment.js           # Single assessment fetch (React Query)
│   │   │   ├── useAssessments.js          # List + delete with optimistic update
│   │   │   ├── useAssessmentComparison.js # Fetch and compare two assessments
│   │   │   ├── useAssessmentStats.js      # User aggregate stats (totalAssessments, avgScore, etc.)
│   │   │   ├── useDocumentStats.js        # Knowledge base stats (byIndustry, byCategory, byRStrategy)
│   │   │   ├── useFeaturedSolutions.js    # Featured solutions with optional semantic search
│   │   │   └── useGlobalStats.js          # Global dashboard stats from /api/analytics/global-stats
│   │   │
│   │   ├── utils.js        # reconstructScoringResult(), getAverageScore(), sort helpers
│   │   ├── utils.test.js
│   │   ├── validation.js   # Assessment form Zod schema + defaultValues
│   │   └── index.js        # Barrel re-exports for all hooks and utils
│   │
│   ├── export/
│   │   ├── exportCSV.js    # CSV generation (single assessment + comparison)
│   │   ├── exportPDF.js    # PDF generation with all enrichment sections
│   │   └── index.js
│   │
│   └── session/
│       ├── AppSessionManager.jsx   # Auto-save/restore evaluation state on mount/unmount
│       ├── hooks/useSession.js     # Session read/write hook (save, restore, clear)
│       └── index.js
│
├── hooks/                          # Cross-feature hooks
│   ├── useAuth.js           # Thin wrapper over AuthContext
│   ├── useDialog.js         # Open/close dialogs via DialogContext
│   ├── useDrawer.js         # Open/close drawers via DrawerContext
│   ├── useDrawerDirection.js # Responsive direction (right on desktop, bottom on mobile)
│   ├── useExportState.js    # Export progress state (isExporting, progress)
│   ├── useToast.js          # Toast notification wrapper
│   ├── useDebounce.js       # Debounce helper for input fields
│   └── index.js
│
├── contexts/
│   ├── AuthContext.jsx      # Supabase user session (user, isLoading, isAuthenticated)
│   ├── DialogContext.jsx    # Global dialog state + typed open functions
│   ├── DrawerContext.jsx    # Global drawer state + typed open functions per drawer type
│   └── ModalContext.jsx     # Global modal state
│
├── lib/
│   ├── apiClient.js         # buildApiUrl() — routes through Vercel proxy in production
│   ├── supabase.js          # Supabase client singleton
│   ├── formatting.js        # formatTimestamp(), getCurrentTimestampFormatted(), toTitleCase()
│   ├── metadata.js          # getIndustry(), getCategory() — prefers structured columns over JSONB
│   ├── scoring.js           # getScoreClass(), getScoreLabel(), formatFactorName(), getSimilarityPercent()
│   ├── storage.js           # localStorage wrapper with JSON serialisation + error handling
│   └── validation.js        # Shared Zod schemas and validation helpers
│
├── config/
│   ├── env.schema.js        # Zod schema for VITE_ environment variables
│   ├── frontend.config.js   # FRONTEND_CONFIG object (apiBaseUrl, supabaseUrl, etc.)
│   └── index.js
│
├── constants/
│   ├── evaluationData.js    # 8 evaluation parameters with weights, labels, descriptions
│   ├── industries.js        # Industry list for dropdowns
│   ├── industryThemes.js    # Industry-to-colour-theme mapping
│   ├── siteMetadata.js      # SEO metadata (title, description, OG tags)
│   ├── drawers/             # Drawer content constants (evaluation criteria, parameter info, etc.)
│   └── index.js
│
├── utils/
│   ├── cn.js                # classnames merge (clsx + tailwind-merge) — use this, not cx
│   ├── content.js           # extractProblemSolution() for drawer content parsing
│   ├── session.js           # Session storage helpers (keys, serialisation)
│   ├── async.js             # Async utilities (sleep, retry, timeout)
│   ├── ui.js                # UI helpers (truncate, formatPercentage)
│   └── logger.js            # Logging utility (respects VITE_LOG_LEVEL)
│
├── test/                    # Test utilities and configuration
│   └── test-utils.jsx       # Custom render with providers for testing
│
├── types/                   # TypeScript type definitions
│   └── index.d.ts           # Global type declarations
│
├── index.css                # Global styles + Tailwind directives
├── main.jsx                 # React entry point
├── setupTests.js            # Vitest global setup
├── vite.config.js           # Vite configuration with aliases and chunking
└── package.json             # Dependencies and scripts
```

## Routes

| Path                     | Component            | Auth | Description                               |
| ------------------------ | -------------------- | ---- | ----------------------------------------- |
| `/`                      | `LandingPage`        | No   | Assessment input form with guided mode    |
| `/auth`                  | `AuthPage`           | No   | Login / signup                            |
| `/guide`                 | `GuidePage`          | No   | Help & methodology documentation          |
| `/results`               | `ResultsPage`        | No   | Results for session-based scoring         |
| `/assessments`           | `MyAssessmentsPage`  | Yes  | Saved assessment history                  |
| `/assessments/:id`       | `AssessmentViewPage` | Yes  | View single saved assessment              |
| `/assessments/share?id=` | `SharePage`          | No   | Public shared assessment view             |
| `/compare`               | `ComparePage`        | Yes  | Side-by-side comparison (query: id1, id2) |
| `/dashboard`             | `DashboardPage`      | No   | Global analytics dashboard                |
| `*`                      | `NotFoundPage`       | —    | 404                                       |

## Setup & Installation

### Prerequisites

- Node.js 24+
- npm 8+
- Backend server running (see `backend/README.md`)
- Supabase account

### Installation

```bash
# 1. Install dependencies (from workspace root)
npm install

# 2. Create environment file
cp ../env/.env.example .env.frontend

# 3. Configure environment variables
# Edit .env.frontend with your Supabase credentials and API URL

# 4. Start development server
npm run dev   # http://localhost:5173

# Or from workspace root:
npm run frontend   # Starts frontend only
```

## Environment Configuration

```env
# Backend API URL — points to your Express backend
VITE_API_URL=http://localhost:8000

# Supabase (must match backend project)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyxxxxxxxxxxxxx

# Frontend URL (used for share links)
VITE_FRONTEND_URL=http://localhost:5173

# Optional feature flags
VITE_LOG_LEVEL=debug
VITE_ENABLE_ANALYTICS=true
```

**Important notes:**

1. **No Secret Keys in Frontend** — `INTERNAL_BACKEND_API_KEY` is **never** included in frontend env variables.
2. **Proxy Pattern** — all API calls in production route through `/api/proxy`, which injects the secret key server-side via Vercel serverless function.
3. **Anonymous Access** — frontend works without authentication; the backend enforces rate limits.

### Configuration Object

Access configuration via `FRONTEND_CONFIG` anywhere in the app:

```javascript
import { FRONTEND_CONFIG } from '@/config';

FRONTEND_CONFIG.apiBaseUrl; // Backend URL
FRONTEND_CONFIG.supabaseUrl; // Supabase URL
FRONTEND_CONFIG.supabaseAnonKey; // Anon key
FRONTEND_CONFIG.frontendUrl; // Frontend URL
```

## Development

### Scripts

```bash
npm run dev         # Development server at http://localhost:5173 (HMR enabled)
npm run build       # Production build → dist/
npm run preview     # Serve dist/ locally for production preview
npm test            # Run Vitest test suite
npm run test:watch  # Watch mode
npm run test:run    # Run tests once
npm run lint        # ESLint
npm run clean       # Clean node_modules
```

## Architecture

### Secure Proxy Architecture

To keep the backend API key secret, all frontend → backend requests flow through a Vercel serverless proxy:

Browser → /api/proxy?path=/api/score → Vercel Function → adds x-api-key → Backend

**How it works:**

1. `buildApiUrl()` — returns `/api/proxy?path=...` in production, direct URL in development
2. Proxy Function (`api/proxy.js`) — Vercel serverless function that:
   - Reads `INTERNAL_BACKEND_API_KEY` from Vercel environment (server-only)
   - Forwards all request headers (Authorization, User-Agent, IP)
   - Adds `x-api-key` header with the secret
   - Returns backend response to client
3. Backend (`server/app.js`) — validates `x-api-key` via `apiKeyGuard` middleware

### API Client Helper

Always use `buildApiUrl()` for all backend calls:

```javascript
import { buildApiUrl } from '@/lib/apiClient';

// Automatic proxy routing in production, direct URL in development
const url = buildApiUrl('/api/score');

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ businessProblem, businessSolution, evaluationParameters }),
});
```

### State Management

**Global state** (React Contexts):

```javascript
import { useAuth } from '@/hooks/useAuth'; // Supabase user session
import { useDialog } from '@/hooks/useDialog'; // Global confirmation dialogs
import { useDrawer } from '@/hooks/useDrawer'; // Global side drawers
import { useToast } from '@/hooks/useToast'; // Toast notifications
```

**Server state** (TanStack React Query):

```javascript
import { useAssessment, useAssessments, useGlobalStats } from '@/features/assessments';

const { assessment, isLoading } = useAssessment(id);
const { assessments, deleteAssessment } = useAssessments();
const { totalScoringCalls, avgScore, scoreDistribution } = useGlobalStats();
```

Benefits of React Query:

- Automatic caching and background refetching
- Stale-while-revalidate pattern
- Optimistic updates for delete operations
- Error boundary integration

### Context Usage

```javascript
// Open a dialog
const { openDialog } = useDialog();
openDialog({ type: 'deleteAssessment', payload: { id } });

// Open a drawer
const { openResultsDatabaseEvidenceDetailsDrawer } = useGlobalDrawer();
openResultsDatabaseEvidenceDetailsDrawer({
  title: caseItem.title,
  content: caseItem.problem || '',
  caseItem,
  matchPercentage: 72,
  matchStrengthLabel: 'Strong Match',
  matchColor: '#22c55e',
  sourceCaseId: caseItem.id,
});
```

### Component Patterns

**HeroUI v3 Components:**

```jsx
import { Card, Skeleton, Chip, Input } from '@heroui/react';

<Card className="border border-slate-200 bg-white shadow-sm">
  <div className="p-5">
    <Skeleton className="h-3 w-20 rounded-full" />
  </div>
</Card>;
```

**Custom hooks:**

```javascript
const { user, isLoading } = useAuth();
const { showToast } = useToast();
const { isDrawerOpen, onClose } = useGlobalDrawer();
```

### Charts

All chart components use consistent prop patterns — never use `xKey`, `yKey`, or `fill` directly:

```jsx
// BarChart
<BarChart
  data={[{ name: 'Construction', count: 89 }]}
  barConfigs={[{ dataKey: 'count', name: 'Assessments', fill: '#10b981' }]}
  xAxisKey="name"
  height={200}
  showGrid
  showLegend={false}
/>

// LineChart
<LineChart
  data={[{ period: '2026-W10', count: 45 }]}
  lines={[{ dataKey: 'count', stroke: '#3b82f6', name: 'Assessments' }]}
  xAxisKey="period"
  height={200}
/>

// PieChart
<PieChart
  data={[{ name: 'Leader', value: 45 }]}
  dataKey="value"
  nameKey="name"
  height={200}
  showLegend
  innerRadius={40}
  colors={['#22c55e', '#3b82f6', '#f59e0b', '#ef4444']}
/>
```

**Single data point fallback** — when a pie chart has only 1 data point, use `SingleValueChart` from `DashboardPage/components/`:

```jsx
// Check before rendering PieChart:
const hasEnoughData = data.length >= 2 && data.reduce((s, d) => s + d.value, 0) >= 2;

{hasEnoughData
  ? <PieChart data={data} ... />
  : <SingleValueChart name={data[0]?.name} value={data[0]?.value} color="#10b981" />
}
```

### Assessment Result Reconstruction

Saved assessments store both promoted scalar columns and a full `result_json` snapshot. Use `reconstructScoringResult()` to get the complete API shape from either source:

```javascript
import { reconstructScoringResult } from '@/features/assessments/utils';

// Works with both freshly scored results and saved assessment records
const result = reconstructScoringResult(assessment);

// Access any field:
result.weighted_score_card;
result.circular_economy_tier;
result.parameter_consistency;
result.r_strategy_alignment;
result.audit.improvement_roadmap;
result.similar_cases;
result.gap_analysis;
```

### Page Flow

```txt
/ (LandingPage)
│
├── User fills in businessProblem + businessSolution
├── Optional: businessContext fields (Layer 1)
├── Optional: guided mode or manual parameter entry
│
├── POST /api/score
│
└── /results (ResultsPage)
    │
    ├── ScoreOverviewSection (overall score + derived metrics)
    ├── ScoreCategoryBreakdown (value category cards)
    ├── WeightedScoreCard (Layer 2 — factor contributions)
    ├── CircularEconomyTierCard (Layer 2 — tier classification)
    ├── ParameterConsistencyCard (Layer 2 — coherence check)
    ├── RStrategyAlignmentCard (Layer 2 — strategy validation)
    ├── AuditSummaryCard (Layer 3 — verdict, roadmap, SDGs, market opp.)
    ├── DatabaseEvidenceCard (similar cases → drawer for full detail)
    ├── GapAnalysisCard (benchmark comparison)
    │
    ├── Save Assessment → POST /api/assessments
    ├── Export → exportCSV.js or exportPDF.js
    └── Share → generates public_id link → /assessments/share?id=
```

### Key Routes (from AppRoutes.jsx)

```javascript
/                           // LandingPage — assessment input
/auth                       // AuthPage — login/signup
/guide                      // GuidePage — help & methodology
/results                    // ResultsPage — freshly scored result (session-based)
/assessments                // MyAssessmentsPage — saved history (auth required)
/assessments/:id            // AssessmentViewPage — view saved assessment
/assessments/share?publicId= // SharePage — public shared view (no auth)
/compare?id1=X&id2=Y        // ComparePage → AssessmentComparisonPage
/dashboard                  // DashboardPage — global analytics
```

### Session Management

```javascript
import { useSession } from '@/features/session';

const { restoreEvaluation, saveSession, clearSession } = useSession();
```

- Auto-saves evaluation inputs to localStorage on every change
- Restores previous session results on page reload (shown via `ResultsRestoreDialog`)
- Clears session on user request or after successful save

### Metadata Helpers

```javascript
import { getIndustry, getCategory } from '@/lib/metadata';

// Prefers structured top-level columns over JSONB fallback:
const industry = getIndustry(assessment.result_json);
const category = getCategory(assessment.result_json);
```

## Testing

### Running Tests

```bash
npm test                                                      # All tests
npm test -- --watch                                          # Watch mode
npm test -- --coverage                                       # Coverage report

# Specific files:
npm test src/features/assessments/utils.test.js              # reconstructScoringResult (13 tests)
npm test src/components/common/Button.test.jsx               # Button component
npm test src/pages/MyAssessmentsPage/sortUtils.test.js       # Sort utilities
```

### Test Suite Coverage

| Test File                                                        | Tests | Key Coverage                                                                                                                                   |
| ---------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/assessments/utils.test.js`                             | 13    | `reconstructScoringResult` (10 tests: null input, result_json passthrough, column fallback, enrichment fields mapping), sort helpers (3 tests) |
| `features/assessments/hooks/useFeaturedSolutions.test.jsx`       | —     | Featured solutions hook                                                                                                                        |
| `features/session/AppSessionManager.test.jsx`                    | —     | Session persistence                                                                                                                            |
| `components/common/Button.test.jsx`                              | —     | Button rendering and interactions                                                                                                              |
| `components/common/Switch.test.jsx`                              | —     | Switch toggle                                                                                                                                  |
| `components/common/ChartWrapper.test.jsx`                        | —     | Chart wrapper                                                                                                                                  |
| `components/charts/LineChart.test.jsx`                           | —     | LineChart rendering                                                                                                                            |
| `components/charts/PieChart.test.jsx`                            | —     | PieChart rendering + snapshots                                                                                                                 |
| `components/dialogs/ResultsRestoreDialog.test.jsx`               | —     | Dialog component                                                                                                                               |
| `components/auth/SignupForm.test.jsx`                            | —     | Sign-up form                                                                                                                                   |
| `contexts/AuthContext.test.jsx`                                  | —     | Auth context                                                                                                                                   |
| `hooks/useDrawer.test.jsx`                                       | —     | Drawer hook                                                                                                                                    |
| `lib/formatting.test.js`                                         | —     | Formatting helpers                                                                                                                             |
| `lib/storage.test.js`                                            | —     | LocalStorage wrapper                                                                                                                           |
| `pages/LandingPage/components/SampleTestCasesContainer.test.jsx` | —     | Sample cases                                                                                                                                   |
| `pages/MyAssessmentsPage/sortUtils.test.js`                      | —     | Sort utilities                                                                                                                                 |

### Writing Tests

**Component test:**

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '@/components/common/Button';

describe('Button Component', () => {
  it('renders with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

**Hook test:**

```javascript
import { renderHook } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

test('debounces value', async () => {
  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
    initialProps: { value: 'initial' },
  });
  rerender({ value: 'updated' });
  // value is still 'initial' until debounce delay passes
});
```

### Test Configuration

- **Config**: `vite.config.js` (test section)
- **Setup**: `src/setupTests.js`
- **Utilities**: `src/test/test-utils.jsx` (custom render with providers)
- **Environment**: jsdom with globals enabled

## Building & Deployment

### Deploy to Vercel (Recommended)

Vercel is the recommended platform — static SPA + serverless proxy in one deployment.

**Prerequisites:**

1. Vercel account at [vercel.com](https://vercel.com)
2. GitHub repo connected

**Deployment Steps:**

```bash
# 1. Push code to GitHub
git push origin main

# 2. Import project to Vercel at https://vercel.com/new

# 3. Configure environment variables in Vercel dashboard:
#    VITE_API_URL=https://your-backend.render.com
#    VITE_SUPABASE_URL=https://your-project.supabase.co
#    VITE_SUPABASE_ANON_KEY=your-anon-key
#    VITE_FRONTEND_URL=https://your-app.vercel.app
#    INTERNAL_BACKEND_API_KEY=your-secret-backend-key  ← server-only, never VITE_ prefixed

# 4. Deploy (automatic on every git push to main)
```

**Vercel Configuration** (`vercel.json`):

```json
{
  "functions": {
    "api/**/*.js": { "runtime": "nodejs18.x" }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Key points:

- `/api/*` routes → serverless functions (NOT the SPA rewrite)
- All other routes → `index.html` (SPA client-side routing)
- Runtime updated to Node.js 18.x to match frontend requirements

### Deployment Checklist

- [ ] All `VITE_*` variables configured in Vercel
- [ ] `INTERNAL_BACKEND_API_KEY` set in Vercel (server-only — not in `.env` file, not in git)
- [ ] Backend CORS `ALLOWED_ORIGINS` includes `*.vercel.app` and your custom domain
- [ ] `vercel.json` correctly configured
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Preview environment tested before promoting to production
- [ ] DNS configured for custom domain (if applicable)

## Architecture Patterns

### React Query for Server State

Asynchronous backend data uses TanStack React Query for caching, deduplication, and background refresh:

```javascript
import { useAssessment } from '@/features/assessments';

const { assessment, isLoading, error } = useAssessment(id);
```

Configure stale times for different data freshness requirements:

```javascript
useQuery({
  queryKey: ['global-stats'],
  queryFn: getGlobalStats,
  staleTime: 5 * 60 * 1000, // 5 minutes — dashboard data doesn't need to be real-time
  gcTime: 30 * 60 * 1000, // 30 minutes in cache
});
```

### Custom Hooks for Logic Extraction

Complex logic lives in custom hooks, not components:

```javascript
export function useExportState() {
  const [isExporting, setIsExporting] = useState(false);
  // All export logic...
  return { isExporting, executeExport };
}
```

### Constants Over Magic Values

```javascript
// ✓ Good
import { EVALUATION_PARAMETERS } from '@/constants/evaluationData';
if (score >= EVALUATION_PARAMETERS.resource_efficiency.threshold) { ... }

// ✗ Avoid
if (score >= 75) { ... }
```

### Code Organisation Best Practices

- Page components in `pages/PageName/PageName.jsx`
- Page-specific subcomponents in `pages/PageName/components/`
- Shared subcomponents in `components/` (only when used by 2+ pages)
- Business logic in `features/` hooks, never inline in page components
- All constants in `constants/`, never hardcoded in components

## Styling

### Tailwind CSS v4

Utility-first styling applied directly in JSX:

```jsx
<div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
  <h2 className="text-xl font-bold text-slate-900">Title</h2>
  <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Label</span>
</div>
```

### HeroUI v3

Pre-built accessible components styled with Tailwind:

```jsx
import { Card, Skeleton, Chip, Input, Drawer } from '@heroui/react';

<Skeleton className="h-3 w-20 rounded-full" />
<Chip size="sm" variant="secondary">Tag</Chip>
```

### className Merging

Always use `cn()` from `@/utils/cn` when combining conditional classes:

```javascript
import { cn } from '@/utils/cn';

<div
  className={cn(
    'rounded-xl border p-5',
    isActive && 'border-indigo-500 bg-indigo-50',
    isDisabled && 'cursor-not-allowed opacity-40',
  )}
/>;
```

## Security Considerations

### API Key Protection

✓ **Correct:**

- `INTERNAL_BACKEND_API_KEY` lives only in Vercel server-side environment variables
- Proxy function reads it server-side and injects `x-api-key` header
- Frontend code and browser DevTools never have access to the secret

✗ **Never:**

- Store the backend API key in any `VITE_` prefixed env variable
- Hardcode secrets in source code
- Commit `.env` files with real credentials

### Data Privacy

- Anonymous requests are rate-limited per IP
- User data requests require Supabase Auth Bearer tokens
- Shared assessments use opaque `publicId` — not the internal UUID
- `scoring_results_log` access from frontend requires going through the backend endpoint

### CORS & CSRF

- Backend validates the `Origin` header against `ALLOWED_ORIGINS`
- Proxy function adds required headers and forwards Authorization
- Supabase handles auth tokens via secure HTTP-only cookies

## Troubleshooting

### "API calls failing with 401 Unauthorized"

- Verify `INTERNAL_BACKEND_API_KEY` is set in Vercel environment (not `VITE_` prefixed)
- Check `api/proxy.js` is forwarding the `x-api-key` header
- Confirm backend `apiKeyGuard` middleware is active

### "CORS errors in browser console"

- Backend `ALLOWED_ORIGINS` must include your Vercel domain (`*.vercel.app`)
- Check whether the route is in `PUBLIC_ROUTES` (CORS-exempt)
- Verify `vercel.json` routes `/api/*` to serverless functions (not SPA)

### "Session not restoring after reload"

- Check browser localStorage is enabled
- Verify component is inside `<AppProvider>`
- Check browser console for storage quota exceeded errors

### "Charts show 'No data available' or render incorrectly"

Wrong prop names — the most common chart bug. Use these exact props:

- `BarChart`: `barConfigs={[{dataKey, fill, name}]}` + `xAxisKey`
- `LineChart`: `lines={[{dataKey, stroke, name}]}` + `xAxisKey`
- `PieChart`: `dataKey` + `nameKey` + `colors` array

### "Pie chart renders as a solid circle with '· 1'"

You have only 1 data point. The `PieChart` component doesn't handle single values gracefully. Use `SingleValueChart` from `DashboardPage/components/` as a fallback when `data.length < 2`.

### "Build fails: VITE\_ env variables undefined"

- Only `VITE_*` prefixed variables are exposed to client code
- Restart the dev server after changing `.env.frontend`
- In Vercel, add variables in the dashboard — they won't be in `.env` in production

### "Clear caches and reinstall"

```bash
npm run clean
npm install
npm run build
```

### HeroUI Component Issues

- Ensure HeroUI v3 is installed (not v2)
- Check Tailwind CSS v4 is configured in `vite.config.js`
- Verify `HeroUIProvider` is present in `AppProvider.jsx`

## Contributing

### Code Style

- **Formatting**: ESLint + Prettier (configured — runs on save in VS Code)
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Components**: functional components with hooks — no class components

### Commit Messages

```txt
feat: add SDG alignment section to ResultsPage
fix: resolve PieChart single data point rendering
docs: update chart prop patterns in README
test: add reconstructScoringResult column fallback tests
refactor: extract SolutionCard into DashboardPage/components
```

### Pull Request Process

1. Fork repo and create a feature branch
2. Implement changes with tests
3. Run `npm test` and `npm run build`
4. Submit PR with description of changes and screenshots if UI changed
5. Address review feedback

## Key Features

### 1. Evaluation Engine

#### Multi-Dimensional Scoring

- 8 evaluation parameters across circular economy dimensions
- Evidence-based scoring with AI reasoning and semantic retrieval
- Confidence scoring and integrity gap analysis

#### Assessment Enrichment Layers

**Layer 1 — Business Context** (optional, `BusinessContextContainer.jsx`)

- Business Model Type: PaaS, take-back, remanufacturing, recycling, etc.
- Operational Stage: idea → prototype → pilot → scaling → mature operation
- Target Geography: local → regional → global
- Annual Volume: material processing volume
- Material Complexity: single → multi-material → hazardous → electronics → biological
- Supply Chain Partnerships: existing collection/distribution relationships

These optional context fields improve AI reasoning and enable stage-appropriate scoring.

**Layer 2 — Deterministic Outputs** (computed without LLM)

- Weighted Score Card: per-factor contribution breakdown with Strong/Moderate/Weak/Critical classifications
- Circular Economy Tier: Leader/Established/Developing/Emerging with percentile estimates
- Parameter Consistency: score coherence analysis detecting internally contradictory inputs
- R-Strategy Alignment: validates scores match the detected circular strategy profile

**Layer 3 — Extended LLM Output** (GPT-4o-mini)

- Improvement Roadmap: 3 prioritised actions with effort/impact/timeframe
- SDG Alignment: 2–4 UN Sustainable Development Goals with rationale
- Market Opportunity Summary: grounded in database evidence

**Key files:**

- `src/constants/evaluationData.js` — 8 parameter definitions with weights
- `src/lib/scoring.js` — score formatting, colour mapping, tier labels
- `src/features/assessments/api/assessmentApi.js` — API calls
- `src/pages/ResultsPage/components/` — all result section components

### 2. Smart Navigation & Routing

**Current routes** (from `src/app/AppRoutes.jsx`):

```code
/                           → LandingPage          (assessment input)
/auth                       → AuthPage             (login/signup)
/guide                      → GuidePage            (help & methodology)
/results                    → ResultsPage          (session-based scoring results)
/assessments                → MyAssessmentsPage    (saved history, auth required)
/assessments/:id            → AssessmentViewPage   (view saved assessment, auth required)
/assessments/share?id=      → SharePage           (public shared view, no auth)
/compare                    → ComparePage          (side-by-side comparison, auth required)
/dashboard                  → DashboardPage        (global analytics)
*                           → NotFoundPage
```

... (rest of the code remains the same)
**Related files:**

- `src/app/AppRoutes.jsx` — route definitions
- `src/pages/` — page components, each with their own `components/` subfolder
- `src/contexts/` — dialog, drawer, and auth state

### 3. Session Management

**Features:**

- Auto-saves evaluation inputs to localStorage on every change
- `AppSessionManager` detects existing session on app load
- `ResultsRestoreDialog` prompts user to restore or start fresh
- Clears session on successful save or explicit user request

**Related files:**

- `src/features/session/AppSessionManager.jsx` — orchestrates save/restore lifecycle
- `src/features/session/hooks/useSession.js` — session read/write hook
- `src/utils/session.js` — localStorage key helpers
- `src/lib/storage.js` — JSON-safe localStorage wrapper

```javascript
const { restoreEvaluation, saveSession, clearSession } = useSession();
```

### 4. Data Visualisation

**Chart types:**

- **RadarChart** — multi-dimensional score comparison vs market average
- **BarChart** — factor comparisons, industry volume, R-strategy distribution
- **LineChart** — weekly trend, score over time
- **PieChart** — CE tier, risk level, scale distribution (with single-value fallback)

**Related files:**

- `src/components/charts/` — BarChart, LineChart, PieChart, RadarChart
- Powered by **Recharts** library

All charts use consistent prop APIs — see the [Charts](#charts) section for correct usage.

### 5. Export Capabilities

**Formats:**

- **CSV**: raw data with all metrics — easily importable into spreadsheets
- **PDF**: formatted full report including SDG alignment, roadmap, similar cases

**Related files:**

- `src/features/export/exportCSV.js` — CSV generation, single + comparison
- `src/features/export/exportPDF.js` — PDF generation with all enrichment sections
- `src/components/export/ExportActions.jsx` — export button UI
- Uses Blob API for client-side generation (no server round-trip)

```javascript
import { exportAssessmentCSV, exportAssessmentPDF } from '@/features/export';

await exportAssessmentCSV(assessment); // triggers download
await exportAssessmentPDF(assessment); // triggers download
```

### 6. Metadata & Structured Data

The `documents` table has `industry` and `category` as first-class indexed columns. Use the helpers that prefer structured columns over JSONB fallback:

```javascript
import { getIndustry, getCategory } from '@/lib/metadata';

const industry = getIndustry(assessment.result_json);
// Priority: result_json.metadata.industry → result_json.industry → column value

const category = getCategory(assessment.result_json);
```

Used in: `ResultsPage`, `AssessmentViewPage`, `AssessmentComparisonPage`.

## Development Guide

### Running the Dev Server

```bash
npm run dev
```

- Vite server starts at `http://localhost:5173`
- Hot Module Replacement (HMR) enabled
- API calls route to `VITE_API_URL` (default: `http://localhost:8000`)

### Building for Production

```bash
npm run build
```

- Optimised build output to `dist/`
- Code splitting and tree-shaking applied
- Source maps generated (configurable in `vite.config.js`)

### Preview Production Build

```bash
npm run preview
```

Serves `dist/` locally. Use to test production behaviour before deploying.

### Code Organisation Best Practices

#### Components

```jsx
// ✓ Good — self-contained, focused component
export default function ResultsPage() {
  const { id } = useParams();
  const { assessment, isLoading } = useAssessment(id);
  const result = reconstructScoringResult(assessment);

  if (isLoading) return <ResultsSkeleton />;
  return (
    <>
      <ScoreOverviewSection result={result} />
      <WeightedScoreCard data={result.weighted_score_card} />
    </>
  );
}
```

#### Hooks

```javascript
// ✓ Good — custom hook extracts reusable logic
export function useAssessmentStats({ enabled = true } = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['assessment-stats'],
    queryFn: () => getAssessmentStats(),
    enabled,
    staleTime: 0,
  });

  return { ...data, isLoading, error };
}
```

#### API Calls

```javascript
// ✓ Good — use buildApiUrl for automatic proxy routing
import { buildApiUrl } from '@/lib/apiClient';

const url = buildApiUrl('/api/score');

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ businessProblem, businessSolution, evaluationParameters }),
});
```

#### Constants

```javascript
// ✓ Good — centralised, named constants; no magic values
import { EVALUATION_PARAMETERS } from '@/constants/evaluationData';

const weight = EVALUATION_PARAMETERS.resource_efficiency.weight;
const label = EVALUATION_PARAMETERS.resource_efficiency.label;
```

## Components Reference

### Available Components

- **Common**: Button, Brand, Switch, ErrorDisplay, LoaderComponent, LoaderIcon, GlobalLoadingBar, ScrollToTop, ChartWrapper
- **Charts**: BarChart, LineChart, PieChart, RadarChart
- **Dialogs**: SaveAssessmentDialog, DeleteAssessmentDialog, RenameAssessmentDialog, ResultsRestoreDialog, ConfirmDialog, LimitReachedDialog, ReplaceInputsDialog
- **Drawers**: ResultsDatabaseEvidenceDetailsDrawer, AssessmentMethodologyDrawer, info drawers for evaluation parameters and sample test cases
- **Layout**: Navbar, Header, Footer, AppContainer
- **Auth**: LoginForm, SignupForm
- **Export**: ExportActions
- **Error Boundaries**: GlobalErrorBoundary, PageErrorBoundary, ResultsErrorBoundary

### Dialog System

See [src/components/dialogs/README.md](./src/components/dialogs/README.md) for comprehensive documentation on the reusable dialog system, including how to add new dialog types and use the `DialogContext`.

## Performance Optimisation

### Code Splitting

Routes are lazy-loaded automatically by React Router:

```javascript
const ResultsPage = lazy(() => import('@/pages/ResultsPage/ResultsPage'));
```

### Image Optimisation

Use modern formats and lazy loading:

```jsx
<img src="/image.webp" alt="Description" loading="lazy" />
```

### Bundle Analysis

```bash
npm run build -- --analyze
# or view Vercel Analytics dashboard after deployment
```

### Caching Strategy

Configure React Query stale times appropriately:

```javascript
// Dashboard global stats — cache for 5 minutes
useQuery({
  queryKey: ['global-stats'],
  queryFn: getGlobalStats,
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});

// User assessments — always fetch fresh
useQuery({
  queryKey: ['assessments'],
  queryFn: getAssessments,
  staleTime: 0,
  gcTime: 0,
});
```

## Support & Issues

For issues or questions:

1. Check existing issues in GitHub
2. Review this README and the related docs linked in **See Also**
3. Check browser DevTools console for client-side errors
4. Check backend server logs for API errors
5. Contact the development team with relevant logs and reproduction steps

## See Also

- [Root README](../../README.md) — Full-stack architecture and quick start
- [Backend README](../../backend/README.md) — API reference and scoring pipeline
- [Dialogs README](./src/components/dialogs/README.md) — Dialog system documentation
- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [HeroUI v3 Docs](https://www.heroui.com)
- [Recharts Docs](https://recharts.org)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [TanStack Query Docs](https://tanstack.com/query)

---

**Last Updated:** 23 March 2026
**Frontend Version:** React 19 / Vite 7 / HeroUI v3 / Tailwind v4
