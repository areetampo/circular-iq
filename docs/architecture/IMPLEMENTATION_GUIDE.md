# Frontend Implementation Guide

This guide outlines the remaining frontend work needed to complete the Circular Economy Business Auditor.

## ✅ Completed

- [x] Backend scoring engine (`backend/src/scoring.js`)
- [x] RAG reasoning system (`backend/src/ask.js`)
- [x] Dataset chunking (`backend/scripts/chunk.js`)
- [x] Embedding pipeline (`backend/scripts/embed_and_store.js`)
- [x] Supabase schema (`backend/supabase/setup.sql`)
- [x] Express API server (`backend/api/server.js`)
- [x] Evaluation constants (`frontend/src/constants/evaluationData.js`)
- [x] Helper utilities (`frontend/src/utils/helpers.js`)

## ⏳ Remaining Work

### Phase 1: UI Components (6 files)

These components render evaluation parameters, display results, and show evidence cards.

#### 1. **ParameterSliders.jsx**

**Purpose**: Interactive slider interface for adjusting 8 evaluation factors

**Props**:

```javascript
{
  parameters: {                    // Current parameter values
    public_participation: 50,
    infrastructure: 50,
    // ... all 8 factors
  },
  onChange: (newParameters) => {},  // Callback on slider change
  disabled: false,                  // Disable during submission
  readOnly: false                   // Disable all interactions
}
```

**Features**:

- Organize sliders by 3 categories (Access, Embedded, Processing) with visual grouping
- Show current value + percentage for each slider
- Display calibration examples on hover (from evaluationData.js)
- Color-code slider backgrounds by score range (emerald/blue/orange/red)
- Include "Reset to Default" button
- Show category averages below each group

**Estimated Lines**: 120-150

---

#### 2. **MetricInfoModal.jsx**

**Purpose**: Educational modal showing factor definitions, scales, and real examples

**Props**:

```javascript
{
  isOpen: boolean,                    // Control visibility
  parameterName: "public_participation", // Which parameter to show
  onClose: () => {},                  // Close handler
  currentValue: 65                    // Optional: highlight current score
}
```

**Features**:

- Header with parameter name + weight percentage
- Definition and methodology sections
- 5-level scale with descriptions (90, 75, 60, 40, 20 points)
- 4 real-world examples from GreenTechGuardians dataset
- For each example: score + case name + description + impact statement
- Visual score indicator (color-coded bar)
- "OK" button to close

**Example Structure**:

```
Public Participation (15% weight)

Definition: How easily can stakeholders engage...

Methodology: This factor measures...

Calibration Scale:
[90] Universal Access - Effortless participation from all groups
[75] Wide Accessibility - Easy for most stakeholders
[60] Standard Access - Moderate barriers remain
[40] Limited Access - Significant hurdles
[20] Restricted - Few can participate

Real Examples:
📦 Municipal Curbside Composting (City of SF) - Score: 85
   "Effortless weekly pickup at 98% of residences makes this
    the gold standard for public circular participation."

📦 Extended Producer Responsibility Scheme (EU) - Score: 72
   "Effective but requires some consumer education..."
```

**Estimated Lines**: 100-130

---

#### 3. **RadarChartSection.jsx**

**Purpose**: Multi-dimensional visualization comparing user's scores to benchmarks

**Props**:

```javascript
{
  userScores: {              // User's 8 parameter values
    public_participation: 75,
    // ... all 8 factors
  },
  benchmarkScores: {         // Market average (optional)
    public_participation: 60,
    // ... all 8 factors
  },
  overallScore: 67,          // Main overall score
  confidenceLevel: 78        // Confidence percentage
}
```

**Features**:

- Recharts RadarChart with 8 axes (one per parameter)
- User scores = filled blue/emerald area
- Benchmark scores = dotted line for comparison
- Tooltip showing exact values on hover
- Legend showing user vs. benchmark
- Summary statistics above chart:
  - Overall Score in large, color-coded number
  - Confidence Level badge
  - Quick interpretation (Strong/Moderate/Weak/Critical)
- Below chart: Ordered list of factors from highest to lowest score

**Estimated Lines**: 80-120

---

#### 4. **EvidenceCard.jsx**

**Purpose**: Displays a single matched database case with semantic summary

**Props**:

```javascript
{
  caseTitle: string,              // AI-generated semantic summary
  matchPercentage: number,        // 0-100 similarity score
  content: string,                // First 200 chars of case
  fullContent: string,            // Complete case text
  source: {                       // Metadata from database
    row: 42,
    category: "Packaging",
    problem: "...",
    solution: "..."
  },
  onViewFull: () => {}            // Open modal with full content
}
```

**Features**:

