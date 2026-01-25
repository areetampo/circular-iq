# Circular Economy Assessment Tool - Frontend

A React + Vite application for evaluating circular economy initiatives against real-world benchmarks using AI-powered semantic search and reasoning.

## Architecture Overview

### Tech Stack

- **Framework**: React 18+ with Vite for fast development & builds
- **Routing**: React Router with lazy-loaded views for code splitting
- **Charts**: Recharts for radar, scatter, and line visualizations
- **State**: React hooks + custom hooks for local state management
- **Export**: CSV/PDF reports via Blob + link download

### Project Structure

See [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md) for detailed component organization.

```
src/
├── components/
│   ├── modals/        # Modal dialogs (including MarketAnalysisModal)
│   ├── forms/         # Form input components
│   └── shared/        # Reusable UI components
├── views/             # Full-page views
├── hooks/             # Custom React hooks
├── utils/             # Utility functions & helpers
├── constants/         # Centralized data & constants
├── styles/            # Component-scoped CSS
├── App.jsx            # Main router
└── main.jsx           # Entry point
```

## Key Features

### 1. **Evaluation Engine**

- Multi-dimensional scoring across 8 parameters
- Evidence-based scoring with confidence tracking
- Comparison to market benchmarks

### 2. **Smart Navigation**

- **Modal-based Market Analysis**: Opens inline without route navigation
  - Accessible from `/results` and `/assessments/:id` views
  - Passes current context (score, industry) automatically
  - Smooth overlay with close button

- **Contextual Routing**: Clean separation of concerns
  - `/` → Home/Evaluation
  - `/results` → Results for newly evaluated idea
  - `/assessments` → History of saved assessments
  - `/assessments/:id` → Detailed view of saved assessment
  - `/compare/:id1/:id2` → Side-by-side comparison

### 3. **Export Capabilities**

- **CSV**: Raw data export with all metrics
- **PDF**: Formatted reports via HTML save-as approach
- Unified export API via `exportSimple.js`

### 4. **User Experience**

- Toast notifications for feedback
- Custom delete confirmation modal
- Session restoration on page reload
- Responsive design with mobile support
- Accessible modals with proper focus management

## Development

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Component Guidelines

### Modals

- Located in `components/modals/`
- Used for complex interactions or overlays
- Always include close button and backdrop click handling

### Shared Components

- Located in `components/shared/`
- Self-contained, prop-driven, testable
- Examples: Toast, ErrorBoundary, Cards, Buttons

### Forms

- Located in `components/forms/`
- Input components grouped by interaction pattern
- Example: ParameterSliders for evaluation controls

### Hooks

- Centralize stateful logic
- Name with `use` prefix
- Examples: `useToast`, `useExportState`

### Utilities

- One responsibility per function
- Compose larger operations from smaller units
- Examples: `exportAssessmentCSV`, `extractCaseInfo`

## Important Notes

### Import Paths

After reorganization, pay attention to relative paths:

- From `views/`: `import Component from '../components/modals/ComponentName'`
- From `components/shared/`: `import Helper from '../../utils/helpers'`
- From `components/modals/`: `import Data from '../../constants/evaluationData'`

### Styling

- Global styles: `App.css`
- Component-scoped styles: `styles/ComponentName.css`
- Consistent color scheme with `#34a83a` (primary green), `#ff9800` (accent), `#2c3e50` (text)

### Removed Files

- `utils/export.js` → consolidated into `exportSimple.js`
- `utils/exportEnhanced.js` → consolidated into `exportSimple.js`
- `utils/apiClient.js` → direct API calls via fetch

## Next Steps

- [ ] Mobile polish & responsive design improvements
- [ ] Tailwind CSS + shadcn/ui refactor (future)
- [ ] End-to-end tests (Playwright)
- [ ] Accessibility audit & fixes
- [ ] Performance optimization (bundle analysis, lazy loading review)

## Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [Recharts](https://recharts.org)

---

**Last Updated**: January 2026
**Status**: Phase 2 Complete - Refactoring & Modal Implementation
