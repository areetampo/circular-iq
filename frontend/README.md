# Frontend: Circular Economy Assessment UI

React + Vite application for assessing circular economy business initiatives with interactive scoring, visualization, and export functionality.

## Overview

The frontend provides:

1. **Assessment Flow** - Guided questionnaires across 8 dimensions
2. **Results Display** - Interactive charts, tables, and comparisons
3. **Export Functionality** - PDF reports and CSV data exports
4. **Market Analysis** - Benchmark against similar projects
5. **Session Management** - Automatic persistence and sharing
6. **Anonymous Usage** - 5 free assessments with tracking

## Tech Stack

| Technology                | Purpose                   |
| ------------------------- | ------------------------- |
| **React 19**              | UI framework              |
| **Vite 7**                | Build tool and dev server |
| **TypeScript**            | Type safety (optional)    |
| **TypeScript/JavaScript** | Source language           |
| **Tailwind CSS v4**       | Utility-first styling     |
| **HeroUI v3**             | Pre-built components      |
| **MUI X Charts**          | Data visualization        |
| **React Router v7**       | Client-side routing       |
| **React Query**           | Server state management   |
| **Supabase**              | Authentication            |
| **Vitest**                | Unit testing              |
| **React Testing Library** | Component testing         |

## Directory Structure

```
frontend/
├── src/
│   ├── app/                          # Root configuration
│   │   ├── App.jsx                   # Main component with routing
│   │   ├── AppRoutes.jsx             # Route definitions
│   │   └── AppProvider.jsx           # Global context setup
│   │
│   ├── pages/                        # Page-level components
│   │   ├── AssessmentPage/           # Questionnaire flow
│   │   ├── ResultsPage/              # Results & visualization
│   │   ├── DashboardPage/            # Analytics dashboard
│   │   ├── MarketAnalysisPage/       # Benchmarking
│   │   ├── MyAssessmentsPage/        # Assessment history
│   │   ├── SharePage/                # Public shared results
│   │   ├── LandingPage/              # Marketing homepage
│   │   └── AuthPage/                 # Login/signup
│   │
│   ├── features/                     # Feature-specific logic
│   │   ├── assessments/              # Assessment CRUD
│   │   │   ├── api/assessmentApi.js  # React Query hooks
│   │   │   ├── hooks/                # Assessment-specific hooks
│   │   │   ├── components/           # Assessment components
│   │   │   └── utils/                # Assessment utilities
│   │   │
│   │   ├── export/                   # PDF/CSV export
│   │   │   ├── components/           # Export UI (export dashboard, comparison)
│   │   │   └── utils/                # Export generation logic
│   │   │
│   │   └── session/                  # Session management
│   │       ├── hooks/useSession.js   # Session state hook
│   │       └── utils/                # Session helpers
│   │
│   ├── components/                   # Reusable components
│   │   ├── ui/                       # Base UI (Button, Select, etc.)
│   │   ├── charts/                   # Chart components (Radar, Bar, Scatter)
│   │   ├── common/                   # Shared components (Loader, ErrorDisplay)
│   │   ├── dialogs/                  # Modal dialogs (Confirmation, Save, etc.)
│   │   ├── drawers/                  # Side panel drawers
│   │   ├── layout/                   # Layout components (Header, Footer)
│   │   ├── auth/                     # Auth components (LoginForm, SignupForm)
│   │   ├── filters/                  # Search/filter components
│   │   ├── export/                   # Export UI components
│   │   └── error-boundaries/         # Error handling
│   │
│   ├── contexts/                     # React contexts
│   │   ├── AuthContext.jsx           # Supabase authentication state
│   │   ├── DialogContext.jsx         # Global dialog state
│   │   ├── ModalContext.jsx          # Global modal state
│   │   └── DrawerContext.jsx         # Global drawer state
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.js                # Auth hook wrapper
│   │   ├── useDialog.js              # Dialog state consumer
│   │   ├── useModal.js               # Modal state consumer
│   │   ├── useDrawer.js              # Drawer state consumer
│   │   ├── useToast.js               # Toast notifications
│   │   ├── useDebounce.js            # Debounce helper
│   │   └── useExportState.js         # Export progress state
│   │
│   ├── lib/                          # Utility libraries
│   │   ├── apiClient.js              # buildApiUrl() & fetch wrapper
│   │   ├── supabase.js               # Supabase client init
│   │   ├── metadata.js               # getIndustry(), getCategory() helpers
│   │   ├── formatting.js             # titleize(), formatTimestamp(), etc.
│   │   ├── validation.js             # Input validation utilities
│   │   ├── scoring.js                # Score formatting and calculation
│   │   ├── storage.js                # localStorage wrapper
│   │   └── exportDashboard.js        # Export PDF/CSV logic
│   │
│   ├── config/                       # Configuration
│   │   ├── env.schema.js             # Zod environment schema
│   │   ├── frontend.config.js        # App configuration object
│   │   └── index.js                  # Config exports
│   │
│   ├── constants/                    # Application constants
│   │   ├── evaluationData.js         # Scoring parameters
│   │   ├── industries.js             # Industry list
│   │   ├── industryThemes.js         # Industry UI themes
│   │   ├── groupStyleConfig.js       # UI styling config
│   │   └── siteMetadata.js           # SEO metadata
│   │
│   ├── utils/                        # Helper utilities
│   │   ├── content.js                # Content extraction
│   │   ├── session.js                # Session helpers
│   │   ├── async.js                  # Async utilities
│   │   ├── ui.js                     # UI utilities
│   │   ├── cn.ts                     # className merge
│   │   └── cx.ts                     # Conditional classes
│   │
│   ├── test/                         # Test utilities
│   │   └── test-utils.jsx            # Testing helpers
│   │
│   ├── index.css                     # Global styles
│   ├── main.jsx                      # React entry point
│   └── setupTests.js                 # Vitest configuration
│
├── api/
│   └── proxy.js                      # Vercel serverless proxy (injects x-api-key)
│
├── public/
│   └── robots.txt                    # SEO
│
├── package.json                      # Dependencies & scripts
├── vite.config.js                    # Vite configuration
├── vitest.config.js                  # Vitest configuration
├── vercel.json                       # Vercel deployment config
├── tsconfig.json                     # TypeScript config (if used)
├── eslint.config.js                  # ESLint rules
├── index.html                        # HTML entry point
└── README.md                          # This file
```

