# CircularIQ Frontend — Circular Economy Assessor UI/UX

React 19 + Vite 7 SPA for assessing, visualising, comparing, and managing circular economy evaluations.

- **Authors:** [Areeb Ahmed Zahoori](mailto:areebrawl@gmail.com) & [Mahit Singh](mailto:mahitsingh02@gmailcom)
- **Repository:** [areetampo/circular-iq](https://github.com/areetampo/circular-iq)
- **License:** MIT

## Overview

The frontend provides:

1. **Assessment Flow** — guided questionnaires with optional business context + 8 evaluation parameters
2. **Results Display** — interactive charts, enrichment sections (tier, consistency, alignment, audit, similar cases, gap analysis)
3. **Solutions Search** — semantic search across 6,000+ real circular economy case studies
4. **Global Activity** — live analytics from all scoring calls worldwide
5. **Uptime Monitoring** — real-time system health dashboard with SSE streaming, configurable polling duration and toggleable clock-aligned bucket display
6. **Export Functionality** — PDF reports and CSV data exports
7. **Assessment History** — save, rename, delete, compare, and share assessments
8. **Session Management** — automatic save/restore across browser sessions
9. **Anonymous Usage** — 5 free assessments with IP-based tracking; unlimited for logged-in users

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
frontend/
├── api/
│   └── proxy.js                      # Legacy helper; production routing uses vercel.json rewrite to backend
│
├── package.json                      # Frontend dependencies and scripts
│
├── public/                           # Static assets (app-bg.svg, site-logo images)
│
├── src/
│   ├── app/                          # Root component, routes, global providers
│   │   ├── App.jsx                   # Root component with providers and routing
│   │   ├── AppProvider.jsx           # Global context providers (Auth, Dialog, Drawer, Modal, QueryClient)
│   │   └── AppRoutes.jsx             # All route definitions
│   │
│   ├── components/                   # Shared UI: charts, common, dialogs, drawers, export, layout, error-boundaries etc
│   ├── config/                       # Frontend configuration with route definitions and query parameters
│   ├── constants/                    # Evaluation data, industries, drawer + dialog constants etc
│   ├── contexts/                     # React Context providers (Auth, Dialog, Drawer) etc
│   ├── features/                     # Feature modules: assessments, export, search, session etc
│   ├── hooks/                        # Custom React hooks (useAuth, useDebounce, etc.)
│   ├── index.css                     # Global styles + Tailwind directives
│   ├── lib/                          # API client, formatting, metadata, scoring, storage, supabase, validation etc
│   ├── main.jsx                      # React entry point
│   ├── pages/                        # Page components (LandingPage, ResultsPage, UptimeMonitorPage, etc.) (90+ items)
│   ├── setupTests.js                 # Vitest global setup
│   ├── test/                         # Test files
│   ├── types/                        # TypeScript type definitions
│   └── utils/                        # Utility functions
│
├── tsconfig.json                     # TypeScript configuration
├── tsconfig.node.json                # Node.js TypeScript configuration
├── vercel.json                       # Vercel deployment configuration
├── vite.config.js                    # Vite configuration with aliases and chunking
└── vitest.config.js                  # Vitest test configuration
```

## Routes

| Path                           | Component          | Auth | Description                             |
| ------------------------------ | ------------------ | ---- | --------------------------------------- |
| `/`                            | LandingPage        | No   | Assessment input form                   |
| `/auth`                        | AuthPage           | No   | Login and signup page                   |
| `/results`                     | ResultsPage        | No   | Interactive results display             |
| `/solutions`                   | SolutionsPage      | No   | Case study search and discovery         |
| `/global-activity`             | GlobalActivityPage | No   | Global activity analytics               |
| `/guide`                       | GuidePage          | No   | Product guide and instructions          |
| `/assessments`                 | MyAssessmentsPage  | Yes  | User's assessment history               |
| /assessments/:publicId         | ResultsPage        | Yes  | View user's own saved assessment        |
| `/assessments/share`           | SharePage          | No   | Share assessment form                   |
| `/assessments/share/:publicId` | AssessmentViewPage | No   | Direct shared assessment view           |
| `/assessments/compare`         | ComparePageWrapper | No   | Compare two assessments                 |
| `/uptime-monitor`              | UptimeMonitorPage  | No   | Real-time system health dashboard (SSE) |
| `*`                            | `NotFoundPage`     | —    | 404                                     |

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

# App URL (used for share links)
VITE_APP_URL=http://localhost:5173

# Optional feature flags
VITE_LOG_LEVEL=debug
VITE_ENABLE_ANALYTICS=true
```

**Important notes:**

1. **No Secret Keys in Frontend** — `INTERNAL_BACKEND_API_KEY` is **never** included in frontend env variables.
2. **Proxy Pattern** — production uses `frontend/vercel.json` rewrite to route `/api/*` to the backend; development uses `VITE_API_URL` directly.
3. **Anonymous Access** — frontend works without authentication; the backend enforces rate limits.

### Configuration Object

Access configuration via `FRONTEND_CONFIG` anywhere in the app:

```js
import { FRONTEND_CONFIG } from '@/config/frontend.config';

FRONTEND_CONFIG.app.appUrl; // Frontend URL
FRONTEND_CONFIG.app.apiUrl; // Backend URL
FRONTEND_CONFIG.supabaseUrl; // Supabase URL
FRONTEND_CONFIG.supabaseAnonKey; // Anon key
```

## Development

### Scripts

```bash
npm run dev         # Development server at http://localhost:5173 (HMR enabled)
npm run build       # Production build → dist/
npm run preview     # Serve dist/ locally for production preview
npm run test        # Run Vitest test suite
npm run test:watch  # Watch mode
npm run test:run    # Run tests once
npm run lint        # ESLint
npm run clean       # Clean node_modules
```

## Architecture

### Production API Routing

In production, Vercel rewrites `/api/*` requests to the backend host configured in `frontend/vercel.json`.

Browser → `/api/<path>` → Vercel rewrite → backend service

**How it works:**

1. `buildApiUrl()` returns a relative `/api/...` path in production and a direct `VITE_API_URL` URL in development.
2. `frontend/vercel.json` rewrites frontend API requests to the backend host.
3. `frontend/api/proxy.js` remains in the repo as a legacy helper, but it is not the primary API routing path in production.

### API Client Helper

Always use `buildApiUrl()` for all backend calls:

```js
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

```js
import { useAuth, useDialog, useDrawer } from '@/hooks'; // Supabase user session, dialogs, drawers
```

**Server state** (TanStack React Query):

```js
import { useAssessment, useAssessments, useGlobalStats } from '@/features/assessments/hooks';

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

```js
// Open a dialog
const { openDeleteAssessmentDialog } = useDialog();
openDeleteAssessmentDialog({
  assessmentName: 'My Assessment',
  assessmentId: '123',
});

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

```js
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

**Single data point fallback** — when a pie chart has only 1 data point, use `SingleValueChart` from the respective page components:

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

```js
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
    └── Share → generates public_id link → /assessments/share/:id
```

### Key Routes (from AppRoutes.jsx)

```js
/                           // LandingPage — assessment input
/auth                       // AuthPage — login/signup
/guide                      // GuidePage — help & methodology
/results                    // ResultsPage — freshly scored result (session-based)
/assessments                // MyAssessmentsPage — saved history (auth required)
/assessments/:id            // AssessmentViewPage — view saved assessment
/assessments/share          // SharePage — share form (no auth)
/assessments/share/:id       // AssessmentViewPage — public shared view (no auth)
/compare?id1=X&id2=Y        // ComparePageWrapper → AssessmentComparisonPage
/solutions                   // SolutionsPage — search solutions
/global-activity             // GlobalActivityPage — global analytics
```

### Session Management

```js
import { useSession } from '@/features/session';

const { restoreEvaluation, saveSession, clearSession } = useSession();
```

- Auto-saves evaluation inputs to localStorage on every change
- Restores previous session results on page reload (shown via `ResultsRestoreDialog`)
- Clears session on user request or after successful save

### Metadata Helpers

```js
import { getIndustry } from '@/lib/metadata';

// Prefers structured top-level columns over JSONB fallback:
const industry = getIndustry(assessment.result_json);
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
| `components/charts/LineChart.test.jsx`                           | —     | LineChart rendering                                                                                                                            |
| `components/charts/PieChart.test.jsx`                            | —     | PieChart rendering + snapshots                                                                                                                 |
| `components/dialogs/ResultsRestoreDialog.test.jsx`               | —     | Dialog component                                                                                                                               |
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

```js
import { renderHook } from '@testing-library/react';
import { useDebounce } from '@/hooks';

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
#    VITE_APP_URL=https://your-app.vercel.app
#    INTERNAL_BACKEND_API_KEY=your-secret-backend-key  # server-only, never VITE_ prefixed

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

```js
import { useAssessment } from '@/features/assessments/hooks';

const { assessment, isLoading, error } = useAssessment(id);
```

Configure stale times for different data freshness requirements:

```js
useQuery({
  queryKey: ['global-stats'],
  queryFn: getGlobalStats,
  staleTime: 5 * 60 * 1000, // 5 minutes — dashboard data doesn't need to be real-time
  gcTime: 30 * 60 * 1000, // 30 minutes in cache
});
```

### Custom Hooks for Logic Extraction

Complex logic lives in custom hooks, not components:

```js
export function useExportState() {
  const [isExporting, setIsExporting] = useState(false);
  // All export logic...
  return { isExporting, executeExport };
}
```

### Constants Over Magic Values

```js
// ✓ Good
import { validKeys, parameterGuidance } from '@/constants/evaluationData';
if (validKeys.includes(parameterKey)) { ... }

// ✗ Avoid
if (score >= 75) { ... }
```

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

```js
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

? **Correct:**

- `INTERNAL_BACKEND_API_KEY` lives only in Vercel server-side environment variables
- Production API routing uses `frontend/vercel.json` rewrite to route `/api/*` to backend
- Frontend code and browser DevTools never have access to the secret

? **Never:**

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
- Production API routing is controlled by `frontend/vercel.json` rewrite rules
- Supabase handles auth tokens via secure HTTP-only cookies

## Troubleshooting

### "API calls failing with 401 Unauthorized"

- Verify `INTERNAL_BACKEND_API_KEY` is set in Vercel environment (not `VITE_` prefixed)
- If using the legacy proxy helper, check `frontend/api/proxy.js` and backend `apiKeyGuard` configuration
- Confirm backend `apiKeyGuard` middleware is active

### "CORS errors in browser console"

- Backend `ALLOWED_ORIGINS` must include your Vercel domain (`*.vercel.app`)
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

### "Pie chart renders as a solid circle with '— 1'"

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
refactor: extract SolutionsSearch into DashboardPage/components
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

```txt
/                           → LandingPage          (assessment input)
/auth                       → AuthPage             (login/signup)
/guide                      → GuidePage            (help & methodology)
/results                    → ResultsPage          (session-based scoring results)
/solutions                  → SolutionsPage        (case study search — keyword + hybrid)
/global-activity            → GlobalActivityPage   (global analytics)
/assessments                → MyAssessmentsPage    (saved assessment history)
/assessments/share          → SharePage            (share form, no auth)
/assessments/share/:id      → AssessmentViewPage   (public shared view, no auth)
/assessments/compare        → ComparePageWrapper   (comparison form & results)
/assessments/:publicId      → ResultsPage          (view saved assessment, auth required)
/uptime-monitor             → UptimeMonitorPage    (system uptime monitoring)
*                           → NotFoundPage
```

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

```js
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

```js
import {
  exportAssessmentCSV,
  exportAssessmentPDF,
  exportComparisonCSV,
  exportComparisonPDF,
} from '@/features/export';

await exportAssessmentCSV(assessment); // triggers download
await exportAssessmentPDF(assessment); // triggers download
await exportComparisonCSV([assessment1, assessment2]); // triggers download
await exportComparisonPDF([assessment1, assessment2]); // triggers download
```

### 6. Metadata & Structured Data

The `documents` table has `industry` as a first-class indexed column. Use the helper that prefers structured columns over JSONB fallback:

```js
import { getIndustry } from '@/lib/metadata';

const industry = getIndustry(assessment.result_json);
// Priority: result_json.metadata.industry → result_json.industry → column value
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

```js
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

```js
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

```js
// ✓ Good — centralised, named constants; no magic values
import { parameterGuidance, validKeys } from '@/constants/evaluationData';

const guidance = parameterGuidance[parameterKey];
const isValidParameter = validKeys.includes(parameterKey);
```

## Components Reference

### Available Components

- **Common**: Button, Brand, Switch, DetailsDisplay, LoaderComponent, LoaderIcon, etc.
- **Charts**: BarChart, LineChart, PieChart, RadarChart
- **Dialogs**: SaveAssessmentDialog, DeleteAssessmentDialog, RenameAssessmentDialog, ResultsRestoreDialog, ConfirmDialog, LimitReachedDialog, ReplaceInputsDialog
- **Drawers**: ResultsDatabaseEvidenceDetailsDrawer, AssessmentMethodologyDrawer, info drawers for evaluation parameters and sample test cases
- **Layout**: Navbar, Footer, AppContainer
- **Auth**: LoginForm, SignupForm
- **Export**: ExportActions
- **Error Boundaries**: GlobalErrorBoundary, PageErrorBoundary

### Dialog System

See [src/components/dialogs/README.md](./src/components/dialogs/README.md) for comprehensive documentation on the reusable dialog system, including how to add new dialog types and use the `DialogContext`.

## Frontend Routes

The application uses React Router v7 with lazy-loaded components. All routes are defined in `src/app/AppRoutes.jsx`.

### Public Routes (No Authentication Required)

| Path                     | Description                                      | Query Parameters                                                     |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------- |
| `/`                      | Main landing page with app overview              | None                                                                 |
| `/auth`                  | Login and signup page                            | `mode` (`login`\|`signup`), `from` (redirect URL after login)        |
| `/guide`                 | Comprehensive user guide and documentation       | None                                                                 |
| `/results`               | Assessment results from session/navigation state | None (uses React Router state)                                       |
| `/solutions`             | Search 6,000+ circular economy case studies      | `searchQuery`, `mode`, `page`, `strategies`, `categories`, `sources` |
| `/global-activity`       | Live insights from all assessments worldwide     | None                                                                 |
| `/assessments`           | User's saved assessment list                     | `industry`, `page`, `pageSize`, `search`, `sortBy`                   |
| `/assessments/share`     | Public assessment share gateway form             | None                                                                 |
| `/assessments/share/:id` | Direct shared assessment view                    | `id` path param — assessment public ID (UUID)                        |
| `/assessments/compare`   | Assessment comparison tool or selection form     | `id1`, `id2`                                                         |
| `/uptime-monitor`        | System uptime and health dashboard               | None                                                                 |

### Protected Routes (Authentication Required)

Only one route is protected at the router level:

#### `/assessments/:publicId` — View Saved Assessment

Renders `ResultsPage` with `isViewFromMyAssessments={true}`. Used by authenticated users to view their own saved assessment records.

**Path Parameters:**

- `publicId` — assessment public ID (UUID format)

**Behavior:**

- Unauthenticated users are redirected to `/auth` with `state.from` set for redirect-back after login
- Shows loading spinner during authentication check

### Route Query Parameters

#### `/auth`

- `mode` (string, default: `login`) — `login` or `signup`
- `from` (string) — Redirect path after successful authentication

#### `/solutions`

- `searchQuery` (string) — Search query; minimum 2 chars to trigger fetch
- `mode` (string, default: `hybrid`) — `keyword` or `hybrid`; invalid values fall back to `hybrid`
- `page` (number, default: `1`) — Page number; omitted from URL when 1
- `strategies` (string) — Comma-separated strategy filters; validated against result values
- `categories` (string) — Comma-separated category filters; validated against result values
- `sources` (string) — Comma-separated source filters; validated against result values

#### `/assessments`

- `industry` (string, default: `all`) — Comma-separated industry filters or `all`
- `page` (number, default: `1`) — Pagination page number
- `pageSize` (number, default: `10`) — Items per page: `5|10|20|50|100`; invalid value defaults to `10`
- `search` (string) — Text filter for assessment names
- `sortBy` (string, default: `created_at_desc`) — Sort field and direction (e.g., `title_asc`)

All filter parameters persist in URL for shareable filtered lists.

#### `/assessments/compare`

- `id1` (string) — First assessment public ID (UUID format)
- `id2` (string) — Second assessment public ID (UUID format)
- If both present: renders comparison view; otherwise renders selection form

### Route Behavior Patterns

#### Protected Routes

- Unauthenticated users are redirected to `/auth`
- Shows loading spinner during authentication check

#### URL State Management

- **Solutions**: URL is the single source of truth for all search and filter state — see [URL State Management](#url-state-management-solutionssearch) below
- **Assessments**: All filter parameters persist in URL for shareable filtered lists
- Invalid parameters are validated and cleaned up on mount or after results load

#### Navigation State

- React Router state can pass: `result`, `formData`, `isRestored`
- Legacy `/share/:publicId` redirects to `/assessments/share`

#### Lazy Loading

All page components are lazy-loaded for optimal bundle splitting:

```js
const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage'));
```

---

## URL State Management (SolutionsSearch)

`SolutionsSearch` uses URL as the single source of truth — no `useState` for any search-derived value. All state is derived from `searchParams` via `useMemo` on every render:

```js
const searchState = useMemo(() => {
  const query = searchParams.get('searchQuery') || '';
  const mode = ['keyword', 'hybrid'].includes(searchParams.get('mode'))
    ? searchParams.get('mode')
    : 'hybrid';
  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  return {
    query,
    mode,
    page,
    activeStrategies: parseMultiParam(searchParams.get('strategies')),
    activeCategories: parseMultiParam(searchParams.get('categories')),
    activeSources: parseMultiParam(searchParams.get('sources')),
  };
}, [searchParams]);
```

URL params and their defaults:

| Param         | Default  | Notes                                                                       |
| ------------- | -------- | --------------------------------------------------------------------------- |
| `searchQuery` | (none)   | Absence = empty search; all filter/page params stripped if absent           |
| `mode`        | `hybrid` | `keyword` or `hybrid`; invalid values corrected to `hybrid` on mount        |
| `page`        | `1`      | Omitted from URL when page is 1; clamped to valid range after results load  |
| `strategies`  | (none)   | Comma-separated; each value validated against current result set after load |
| `categories`  | (none)   | Comma-separated; validated against current result set after load            |
| `sources`     | (none)   | Comma-separated; validated against current result set after load            |

**Three cleanup/validation effects:**

1. **Mount (runs once, atomic)** — corrects an invalid `mode` value to `hybrid` AND strips stale `page`/`strategies`/`categories`/`sources` params when no `searchQuery` is present. Both corrections are applied in a single `setSearchParams` call to prevent race conditions.

2. **Page clamp** — after results load, if the current `page` exceeds `totalPages`, resets `page` to 1 (by omitting the param).

3. **Filter validation** — after results load, drops any `strategies`, `categories`, or `sources` values that are not present in the current result set. Uses functional `setSearchParams` to always read the latest params, avoiding stale-closure drops.

**Query change behaviour:**

- When the query value changes, `page` and all filters are reset (derived from the previous result set, now stale).
- When the query is cleared, all search params except `mode` are removed.

**Other details:**

- Fetch debounced 250ms; requires minimum 2 non-whitespace chars (`shouldSearch`)
- Stale-time: 10 min (keyword) / 5 min (hybrid); `gcTime`: 30 min
- `placeholderData: keepPreviousData` prevents flicker between queries
- Background-fetch spinner shown when `isFetching && !isLoading`
- Stale-data refresh button shown when `isStale && !isFetching`
- Prefetches hybrid results on hover over the mode toggle when in keyword mode
- Page size is 5 items per page (hardcoded `ITEMS_PER_PAGE`, not a URL param)

---

## Performance Optimisation

### Code Splitting

Routes are lazy-loaded automatically by React Router:

```js
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

```js
// Global dashboard stats — stale after 2 minutes, refetch on mount if stale
useQuery({
  queryKey: ['global-stats'],
  queryFn: getGlobalStats,
  staleTime: 2 * 60 * 1000, // 2 min
  gcTime: 30 * 60 * 1000, // 30 min — keep in memory after unmount
  refetchOnMount: 'stale', // refetch on mount only when stale (not always)
  refetchOnWindowFocus: false,
});

// CE cases search — keyword 10 min stale, hybrid 5 min stale; keepPreviousData while typing
useQuery({
  queryKey: ['ce-cases-search', debouncedQuery, mode],
  queryFn: () => searchCeCases({ q: debouncedQuery, mode }),
  staleTime: mode === 'keyword' ? 10 * 60 * 1000 : 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  placeholderData: keepPreviousData, // avoids flicker between queries
});

// User assessments — always fetch fresh (refetchOnMount: 'always')
useQuery({
  queryKey: ['assessments', { ...params }],
  queryFn: getAssessments,
  staleTime: 30 * 1000, // 30 seconds
  refetchOnMount: 'always',
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

## License & Support

**Authors:** Areeb Ahmed Zahoori & Mahit Singh  
**LICENSE:** MIT  
**Last Updated:** 29 June 2026
