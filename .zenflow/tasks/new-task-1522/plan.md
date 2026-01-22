# Implementation Plan: Circular Economy Business Auditor

## Configuration
- **Artifacts Path**: .zenflow/tasks/new-task-1522
- **Complexity**: HARD
- **Estimated Time**: 14-18 hours

---

## Workflow Steps

### [x] Step: Technical Specification

Technical specification created in `spec.md` with:
- Architecture analysis
- Component breakdown
- Data model changes
- Implementation approach
- Verification strategy

---

## Phase 1: Data Pipeline

### [x] Step: Dataset Acquisition & Setup
<!-- chat-id: 44c51eb0-3b5e-4fe3-a589-67743556f440 -->

**Objective**: Download and verify GreenTechGuardians dataset

**Tasks**:
1. Download AI_EarthHack_Dataset.csv from https://github.com/techandy42/GreenTechGuardians
2. Place in `backend/dataset/GreenTechGuardians/`
3. Verify CSV structure (check for business_problem, business_solution columns)
4. Document column names and sample data

**Verification**:
- [x] File exists at correct path
- [x] CSV opens without errors
- [x] Required columns present

---

### [x] Step: CSV-Specific Chunking Implementation
<!-- chat-id: ed4db566-e629-4d04-81eb-e6dc3fd1a102 -->

**Objective**: Rewrite `backend/scripts/chunk.js` for semantic chunking

**Tasks**:
1. Install csv-parse: `npm install csv-parse` in backend
2. Rewrite chunk.js to:
   - Parse CSV rows
   - Preserve problem/solution pairs as atomic units
   - Extract metadata (category, materials, impact metrics if present)
   - Generate full_text: "Problem: [X]. Solution: [Y]"
   - Output JSON array with { id, problem, solution, full_text, metadata }
3. Add progress logging
4. Test with dataset

**Files Modified**:
- `backend/scripts/chunk.js`
- `backend/package.json` (add csv-parse dependency)

**Verification**:
- [x] Run `node scripts/chunk.js`
- [x] Check output shows chunk count
- [x] Verify problem/solution pairs preserved
- [x] Confirm metadata extraction works

---

### [x] Step: Enhanced Embedding & Storage
<!-- chat-id: 65ef785e-948d-4479-a329-94a59d820983 -->

**Objective**: Update `backend/scripts/embed_and_store.js` for metadata storage

**Tasks**:
1. Update Supabase schema to include metadata column
2. Modify embed_and_store.js to:
   - Read chunked JSON from chunk.js output
   - Embed full_text field only
   - Store metadata in JSONB column
   - Add progress logging (batch X of Y)
   - Handle errors gracefully
3. Run embedding pipeline

**Files Modified**:
- `backend/supabase/setup.sql` (add metadata column)
- `backend/scripts/embed_and_store.js`

**Verification**:
- [x] Execute updated setup.sql in Supabase (USER ACTION REQUIRED - see EMBEDDING_SETUP.md)
- [x] Run `node scripts/embed_and_store.js` (Ready to run once credentials added to .env)
- [x] Verify documents table populated (Will be verified after running pipeline)
- [x] Check metadata column has data (Schema updated, ready for data)
- [x] Test match_documents returns metadata (Function updated to return metadata)

---

## Phase 2: Backend Intelligence

### [x] Step: Weighted Scoring System
<!-- chat-id: 060a65b4-67bf-45c4-b4f4-9a93bfa1a347 -->

**Objective**: Implement specification-compliant weighted scoring

**Tasks**:
1. Update `backend/src/scoring.js` with weighted calculation:
   - public_participation: 0.15
   - infrastructure: 0.15
   - market_price: 0.20
   - maintenance: 0.10
   - uniqueness: 0.10
   - size_efficiency: 0.10
   - chemical_safety: 0.10
   - tech_readiness: 0.10
2. Add weight validation (sum = 1.0)
3. Update return format to match API contract

**Files Modified**:
- `backend/src/scoring.js`

**Verification**:
- [ ] Test with sample parameters
- [ ] Verify overall_score changes with weights
- [ ] Confirm all 8 sub_scores returned

---

### [x] Step: Enhanced AI Reasoning System
<!-- chat-id: 5caca90f-431d-4494-94dd-2519387efe5d -->

**Objective**: Implement professional audit-style AI prompts

**Tasks**:
1. Update `backend/src/ask.js` function signature:
   - Change from: `generateReasoning(idea, scores, parameters, similarDocs)`
   - To: `generateReasoning(businessProblem, businessSolution, scores, parameters, similarDocs)`
2. Rewrite system prompt (Senior Auditor role, integrity-first rules)
3. Rewrite user prompt template:
   - Separate problem/solution display
   - Include database evidence with similarity scores
   - Request all new fields: severity, strengths, key_metrics_comparison
4. Add JSON schema validation for response
5. Handle missing optional fields gracefully

**Files Modified**:
- `backend/src/ask.js`