## Setup & Installation

### Prerequisites

- Node.js 18+
- npm 8+
- Backend server running
- Supabase account

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.frontend

# 3. Configure environment variables
# Edit .env.frontend with your Supabase and API URL

# 4. Start development server
npm run dev
```

## Environment Configuration

Create `.env.frontend` with:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001

# Supabase (must match backend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyxxxxxxxxxxxxx

# Feature flags
VITE_ALLOW_ANONYMOUS=true
```

## Development

### Scripts

```bash
# Development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Watch mode testing
npm run test:watch

# Lint code
npm run lint
```

### Code Style

- ESLint configuration in `eslint.config.js`
- Prettier formatting automatically on save
- Follow existing patterns (components, hooks, utilities)

## Architecture

### State Management

**Global state** (via contexts):

- `AuthContext` - Supabase user authentication
- `DialogContext` - Global confirmation dialogs
- `ModalContext` - Global modals
- `DrawerContext` - Global side drawers

**Local state** (via hooks):

- React hooks for component-level state
- Custom hooks for feature-specific logic
- React Query for server state

### Page Flow

1. **Landing Page** → Marketing, call-to-action
2. **Auth Page** → Login/signup
3. **Dashboard Page** → Start assessment or view past results
4. **Assessment Page** → Guided questionnaire (8 dimensions)
5. **Results Page** → Visualization with recommendations
6. **Market Analysis Page** → Benchmark against similar projects
7. **Export Page** → Download PDF or CSV

### Component Patterns

**HeroUI Components**:

```jsx
import { Button, Card, Modal } from '@heroui/react';

<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>;
```

**Custom Hooks**:

```jsx
const { isOpen, onOpen, onClose } = useDisclosure();
const { showToast } = useToast();
const { user } = useAuth();
```

**Context Usage**:

```jsx
const { open: openDialog } = useDialog();
openDialog({
  title: 'Delete Assessment?',
  onConfirm: handleDelete,
});
```

## API Integration

### buildApiUrl Helper

All API calls use `buildApiUrl()` to construct URLs:

```javascript
import { buildApiUrl } from '@/lib/apiClient';

const url = buildApiUrl('/scoring/score-problem-solutions');
// → http://localhost:3001/api/scoring/score-problem-solutions

// With query params
const url = buildApiUrl('/analytics/documents-summary', {
  industry: 'textiles',
  scale: 'medium',
});
// → http://localhost:3001/api/analytics/documents-summary?industry=textiles&scale=medium
```