- Card layout with subtle shadow
- Match percentage in bold emerald (#34a83a) at top-right
- Title as semantic summary (AI-generated one-liner)
- 4-line content preview with CSS text clamping
- Category badge (bottom-left)
- "View Full Context" button (bottom-right, emerald theme)
- Hover effect: slight elevation, cursor pointer
- Modal opens on button click showing full case details

**Estimated Lines**: 60-90

---

#### 5. **ContextModal.jsx**

**Purpose**: Full-screen modal displaying complete evidence case

**Props**:

```javascript
{
  isOpen: boolean,                // Control visibility
  source: {                       // Database entry
    row: number,
    category: string,
    problem: string,
    solution: string,
    materials: string,
    circular_strategy: string,
    impact: string
  },
  onClose: () => {},              // Close handler
  matchPercentage: number         // Similarity score for header
}
```

**Features**:

- Header with match percentage + close button (X)
- Tabs or sections for Problem/Solution/Materials/Strategy/Impact
- Full text rendering for each section
- Quote-style formatting for Problem and Solution (italic, left border in emerald)
- Metadata footer: Source Row #42 | Category: "Packaging"
- Copy button to copy case text
- Responsive width (90% on mobile, 800px max on desktop)

**Estimated Lines**: 90-120

---

#### 6. **InfoIconButton.jsx** (Existing - May Need Updates)

**Purpose**: Icon button that triggers MetricInfoModal or educational popover

**Props**:

```javascript
{
  parameterName: "public_participation",  // Which factor to explain
  position: "top" | "right" | "bottom",   // Tooltip position
  size: "small" | "medium"                // Icon size
}
```

**Features**:

- Small "ⓘ" icon (12-16px) with hover effect
- Tooltip or modal on click showing factor guidance
- Integrates with MetricInfoModal for consistent UX
- Color: subtle gray (#999) with hover to emerald (#34a83a)

**Current Status**: Basic structure exists, may need enhancement

**Estimated Lines**: 40-60 (enhancements)

---

### Phase 2: View Components (3 files)

These are the three main pages of the application.

#### 1. **LandingView.jsx**

**Purpose**: Initial input screen for business problem and solution

**Features**:

- Header: "Circular Economy Business Auditor" with tagline
- Two-part input:
  - "Describe Your Business Problem" - textarea (50 char minimum)
  - "Describe Your Solution" - textarea (50 char minimum)
- Character count indicator (live update)
- "Advanced Parameters" toggle → ParameterSliders component (hidden by default)
- Guidance text:
  - Problem guide (from evaluationData.js)
  - Solution guide (from evaluationData.js)
- Info buttons on each input field
- Submit button: "Evaluate Idea" (disabled until both inputs valid)
- Loading state during submission (spinner + disabled button)
- Error handling: Display validation errors clearly

**Submission Flow**:

1. Validate inputs (50+ chars, not junk via helpers.validateInput())
2. Call helpers.submitForScoring(problem, solution, parameters)
3. On success: Navigate to ResultsView with data
4. On error: Show error message with retry option

**Estimated Lines**: 150-200

---

#### 2. **EvaluationCriteriaView.jsx**

**Purpose**: Educational view showing all 8 factors with guidance

**Features**:

- Header: "Understanding the 8-Factor Framework"
- 3 Sections organized by value category:
  - **Access Value** (30%)
    - Public Participation (15%)
    - Infrastructure (15%)
  - **Embedded Value** (40%)
    - Market Price (20%)
    - Maintenance (10%)
    - Uniqueness (10%)
  - **Processing Value** (30%)
    - Size Efficiency (10%)
    - Chemical Safety (10%)
    - Tech Readiness (10%)
- Each factor shows:
  - Name + weight as percentage
  - Definition (1-2 sentences)
  - Why it matters (1 sentence)
  - Calibration scale with 5 levels
  - 2 real examples with scores
  - Info icon → MetricInfoModal
- Navigation:
  - Back button to LandingView
  - "Continue to Evaluation" button → LandingView with auto-scroll to Advanced Parameters

**Estimated Lines**: 200-250

---

#### 3. **ResultsView.jsx**

**Purpose**: Comprehensive results display with scores, analysis, and evidence

**Features**:

**A. Executive Summary Section**

- Large overall score (color-coded: emerald/blue/orange/red)
- Score interpretation (Strong/Moderate/Weak/Critical)
- Confidence level badge with explanation
- 1-2 sentence audit verdict from AI

**B. Integrity Analysis Section**

- List of identified gaps (if any) from scoring.identifyIntegrityGaps()
- Each gap shows:
  - Type (e.g., "Overestimation in Market Price")
  - Severity indicator (high/medium/low with color)
  - Explanation from AI audit
  - Evidence reference (which database case)

**C. Comparative Metrics Dashboard**

- RadarChartSection component showing all 8 factors
- Sub-score cards showing each factor with:
  - Name + value (0-100)
  - Color-coded progress bar
  - Category group indicator
- Category averages (Access/Embedded/Processing)

**D. Evidence Cards Section**

- Title: "Similar Projects from Database (3 matches)"
- 3x EvidenceCard components showing top database matches
- Each card includes match percentage in emerald

**E. Recommendations Section**

- Title: "Technical Recommendations"
- List of 4-6 actionable recommendations from AI analysis
- Each recommendation:
  - Bold header
  - Description (1-2 sentences)
  - Priority indicator (High/Medium/Low)
  - Related factor

**F. Navigation**

- "Modify Parameters" button → LandingView
- "View Full Methodology" link → EvaluationCriteriaView
- "Share Results" button (optional)
- Export as PDF button (optional)

**Estimated Lines**: 250-350

---

### Phase 3: Main App & Styling (2 files)

#### 1. **App.jsx**

**Purpose**: Main application component with routing and state management

**Features**:

- React Router setup for 3 views: LandingView, EvaluationCriteriaView, ResultsView
- Global state (useState) for:
  - currentView (landing/evaluation/results)
  - businessProblem
  - businessSolution
  - parameters
  - scoringResults
  - loading
  - error
- Navigation logic:
  - LandingView → Submit → ResultsView (with data)
  - ResultsView → "Modify" → LandingView (preserve previous inputs)
  - Both views → "Criteria" → EvaluationCriteriaView
- Error boundary for graceful error handling
- Loading overlay during API calls
- Responsive layout wrapper

**Estimated Lines**: 100-150

---

#### 2. **App.css** (Verification & Enhancement)

**Current Status**: 1110 lines exist
**Tasks**:

1. Verify emerald theme (#34a83a) is primary throughout
2. Ensure all components have CSS classes defined
3. Add responsive design (mobile-first, 768px+ breakpoints)
4. Verify color scheme consistency:
   - Primary: #34a83a (emerald)
   - Secondary: #4a90e2 (blue)
   - Accent: #ff9800 (orange)
   - Error: #d32f2f (red)
   - Text: #333 (dark), #666 (secondary)
   - Background: #f5f5f5 (light gray)
5. Add hover/active states for interactivity
6. Ensure accessibility (contrast ratios, focus states)
7. Add component-specific classes for:
   - Cards (.card, .card:hover)
   - Sliders (.slider-group, .slider-track)
   - Modals (.modal-overlay, .modal-content)
   - Buttons (.btn, .btn-primary, .btn-secondary)
   - Badges (.badge, .badge-success, .badge-warning)
   - Chart sections (.chart-container, .chart-wrapper)

**Estimated Lines**: Review + add 200-300 lines if needed

---

## 📋 Implementation Checklist

### Components (Week 1)

- [ ] ParameterSliders.jsx (120 lines)
- [ ] MetricInfoModal.jsx (100 lines)
- [ ] RadarChartSection.jsx (100 lines)
- [ ] EvidenceCard.jsx (70 lines)
- [ ] ContextModal.jsx (100 lines)
- [ ] InfoIconButton.jsx enhancements (50 lines)

### Views (Week 2)

- [ ] LandingView.jsx (180 lines)
- [ ] EvaluationCriteriaView.jsx (220 lines)
- [ ] ResultsView.jsx (300 lines)

### App & Styling (Week 2)

- [ ] App.jsx (120 lines)
- [ ] App.css verification & enhancements
- [ ] Responsive design testing

### Documentation & Deployment (Week 3)

- [ ] README.md (already created)
- [ ] API documentation
- [ ] Deployment guide
- [ ] User guide
- [ ] Testing

---

## 🧪 Testing Checklist

Before deployment:

- [ ] All 8 factors sum to 1.0 in scoring
- [ ] Scores are deterministic (same input = same output)
- [ ] LLM responses cite database evidence
- [ ] UI renders correctly on mobile/tablet/desktop
- [ ] No console errors or warnings
- [ ] Loading states work smoothly
- [ ] Error messages are user-friendly
- [ ] Navigation flows work intuitively
- [ ] All links/buttons functional
- [ ] Color contrast meets WCAG AA standards
- [ ] Performance is smooth (no lag)
- [ ] All images optimize and load quickly

---

## 🚀 Next Steps

1. **Create components in order**: Start with ParameterSliders → MetricInfoModal → RadarChartSection → Cards
2. **Test as you go**: Each component should work standalone before integrating into views
3. **Build views from components**: Views are compositions of components
4. **Integrate with App.jsx**: Wire up routing and state management
5. **Style and polish**: Refine CSS, ensure responsive design
6. **Test end-to-end**: Submit → Results workflow
7. **Deploy**: Push to production

---

## 📚 References

- [evaluationData.js](../frontend/src/constants/evaluationData.js) - All parameter guidance and examples
- [helpers.js](../frontend/src/utils/helpers.js) - API wrapper and utility functions
- [Server API](../backend/api/server.js) - Endpoint documentation
- [Recharts Docs](https://recharts.org/) - Radar chart component
- [React Router](https://reactrouter.com/) - Navigation

---

**Built with ♻️ for a circular future**
