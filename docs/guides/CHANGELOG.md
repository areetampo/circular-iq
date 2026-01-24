# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-01-24

### Phase 2 Release - Portfolio & Comparative Analysis

#### Added

**Frontend - Multi-Page Routing:**

- React Router v7 integration for true multi-page navigation
- Real URL routes with browser history support:
  - `/` - Evaluator landing page
  - `/results` - Evaluation results display
  - `/criteria` - Evaluation methodology documentation
  - `/assessments` - My Assessments history and portfolio
  - `/assessments/:id` - Individual assessment details
  - `/compare/:id1/:id2` - Side-by-side comparison view
  - `/market-analysis` - Competitive benchmarking dashboard

**Assessment Management:**

- New HistoryView component for portfolio tracking
  - Filter assessments by industry
  - Sort by date, score, or title
  - Bulk selection with compare functionality
  - Quick view/delete actions per assessment
  - Summary statistics (total, average, highest scores)
  - Unique industry count

**Comparison Features:**

- New ComparisonView component for side-by-side analysis
  - Overall score comparison with delta indication
  - Factor score visualization (bar charts)
  - Multi-factor radar profile comparison
  - Project classification comparison
  - Audit verdicts side-by-side
  - Key insights box with trend analysis

**Market Analytics:**

- New MarketAnalysisView component for competitive intelligence
  - Scatter plot visualization of market performance by industry
  - Industry trend analysis (line charts)
  - User score percentile ranking
  - Scale-based filtering for segmented analysis
  - Color-coded industry legend

**Backend - Assessment Persistence:**

- New PostgreSQL tables via Supabase migrations:
  - `assessments` table with full CRUD endpoints
  - `assessment_analytics` for aggregated statistics
- New API endpoints:
  - `POST /assessments` - Save evaluation to portfolio
  - `GET /assessments` - List saved assessments with filtering
  - `GET /assessments/:id` - Retrieve individual assessment
  - `DELETE /assessments/:id` - Remove assessment from portfolio
  - `GET /analytics/market` - Fetch market analysis data

**Database:**

- Phase 2 migration file: `backend/supabase/migrations/001_assessments_system.sql`
- RLS (Row-Level Security) policies for MVP (permissive for development)
- Analytics functions for portfolio statistics

**UI/UX Enhancements:**

- Disabled compare button with hover tooltip when <2 assessments selected
- Counter display showing selection progress (0/2, 1/2, 2/2)
- Responsive layout improvements
- Navigation breadcrumbs and back buttons throughout
- Empty state messaging for no assessments

#### Changed

**Frontend Architecture:**

- Migrated from state-based view toggling to React Router SPA
- Removed prop drilling for navigation (onBack, onCompare callbacks)
- Updated all views to use `useNavigate()` and `useParams()` hooks
- Simplified App.jsx from 300+ lines with view logic to clean route definitions

**Code Quality:**

- Removed unused props (e.g., `onBack` from HistoryView)
- Cleaned up unused imports and dead code
- Consistent error handling across API calls
- Proper dependency arrays in useEffect hooks

#### Fixed

- MarketAnalysisView function initialization error (getIndustryColor)
- Unused footer navigation buttons
- API endpoint routing issues in Express middleware order
- RLS policy constraints blocking assessment inserts (fixed with COALESCE)

#### Dependencies

- Added: `react-router-dom@^7.0.0`

### Documentation Updates

- Updated README.md with Phase 2 features
- Updated technical stack section to reflect React Router and Supabase assessment system
- Created this CHANGELOG

---

## [1.0.0] - Initial Release

### Core Assessment Engine

- Deterministic 8-factor scoring system
- RAG-powered insights using OpenAI embeddings
- Vector search against 1,108 circular economy projects
- Project classification with AI-extracted metadata
- Comprehensive evidence-based audit reports
- PDF/CSV export functionality
- Interactive radar chart visualization
- Professional emerald theme (#34a83a)

### Supported Evaluation Dimensions

1. **Access Value (30%)**: Public Participation, Infrastructure
2. **Embedded Value (35%)**: Market Price, Maintenance, Uniqueness
3. **Processing Value (35%)**: Size Efficiency, Chemical Safety, Tech Readiness

### Initial Features

- Professional assessment tool designed for consultants/investors
- Two-field input system (problem & solution, 200+ chars each)
- 8 configurable evaluation parameters
- Evidence-based analysis with database project citations
- Gap analysis and benchmarking reports
- Industry-filtered semantic search
- Multi-format report exports
- Enhanced evidence cards with visual similarity indicators
- Comprehensive details modal for project references

---

## Future Roadmap (Phase 3+)

### Planned Features

- **Real Authentication**: Supabase Auth integration (sign up/login)
- **User Profiles**: Personal portfolio and assessment history
- **Sharing & Collaboration**: Shareable assessment links
- **Batch Operations**: Bulk upload/analysis workflows
- **Advanced Export**: PDF reports with branding options
- **Email Notifications**: Assessment reminders and alerts
- **Mobile Optimization**: Responsive design improvements
- **Dark Mode**: Theme switcher
- **Webhook Integration**: API webhooks for external systems
- **Advanced Analytics**: Trend analysis and predictive scoring

---

## Technical Debt & Known Limitations

- Phase 2 uses permissive RLS for MVP (no real user authentication yet)
- Assessment userId is currently `NULL` (ready for Phase 3 auth)
- Vector embeddings limited to database size (~1,108 projects)
- No pagination on assessment list (hardcoded limit: 100)
- Market analysis uses aggregate data only (no individual assessment details)

---

## Migration Guide

### Upgrading from Phase 1 to Phase 2

1. Install new dependency: `npm install react-router-dom@^7.0.0`
2. Run database migration: Execute `backend/supabase/migrations/001_assessments_system.sql`
3. Restart backend server (automatically uses new endpoints)
4. Clear browser cache and reload frontend (router changes may affect caching)

No breaking changes to the core scoring engine. Phase 1 assessments can still be evaluated.

---

## Version Numbering

- **Major (X.0.0)**: Significant feature releases or breaking changes
- **Minor (0.X.0)**: New features, non-breaking
- **Patch (0.0.X)**: Bug fixes and minor improvements

---

_Last updated: 2026-01-24_