### Fetch Wrapper

```javascript
import { apiClient } from '@/lib/apiClient';

const response = await apiClient('POST', '/scoring/score', {
  businessProblem: 'Plastic waste reduction',
});
```

### React Query

```javascript
import { useAssessmentQuery } from '@/features/assessments/api/assessmentApi';

const { data, isLoading, error } = useAssessmentQuery(assessmentId);
```

## Styling

### Tailwind CSS v4

Utility-first CSS framework. Use Tailwind classes directly:

```jsx
<div className="flex items-center justify-between p-4 bg-slate-100 rounded-lg">
  <h2 className="text-2xl font-bold text-slate-900">Title</h2>
  <Button className="bg-blue-600 hover:bg-blue-700">Action</Button>
</div>
```

### HeroUI Theming

HeroUI v3 components use Tailwind CSS and support dark mode via `next-themes`:

```jsx
// In AppProvider.jsx
<ThemeProvider attribute="class" defaultTheme="light">
  <App />
</ThemeProvider>;

// In components
import { useTheme } from 'next-themes';
const { theme, setTheme } = useTheme();
```

### Custom Styling

Add global styles to `index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component styles */
.assessment-card {
  @apply flex flex-col rounded-lg border border-slate-200 p-4;
}
```

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Structure

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders button with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## Components

### Available Components

- **UI**: Button, Select, Input, Checkbox, Radio, Switch, Modal, Dialog
- **Charts**: Radar, Bar, Scatter, Line, Pie, Combo
- **Common**: Loader, ErrorDisplay, LoadingBar, Brand, Card
- **Layout**: Header, Footer, Sidebar, Drawer
- **Forms**: Input, Select, Checkbox, RadioGroup, DatePicker

### Dialog System

See [dialogs/README.md](./src/components/dialogs/README.md) for comprehensive documentation on the reusable dialog system.

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Auto-deploy on push to main branch

### Manual Deployment

```bash
# Build production bundle
npm run build

# Deploy output to hosting provider
# (Netlify, AWS, GCP, Azure, etc.)
```

### Environment Variables (Production)

```env
VITE_API_URL=https://your-api-domain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### API Calls Failing

- Verify `VITE_API_URL` in `.env.frontend`
- Check backend server is running
- Validate CORS configuration in backend

### Build Errors

```bash
# Clear caches and reinstall
npm run clean
npm install
npm run build
```

### HeroUI Component Issues

- Ensure HeroUI v3 is installed (not v2)
- Check Tailwind CSS v4 is configured
- Verify Next-UI provider is in AppProvider.jsx

## See Also

- [Root README](../../README.md) - Full-stack overview
- [Backend README](../../backend/README.md) - API reference
- [Dialogs README](./src/components/dialogs/README.md) - Dialog system documentation

# Backend API URL - points to your Express backend

VITE_API_URL=http://localhost:3001

# or for production:

# VITE_API_URL=https://api.example.com

# Supabase configuration

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Frontend URL (for sharing)

VITE_FRONTEND_URL=http://localhost:5173

# or for production:

# VITE_FRONTEND_URL=https://app.example.com

# Optional: Feature flags & settings

VITE_LOG_LEVEL=debug
VITE_ENABLE_ANALYTICS=true

````

#### Important Notes

1. **No Secret Keys in Frontend**: The `INTERNAL_BACKEND_API_KEY` is **never** included in frontend code.
2. **Proxy Pattern**: All API calls route through `/api/proxy` in production, which injects the secret key server-side via Vercel serverless function.
3. **Anonymous Access**: Frontend works without authentication; API enforces rate limits per IP.

### Configuration Object

Access configuration via `FRONTEND_CONFIG` in code:

```javascript
import { FRONTEND_CONFIG } from '@/config';

console.log(FRONTEND_CONFIG.apiBaseUrl); // Backend URL
console.log(FRONTEND_CONFIG.supabaseUrl); // Supabase URL
console.log(FRONTEND_CONFIG.supabaseAnonKey); // Anon key
console.log(FRONTEND_CONFIG.frontendUrl); // Frontend URL
````

---

## API Integration

### Secure Proxy Architecture

