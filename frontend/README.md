# Circular Economy Assessment Tool - Frontend

> A React + Vite application for evaluating circular economy initiatives against real-world benchmarks using AI-powered semantic search and reasoning.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [API Integration](#api-integration)
- [Key Features](#key-features)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Building & Deployment](#building--deployment)
- [Architecture Patterns](#architecture-patterns)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Circular Economy Assessment Tool frontend enables users to:

1. **Evaluate** their circular economy initiatives by answering guided questions
2. **Receive Scores** across 8 dimensions with AI-powered evidence and recommendations
3. **Compare** their initiative to similar projects and market benchmarks
4. **Export Reports** in CSV or PDF format
5. **Track History** of past assessments and improvements over time
6. **Share Results** publicly via generated share links

### Key Characteristics

- **Frontend Environment**: No sensitive API keys stored in client bundles
- **Secure API Integration**: Uses serverless Vercel proxy to inject secrets server-side
- **Session Management**: Automatic session restoration across page reloads
- **Responsive Design**: Mobile-first approach with HeroUI component library
- **Anonymous Usage Tracking**: Free tier with configurable limits (default 5 free tries)

---

## Tech Stack

| Category         | Technology                     | Purpose                                        |
| ---------------- | ------------------------------ | ---------------------------------------------- |
| **Runtime**      | Node.js 18+                    | Modern JavaScript support                      |
| **Framework**    | React 18+                      | UI component library                           |
| **Build Tool**   | Vite                           | Fast dev server & optimized builds             |
| **Router**       | React Router v6+               | Client-side routing                            |
| **Styling**      | Tailwind CSS v4                | Utility-first CSS framework                    |
| **Components**   | HeroUI v3 (Beta)               | Pre-built accessible components                |
| **State**        | React Hooks                    | Local state management                         |
| **Charts**       | Recharts                       | Data visualization (radar, bar, scatter, line) |
| **HTTP**         | Fetch API                      | API communication                              |
| **Query**        | TanStack React Query           | Server state management & caching              |
| **Testing**      | Vitest + React Testing Library | Unit & component tests                         |
| **Build Target** | Vercel Serverless              | Production deployment                          |

---

## Project Structure

```
frontend/
├── api/
│   └── proxy.js                 # Vercel serverless proxy (injects x-api-key)
│
├── public/                      # Static assets
│
├── src/
│   ├── main.jsx                 # Entry point
│   ├── index.css                # Global styles
│   ├── setupTests.js            # Vitest configuration
│   │
│   ├── app/
│   │   ├── App.jsx              # Main component with routing
│   │   ├── AppProvider.jsx      # Global providers (Auth, Query, Toast, etc.)
│   │   └── AppRoutes.jsx        # Route definitions
│   │
│   ├── api/
│   │   └── assessment.js        # Legacy API helpers (uses buildApiUrl)
│   │
│   ├── config/
│   │   ├── env.schema.js        # Zod schema for environment validation
│   │   ├── frontend.config.js   # Centralized config object
│   │   └── index.js             # Config exports
│   │
│   ├── constants/
│   │   ├── evaluationData.js    # Scoring parameters, thresholds
│   │   ├── industries.js        # Industry list & mappings
│   │   ├── industryThemes.js    # Industry-specific styling
│   │   ├── groupStyleConfig.js  # UI group styling config
│   │   └── siteMetadata.js      # SEO & site metadata
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx      # Supabase auth state
│   │   ├── DialogContext.jsx    # Global dialog/modal context
│   │   ├── DrawerContext.jsx    # Global drawer state
│   │   └── ModalContext.jsx     # Global modal state
│   │
│   ├── features/
│   │   ├── assessments/         # Assessment feature module
│   │   │   ├── api/
│   │   │   │   └── assessmentApi.js  # React Query hooks (through proxy)
│   │   │   ├── hooks/
│   │   │   │   ├── useAssessment.js
│   │   │   │   ├── useMarketAnalysis.js
│   │   │   │   └── useAssessmentComparison.js
│   │   │   ├── components/      # Assessment-related components
│   │   │   └── utils/           # Assessment utilities
│   │   │
│   │   ├── export/              # Export feature (CSV/PDF)
│   │   │   ├── exportDashboard.js
│   │   │   ├── exportComparison.js
│   │   │   └── utils/
│   │   │
│   │   └── session/             # Session state management
│   │       ├── hooks/
│   │       │   └── useSession.js
│   │       └── utils/
│   │
│   ├── hooks/
│   │   ├── useAuth.js           # Auth hook wrapper
│   │   ├── useDebounce.js       # Debounce hook
│   │   ├── useDialog.js         # Dialog context consumer
│   │   ├── useDrawer.js         # Drawer context consumer
│   │   ├── useDrawerDirection.ts # RTL support for drawers
│   │   ├── useExportState.js    # Export loading state
│   │   ├── useModal.js          # Modal context consumer
│   │   └── useToast.js          # Toast notification hook
│   │
│   ├── lib/
│   │   ├── apiClient.js         # buildApiUrl() & fetch wrapper
│   │   ├── metadata.js          # getIndustry(), getCategory() helpers
│   │   ├── formatting.js        # titleize(), formatTimestamp(), etc.
│   │   ├── validation.js        # Input validation utilities
│   │   ├── scoring.js           # Score calculation & formatting
│   │   ├── storage.js           # localStorage wrapper
│   │   ├── supabase.js          # Supabase client initialization
│   │   └── exportDashboard.js   # Export utilities
│   │
│   ├── pages/
│   │   ├── AssessmentComparisonPage/    # Compare 2 assessments
│   │   ├── AssessmentViewPage/          # View single assessment details
│   │   ├── AuthPage/                    # Login/signup
│   │   ├── DashboardPage/               # Main dashboard
│   │   ├── GuidePage/                   # Guides & documentation
│   │   ├── LandingPage/                 # Public landing page
│   │   ├── MarketAnalysisPage/          # Market benchmarking
│   │   ├── MyAssessmentsPage/           # Assessment history
│   │   ├── NotFoundPage/                # 404 error page
│   │   ├── ResultsPage/                 # Results display & actions
│   │   └── SharePage/                   # Public shared assessment view
│   │
│   ├── components/
│   │   ├── auth/                # Authentication components
│   │   │   ├── LoginForm.jsx
│   │   │   └── SignupForm.jsx
│   │   │
│   │   ├── charts/              # Chart components
│   │   │   ├── BarChart.jsx
│   │   │   ├── RadarChart.jsx
│   │   │   ├── ScatterChart.jsx
│   │   │   ├── LineChart.jsx
│   │   │   ├── PieChart.jsx
│   │   │   ├── ComboChart.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── common/              # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Switch.jsx
│   │   │   ├── ErrorDisplay.jsx
│   │   │   ├── LoaderComponent.jsx
│   │   │   ├── GlobalLoadingBar.jsx
│   │   │   ├── ChoiceCardSwitch.jsx
│   │   │   ├── ChartWrapper.jsx
│   │   │   ├── ResponsiveSizeWrapper.jsx
│   │   │   ├── Brand.jsx
│   │   │   ├── CloseButtonX.jsx
│   │   │   └── index.js
│   │   │
│   │   ├── dialogs/             # Modal dialogs
│   │   │   ├── SaveAssessmentDialog/
│   │   │   ├── RenameAssessmentDialog/
│   │   │   ├── DeleteAssessmentDialog/
│   │   │   └── ConfirmationDialog/
│   │   │
│   │   ├── drawers/             # Side drawers
│   │   │   ├── ResultsDatabaseEvidenceDetailsDrawer/
│   │   │   └── ...
│   │   │
│   │   ├── error-boundaries/    # Error boundary components
│   │   │
│   │   ├── export/              # Export UI components
│   │   │
│   │   ├── filters/             # Filter/search components
│   │   │
│   │   ├── layout/              # Layout wrappers
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── modals/              # Modal components
│   │   │
│   │   ├── modern-ui/           # Custom UI components
│   │   │   ├── copy-button.jsx
│   │   │   └── ...
│   │   │
│   │   └── ui/                  # HeroUI wrapper components
│   │
│   ├── utils/
│   │   ├── content.js           # Content extraction utilities
│   │   ├── session.js           # Session helper functions
│   │   ├── async.js             # Async utilities
│   │   ├── ui.js                # UI utilities
│   │   ├── cn.ts                # className merge utilities
│   │   └── cx.ts                # Conditional class utilities
│   │
│   ├── test/
│   │   └── test-utils.jsx       # Testing helper utilities
│   │
│   └── tmp/
│       └── debug-results-buttons.test.jsx # Debug/test file
│
├── package.json                 # Dependencies & scripts
├── vite.config.js              # Vite configuration
├── vitest.config.js            # Vitest configuration
├── vercel.json                 # Vercel deployment config
├── tsconfig.json               # TypeScript (if used)
├── eslint.config.js            # ESLint rules
├── index.html                  # HTML entry point
└── README.md                   # This file
```

---

## Setup & Installation

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Supabase Account** (for authentication)
- **Backend API** running on specified URL

### Installation Steps

```pwsh
# 1. Clone the repository
git clone <repo-url>
cd frontend

# 2. Install dependencies
npm install

# 3. Create environment file (see Configuration section)
Copy-Item .env.example .env.frontend

# 4. Configure environment variables
# Edit .env.frontend with your values (see Configuration section below)

# 5. Start development server
npm run dev
```

### Verify Installation

```pwsh
# Check that dev server starts without errors
npm run dev
# Expected: Vite server running at http://localhost:5173

# Run tests to verify setup
npm test

# Build to check for errors
npm run build
```

---

## Configuration

### Environment Variables

Create a `.env.frontend` file (or copy from `.env.example`) with the following variables:

```env
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
```

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
```

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

**Multi-Dimensional Scoring**

- 8 key parameters across circular economy dimensions
- Evidence-based scoring with AI reasoning
- Confidence scoring & integrity gap analysis

**Files**:

- `src/constants/evaluationData.js` – Parameter definitions
- `src/lib/scoring.js` – Score formatting & calculations
- `src/features/assessments/api/assessmentApi.js` – API calls

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
// ✅ Good: Self-contained, focused component
export default function ResultsPage() {
  const { id } = useParams();
  const { assessment, isLoading } = useAssessment(id);

  return <div>{/* Component JSX */}</div>;
}
```

#### Hooks

```jsx
// ✅ Good: Custom hook extracts reusable logic
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
// ✅ Good: Use buildApiUrl for automatic proxy routing
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
// ✅ Good: Centralized, immutable constants
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

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

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
// ✅ Good
import { EVALUATION_PARAMETERS } from '@/constants/evaluationData';

// ❌ Avoid
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

✅ **Good**:

- Secret key in Vercel env variables only
- Proxy function injects key server-side
- Frontend never sees the secret

❌ **Avoid**:

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