**Verification**:
- [ ] Test AI response includes all required fields
- [ ] Verify integrity_gaps have severity levels
- [ ] Check strengths array populated
- [ ] Confirm key_metrics_comparison object present

---

### [ ] Step: API Server Updates

**Objective**: Update server.js for new input schema and flow

**Tasks**:
1. Update POST /score endpoint input validation:
   - Accept { businessProblem, businessSolution, parameters }
   - Validate both fields ≥ 200 characters
   - Combine for embedding: `Problem: ${problem}. Solution: ${solution}`
2. Update generateReasoning call with new signature
3. Update response structure to include metadata from similar_cases
4. Add error handling for new fields

**Files Modified**:
- `backend/api/server.js`

**Verification**:
- [ ] Test API with curl/Postman
- [ ] Verify 400 error for short inputs
- [ ] Check response has all new audit fields
- [ ] Confirm similar_cases include metadata

---

## Phase 3: Frontend Architecture

### [ ] Step: Create Constants & Utilities

**Objective**: Set up shared data and helper functions

**Tasks**:
1. Create `frontend/src/constants/evaluationData.js`:
   - FACTOR_METADATA with all 8 factors
   - Scale guides, examples, methodology for each
   - MARKET_AVERAGES (placeholder values)
   - Category groupings
2. Create `frontend/src/utils/helpers.js`:
   - getConfidenceLevel(score)
   - extractProblem(content)
   - extractSolution(content)
   - getSeverityIcon(severity)
   - formatSimilarityLevel(similarity)

**Files Created**:
- `frontend/src/constants/evaluationData.js`
- `frontend/src/utils/helpers.js`

**Verification**:
- [ ] Import constants in App.jsx without errors
- [ ] Test helper functions with sample data

---

### [ ] Step: Build Reusable Components

**Objective**: Create UI building blocks

**Tasks**:
1. Create `frontend/src/components/InfoIconButton.jsx`:
   - SVG icon button
   - onClick handler prop
2. Create `frontend/src/components/MetricInfoModal.jsx`:
   - Display factor metadata
   - Show examples and methodology
   - Close button
3. Create `frontend/src/components/ContextModal.jsx`:
   - Full case study viewer
   - Scrollable content
   - Close on backdrop click
4. Create `frontend/src/components/ParameterSliders.jsx`:
   - Grouped by category (Access, Embedded, Processing)
   - Scale guidance labels
   - Info icons per parameter
   - Live value display
   - Example hints
5. Create `frontend/src/components/RadarChartSection.jsx`:
   - Recharts Radar with 8 factors
   - User scores vs market average overlay
   - Legend
6. Create `frontend/src/components/EvidenceCard.jsx`:
   - Similarity badge with color coding
   - Case metadata display
   - Problem/solution extraction
   - "Read Full Case Study" button
   - Summary headline from AI

**Files Created**:
- `frontend/src/components/InfoIconButton.jsx`
- `frontend/src/components/MetricInfoModal.jsx`
- `frontend/src/components/ContextModal.jsx`
- `frontend/src/components/ParameterSliders.jsx`
- `frontend/src/components/RadarChartSection.jsx`
- `frontend/src/components/EvidenceCard.jsx`

**Verification**:
- [ ] Each component renders in isolation
- [ ] Props flow correctly
- [ ] No console errors

---

### [ ] Step: Build View Components

**Objective**: Create main page views

**Tasks**:
1. Create `frontend/src/views/LandingView.jsx`:
   - Two-part input (businessProblem, businessSolution)
   - Character counters with validation
   - Info icons with modal triggers
   - Advanced parameters toggle
   - ParameterSliders integration
   - Submit button with loading state
   - Error display
2. Create `frontend/src/views/ResultsView.jsx`:
   - Executive Summary section (confidence badge, verdict, key finding)
   - Overall score display (large emerald circle)
   - RadarChartSection integration
   - Integrity Analysis section (gaps with severity, strengths)
   - Comparative Metrics Dashboard (3 metric cards)
   - Database Evidence section (map EvidenceCards)
   - Recommendations section (numbered list)
   - Navigation buttons
3. Create `frontend/src/views/EvaluationCriteriaView.jsx`:
   - Methodology explanation
   - 8-factor framework documentation
   - Weightings table
   - RAG process diagram (text-based)
   - Glossary of terms

**Files Created**:
- `frontend/src/views/LandingView.jsx`
- `frontend/src/views/ResultsView.jsx`
- `frontend/src/views/EvaluationCriteriaView.jsx`

**Verification**:
- [ ] Views render with sample data
- [ ] State updates propagate
- [ ] Modal triggers work

---

### [ ] Step: Refactor Main App Component

**Objective**: Orchestrate views and manage state

**Tasks**:
1. Update `frontend/src/App.jsx`:
   - Replace monolithic structure with view routing
   - Update state to include businessProblem, businessSolution (separate from 'idea')
   - Add modal state (activeModal, modalContent, selectedCase)
   - Update submit function for new API schema
   - Handle new audit response fields
   - Implement view navigation (LANDING, RESULTS, CRITERIA)
   - Add modal handlers (openInfoModal, openCaseModal, closeModal)