To keep the backend API key secret, all frontend → backend requests flow through a **Vercel serverless proxy**:

```
Browser → /api/proxy?path=/api/score → Vercel Function → Add x-api-key → Backend
```

#### How It Works

1. **buildApiUrl()** – Returns `/api/proxy?path=...` in production, direct URL in development
2. **Proxy Function** (`api/proxy.js`) – Vercel serverless that:
   - Reads `INTERNAL_BACKEND_API_KEY` from environment
   - Forwards request headers (Authorization, User-Agent, IP)
   - Adds `x-api-key` header with the secret key
   - Returns backend response to client
3. **Backend (/app.js)** – Trusts `x-api-key` for service-level access

### API Client Helper

Use `buildApiUrl()` for all backend calls:

```javascript
import { buildApiUrl, apiFetch } from '@/lib/apiClient';

// Automatic proxy routing in production
const url = buildApiUrl('/api/score');

// Make request with automatic headers
const response = await apiFetch(url, {
  method: 'POST',
  body: JSON.stringify({ businessProblem, businessSolution, parameters }),
});
```

### Authentication

#### User Authentication (Optional)

Users can log in with Supabase:

```javascript
import { useAuth } from '@/hooks/useAuth';

const { user, isLoading, error, login, logout } = useAuth();

if (user) {
  // Pass Authorization Bearer token for user-specific requests
  const response = await fetchWithAuth('/api/assessments');
}
```

#### Anonymous Access

Requests without `Authorization` header are treated as anonymous:

- Rate-limited to 5 free tries per IP (configurable)
- Cached anonymously by backend

### Core API Endpoints

| Method | Endpoint                               | Purpose                | Auth                                           |
| ------ | -------------------------------------- | ---------------------- | ---------------------------------------------- |
| POST   | `/api/score`                           | Score an assessment    | Optional (anonymous: 5 tries, user: unlimited) |
| GET    | `/api/assessments`                     | List user assessments  | Required                                       |
| POST   | `/api/assessments`                     | Save assessment        | Required                                       |
| GET    | `/api/assessments/:id`                 | Get assessment details | Required                                       |
| PUT    | `/api/assessments/:id`                 | Update assessment      | Required                                       |
| DELETE | `/api/assessments/:id`                 | Delete assessment      | Required                                       |
| GET    | `/api/assessments/public/:publicId`    | Get shared assessment  | None                                           |
| GET    | `/api/assessments/:id/market-analysis` | Market benchmarks      | Optional                                       |

---

## Key Features

### 1. Evaluation Engine

#### Multi-Dimensional Scoring

- 8 key parameters across circular economy dimensions
- Evidence-based scoring with AI reasoning
- Confidence scoring & integrity gap analysis

#### Assessment Enrichment Layers

The evaluation engine now supports three enrichment layers:

#### Layer 1 - Business Context (Optional)

- Business Model Type: Classify circular strategy (PaaS, take-back, remanufacturing, recycling, etc.)
- Operational Stage: Maturity level (idea → mature operation)
- Target Geography: Market scope (local → global)
- Annual Volume: Material processing volume
- Material Complexity: Type of materials handled
- Supply Chain Partnerships: Existing collection/distribution relationships

These optional context fields improve AI reasoning and enable stage-appropriate scoring.

**Files**: `src/pages/LandingPage/components/BusinessContextContainer.jsx`

#### Layer 2 - Deterministic Outputs

- Weighted Score Card: Per-factor contribution breakdown with classifications
- Circular Economy Tier: Tier classification (Leader/Established/Developing/Emerging)
- Parameter Consistency: Score coherence analysis detecting unrealistic inputs
- R-Strategy Alignment: Validation that scores match the detected circular strategy

These are computed deterministically with no LLM involvement.

#### Layer 3 - Extended LLM Output

- Improvement Roadmap: Prioritized action plan (3 items) with effort/impact estimates
- SDG Alignment: UN Sustainable Development Goals (2-4 most relevant)
- Market Opportunity Summary: Realistic market assessment grounded in database evidence

Enhanced LLM analysis providing actionable recommendations.

**Files**:

- `src/constants/evaluationData.js` – Parameter definitions
- `src/lib/scoring.js` – Score formatting & calculations
- `src/features/assessments/api/assessmentApi.js` – API calls
- `src/pages/ResultsPage/ResultsPage.jsx` – Results display with all enrichment fields