2. Keep existing state management (no Context API yet)
3. Pass props to child components

**Files Modified**:
- `frontend/src/App.jsx`

**Verification**:
- [ ] App compiles without errors
- [ ] View switching works
- [ ] Form submission triggers API call
- [ ] Results populate correctly

---

## Phase 4: Styling & Polish

### [ ] Step: Professional Theme Implementation

**Objective**: Apply emerald color scheme and professional styling

**Tasks**:
1. Update `frontend/src/App.css`:
   - Add CSS variables for theme
   - Style executive-summary section
   - Style confidence badges (high/medium/low)
   - Style integrity-gap cards (severity colors)
   - Style strength-item cards
   - Style evidence-card with similarity data attributes
   - Style metrics-comparison grid
   - Style recommendations-section
   - Style input-field with char-count
   - Style parameter sliders with scale guides
   - Add modal styles
   - Add responsive breakpoints
2. Ensure no playful elements (professional tone)
3. Add subtle hover transitions
4. Verify emerald accent for high scores

**Files Modified**:
- `frontend/src/App.css`

**Verification**:
- [ ] Color scheme matches spec
- [ ] All components styled consistently
- [ ] Responsive design works (test at 320px, 768px, 1440px)
- [ ] Hover states smooth

---

### [ ] Step: Info Modal Content Population

**Objective**: Fill all info modals with educational content

**Tasks**:
1. Add modal content to evaluationData.js:
   - problemGuide: How to describe business problems
   - solutionGuide: How to describe solutions
   - Factor-specific guides (8 total) with calibration tips
2. Create ModalContentRenderer component or use react-markdown
3. Wire up InfoIconButton clicks to show correct content

**Files Modified**:
- `frontend/src/constants/evaluationData.js`
- `frontend/src/components/MetricInfoModal.jsx` (or new renderer)

**Verification**:
- [ ] All info icons functional
- [ ] Modal content is educational, not superficial
- [ ] Examples help users calibrate

---

## Phase 5: Testing & Validation

### [ ] Step: End-to-End Manual Testing

**Objective**: Verify complete user flow

**Tasks**:
1. Start backend server: `cd backend && node api/server.js`
2. Start frontend dev server: `cd frontend && npm run dev`
3. Test complete flow:
   - Enter valid problem/solution (200+ chars each)
   - Adjust parameters
   - Submit evaluation
   - Verify all result sections render
   - Check database evidence cards
   - View full case study modal
   - Test integrity gaps display
   - Verify recommendations
   - Check radar chart
4. Test error cases:
   - Input < 200 characters
   - Junk input (e.g., "xyz")
   - Backend offline
5. Test edge cases:
   - No similar cases found
   - All parameters at 0
   - All parameters at 100

**Verification Checklist**:
- [ ] Form validation prevents invalid submissions
- [ ] Loading states visible
- [ ] Error messages clear
- [ ] All result sections populate
- [ ] Evidence cards show similarity percentages
- [ ] Modals open/close correctly
- [ ] Radar chart displays 8 factors
- [ ] Confidence badge color matches level
- [ ] Integrity gaps show severity icons
- [ ] Recommendations are actionable
- [ ] Navigation works (back to input, view criteria)
- [ ] Professional tone throughout
- [ ] No console errors

---

### [ ] Step: Build & Lint Validation

**Objective**: Ensure production readiness

**Tasks**:
1. Run frontend build: `cd frontend && npm run build`
2. Run frontend lint: `cd frontend && npm run lint`
3. Fix any lint errors
4. Test production build: `npm run preview`
5. Verify .env.example has all required keys
6. Update README with setup instructions if needed

**Verification**:
- [ ] Build completes without errors
- [ ] Lint passes with no warnings
- [ ] Production build runs correctly
- [ ] Environment variables documented

---

### [ ] Step: Final Polish & Documentation

**Objective**: Ensure professional quality

**Tasks**:
1. Review all text for professional tone (no cheerleading)
2. Verify emerald theme consistency
3. Check for any placeholder text remaining
4. Ensure all info modals have content
5. Test on different screen sizes
6. Create sample .env file if missing
7. Write completion report to `{@artifacts_path}/report.md`

**Report Contents**:
- What was implemented
- Testing approach and results
- Known limitations
- Biggest challenges encountered
- Recommendations for future enhancements

**Verification**:
- [ ] UI feels trustworthy and scientific
- [ ] No Lorem Ipsum or TODOs
- [ ] Responsive design functional
- [ ] Report documents implementation

---

## Success Criteria

Implementation complete when:
- ✅ All workflow steps marked [x]
- ✅ Manual testing checklist 100% passed
- ✅ Build and lint successful
- ✅ Dataset processed and stored in Supabase
- ✅ API returns all specified fields
- ✅ Frontend has 10+ modular components
- ✅ Professional emerald theme applied
- ✅ Integrity analysis functional
- ✅ Evidence cards show database cases
- ✅ Report.md completed