### 2. Smart Navigation & Routing

**Key Routes**:

```javascript
/                           // Home / landing page
/dashboard                  // Main evaluation dashboard
/results                    // Results for newly evaluated idea (session-based)
/results/market-analysis    // Market analysis for session result
/assessments                // History of saved assessments
/assessments/:id            // View saved assessment
/assessments/:id/market-analysis // Market analysis for saved assessment
/compare?id1=X&id2=Y        // Compare two assessments
/share/:publicId            // Public shared assessment view
/guide                      // Help & documentation
/auth                       // Login/signup
```

**Related Files**:

- `src/app/AppRoutes.jsx` – Route definitions
- `src/pages/` – Page components
- `src/contexts/` – Navigation state (dialogs, drawers)

### 3. Session Management

**Features**:

- Auto-save evaluation inputs to localStorage
- Restore previous session on page reload
- Preserve results across navigation
- Clear session on user request

**Related Files**:

- `src/features/session/hooks/useSession.js` – Session hook
- `src/utils/session.js` – Session utilities
- `src/lib/storage.js` – localStorage wrapper

```javascript
const { restoreEvaluation, saveSession, clearSession } = useSession();
```

### 4. Data Visualization

**Chart Types**:

- **Radar Chart** – Show multi-dimensional scores vs. market average
- **Scatter Plot** – Industry distribution vs. score
- **Line Chart** – Score trends over time
- **Bar Chart** – Factor comparisons

**Related Files**:

- `src/components/charts/` – Chart components
- Powered by **Recharts** library

### 5. Export Capabilities

**Formats**:

- **CSV**: Raw data with all metrics (easily importable)
- **PDF**: Formatted report for stakeholders

**Related Files**:

- `src/features/export/exportDashboard.js`
- `src/features/export/exportComparison.js`
- Uses Blob API for client-side generation

```javascript
export async function exportAssessmentCSV(assessment) {
  // Generates CSV and triggers download
}
```

### 6. Metadata & Structured Data

**Structured Fields** (new):

- `industry` – Top-level industry field (indexed)
- `category` – Top-level category field (indexed)
- `metadata` – Fallback for additional data (JSONB)

**Helper Functions**:

- `getIndustry(obj)` – Extract industry preferring structured field
- `getCategory(obj)` – Extract category preferring structured field

**Related Files**:

- `src/lib/metadata.js` – Helper implementations
- Used in: `ResultsPage`, `MarketAnalysisPage`, `AssessmentComparisonPage`

```javascript
import { getIndustry, getCategory } from '@/lib/metadata';

const industry = getIndustry(assessment.result_json);
```

---

## Development Guide

### Running the Dev Server

```pwsh
npm run dev
```

- Vite server starts at `http://localhost:5173`
- Hot Module Replacement (HMR) enabled
- API calls route to `VITE_API_URL` (default: `http://localhost:3001`)

### Building for Production

```pwsh
npm run build
```

- Optimized build output to `dist/`
- Code splitting & tree-shaking applied
- Source maps generated (configurable)

### Preview Production Build

```pwsh
npm run preview
```

- Serves `dist/` locally
- Use to test production behavior before deployment

### Code Organization Best Practices

#### Components

```jsx
// ✓ Good: Self-contained, focused component
export default function ResultsPage() {
  const { id } = useParams();
  const { assessment, isLoading } = useAssessment(id);

  return <div>{/* Component JSX */}</div>;
}
```

#### Hooks

```jsx
// ✓ Good: Custom hook extracts reusable logic
export function useMarketAnalysis({ assessmentId, enabled = true }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['market-analysis', assessmentId],
    queryFn: () => getMarketAnalysis(assessmentId),
    enabled,
  });

  return { data, isLoading, error };
}
```

#### API Calls

```javascript
// ✓ Good: Use buildApiUrl for automatic proxy routing
import { buildApiUrl } from '@/lib/apiClient';

const url = buildApiUrl('/api/score');

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

#### Constants

```javascript
// ✓ Good: Centralized, immutable constants
export const EVALUATION_PARAMETERS = {
  resource_efficiency: { min: 0, max: 100, label: 'Resource Efficiency' },
  // ...
};
```

---

## Testing

### Running Tests

```pwsh
# Run all tests
npm test

# Run specific test file
npm test src/components/common/Button.test.jsx

# Run assessment utilities tests (including reconstructScoringResult)
npm test src/features/assessments/utils.test.js

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Test Suite Coverage

| Test File                                | Tests | Key Functions                                                                                | Description                                                                          |
| ---------------------------------------- | ----- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/features/assessments/utils.test.js` | 13    | getAverageScore, sortByAverageScoreDesc, sortByAverageScoreAsc, **reconstructScoringResult** | Assessment utility functions and scoring result reconstruction from database columns |

**reconstructScoringResult Tests (10 tests):**

- Null/undefined input handling
- Direct result_json passthrough
- Fallback reconstruction from individual columns
- Metadata precedence (columns > result_json)
- Enrichment fields mapping (weighted_score_card, circular_economy_tier, parameter_consistency, r_strategy_alignment)
- Context and processing_info reconstruction

### Writing Tests

**Example: Component Test**

```jsx
import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '@/components/common/Button';

test('Button renders with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

**Example: Hook Test**

```javascript
import { test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

test('debounces value', async () => {
  const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
    initialProps: { value: 'initial' },
  });

  rerender({ value: 'updated' });
  // Assert debounce behavior
});
```

### Test Configuration

- **Config**: `vitest.config.js`
- **Setup**: `src/setupTests.js`
- **Utilities**: `src/test/test-utils.jsx`

---

## Building & Deployment

### Deploy to Vercel

Vercel is the recommended hosting platform (serverless functions + static hosting).

#### Prerequisites

1. Vercel account ([vercel.com](https://vercel.com))
2. GitHub repo with code
3. Environment variables configured

#### Deployment Steps

```pwsh
# 1. Push code to GitHub
git push origin main

# 2. Import project to Vercel
# Visit https://vercel.com/new and select GitHub repo

# 3. Configure environment variables
# In Vercel dashboard → Settings → Environment Variables:
# VITE_API_URL=https://api.example.com
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_FRONTEND_URL=https://your-app.vercel.app
# INTERNAL_BACKEND_API_KEY=your-secret-backend-key

# 4. Deploy
# Automatic on every git push, or manual trigger in dashboard
```

#### Vercel Configuration

The `vercel.json` file configures:

```json
{
  "functions": {
    "api/**/*.js": { "runtime": "nodejs20.x" }
  },
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Key Points**:

- `/api/*` routes → serverless functions (NOT SPA rewrite)
- Other routes → `index.html` (SPA routing)

#### Proxy Function Deployment

The `api/proxy.js` file deploys as a serverless function:

```javascript
// api/proxy.js
export default async function handler(req, res) {
  const { path } = req.query;
  const backendKey = process.env.INTERNAL_BACKEND_API_KEY;

  // Forward request with secret key injected
  const response = await fetch(`${process.env.VITE_API_URL}${path}`, {
    method: req.method,
    headers: {
      ...req.headers,
      'x-api-key': backendKey,
    },
    body: req.body,
  });

  return response;
}
```

### Deployment Checklist

- [ ] All environment variables configured in Vercel
- [ ] `INTERNAL_BACKEND_API_KEY` set securely (not in git)
- [ ] Backend CORS allows Vercel domains (`.vercel.app`, `.vercel.sh`)
- [ ] `vercel.json` correctly configured
- [ ] Build completes without errors: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Preview environment tested
- [ ] DNS configured for custom domain (if applicable)

---

## Architecture Patterns

### Context API for Global State

State that needs to be accessed across many components uses React Context:

```javascript
import { useAuth } from '@/hooks/useAuth';
import { useDialog } from '@/hooks/useDialog';
import { useDrawer } from '@/hooks/useDrawer';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
```

### React Query for Server State

Asynchronous data from the backend uses TanStack React Query:

```javascript
import { useAssessment } from '@/features/assessments';

const { assessment, isLoading, error } = useAssessment(id);
```

Benefits:

- Automatic caching & background refetching
- Optimistic updates
- Pagination & infinite queries
- Error boundary integration

### Custom Hooks for Logic Extraction

Complex logic lives in custom hooks:

```javascript
export function useExportState() {
  const [isExporting, setIsExporting] = useState(false);
  // Complex export logic...
  return { isExporting, executeExport };
}
```

### Constants & Configuration

Avoid magic strings/numbers:

```javascript
// ✓ Good
import { EVALUATION_PARAMETERS } from '@/constants/evaluationData';

// ✕ Avoid
if (score > 75) {
  /* ... */
}
```

---

## Troubleshooting

### Common Issues

#### "API calls failing with 401 Unauthorized"

**Cause**: Proxy not injecting API key

**Solution**:

1. Verify `INTERNAL_BACKEND_API_KEY` is set in Vercel
2. Check `api/proxy.js` forwards `x-api-key` header
3. Confirm backend `apiKeyGuard` is enabled

#### "CORS errors in browser console"

**Cause**: Backend doesn't allow Vercel origin

**Solution**:

1. Backend `app.js` should have wildcard check for `*.vercel.app`
2. Verify route is not protected (use PUBLIC_ROUTES)
3. Check `ALLOWED_ORIGINS` env variable

#### "Session not restoring after reload"

**Cause**: localStorage disabled or cleared

**Solution**:

1. Check browser localStorage is enabled
2. Verify `useSession()` is wrapped in `<AppProvider>`
3. Check browser console for storage quota errors

#### "Charts not rendering"

**Cause**: Data format mismatch

**Solution**:

1. Verify data structure matches Recharts expectations
2. Check console for chart component errors
3. See [Recharts docs](https://recharts.org)

#### "Build fails: 'VITE\_' env variables undefined"

**Cause**: Environment variables not prefixed with `VITE_`

**Solution**:

1. Prefix all client-side vars with `VITE_`
2. Only `VITE_*` variables are exposed to client
3. Restart dev server after changing `.env.frontend`

#### "TypeScript errors (if using TS)"

**Cause**: Missing type definitions

**Solution**:

1. Install `@types/react` & related packages
2. Configure `tsconfig.json` compiler options
3. Run `npm install -- --legacy-peer-deps` if conflicts

---

## Performance Optimization

### Code Splitting

Routes are lazy-loaded automatically:

```javascript
const ResultsPage = lazy(() => import('@/pages/ResultsPage'));
```

### Image Optimization

Use `<img>` with srcset or consider next-gen formats:

```jsx
<img src="/image.webp" alt="Description" loading="lazy" />
```

### Bundle Analysis

Check bundle size:

```pwsh
npm run build -- --analyze
# or use Vercel Analytics dashboard
```

### Caching Strategy

React Query caches API responses automatically. Configure stale times:

```javascript
useQuery({
  queryKey: ['assessment', id],
  queryFn: () => getAssessment(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## Security Considerations

### API Key Protection

✓ **Good**:

- Secret key in Vercel env variables only
- Proxy function injects key server-side
- Frontend never sees the secret

✕ **Avoid**:

- Storing API keys in `.env.frontend` that gets committed
- Exposing keys in browser DevTools
- Hardcoding secrets in source code

### Data Privacy

- Anonymous requests are rate-limited per IP
- User data fetches require authentication
- Shared assessments use `publicId` (opaque identifier)

### CORS & CSRF

- Backend validates `Origin` header
- Proxy function adds required headers
- Credentials sent in secure HTTP-only cookies (via Supabase)

---

## Contributing

### Code Style

- **Formatting**: ESLint + Prettier (configured)
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Components**: Functional components with hooks

### Commit Messages

```
feat: add metadata helper for industry field
fix: resolve CORS issue with Vercel domains
docs: update README with proxy architecture
test: add unit tests for useSession hook
```

### Pull Request Process

1. Fork repo & create feature branch
2. Implement changes with tests
3. Run `npm test` & `npm run build`
4. Submit PR with description of changes
5. Address review feedback
6. Merge when approved

---

## Additional Resources

### Documentation

- [Vite Docs](https://vitejs.dev)
- [React Docs](https://react.dev)
- [React Router Docs](https://reactrouter.com)
- [HeroUI Component Docs](https://v3.heroui.com)
- [Recharts Docs](https://recharts.org)
- [Tailwind CSS Docs](https://tailwindcss.com)

### Related Projects

- **Backend**: `../backend/` – Express API server
- **Database**: Supabase PostgreSQL with pgvector

---

## Support & Issues

For issues or questions:

1. Check existing issues in GitHub
2. Review this README & related docs
3. Check browser DevTools console for errors
4. Contact the development team

---

## License

UNLICENSED (Internal use only)

---

**Last Updated**: March 1, 2026
**Frontend Version**: React 18+ / Vite / HeroUI v3 Beta
