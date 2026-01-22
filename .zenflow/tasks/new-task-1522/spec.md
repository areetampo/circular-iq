# Technical Specification: Circular Economy Business Auditor Enhancement

## Task Complexity Assessment

**Complexity Level: HARD**

### Justification:
- Multi-tier architecture (Frontend + Backend + Database + AI)
- Complex RAG implementation with semantic search
- Sophisticated UI with multiple interactive components
- Data pipeline requiring CSV-specific processing
- Advanced AI prompt engineering with structured output
- Professional-grade audit report generation
- Multiple state management patterns
- Extensive validation and integrity checking logic

---

## Technical Context

### Languages & Frameworks
- **Frontend**: JavaScript (ES6+), React 19, Vite 7
- **Backend**: JavaScript (ES Modules), Node.js, Express 5
- **Database**: PostgreSQL with pgvector extension (Supabase)
- **AI/ML**: OpenAI API (GPT-4o-mini, text-embedding-3-small)
- **Visualization**: Recharts 3.6
- **Styling**: Pure CSS (no frameworks)

### Dependencies Status
✅ All required packages already installed:
- Backend: express, cors, dotenv, @supabase/supabase-js, openai
- Frontend: react, react-dom, recharts, react-markdown, vite

### Current Architecture State

**Existing Implementation:**
```
✅ backend/api/server.js - Basic RAG endpoint
✅ backend/src/scoring.js - Equal-weight scoring (needs update)
✅ backend/src/ask.js - Basic prompt (needs enhancement)
✅ backend/scripts/chunk.js - Generic text chunking (needs CSV-specific logic)
✅ backend/scripts/embed_and_store.js - Basic embedding pipeline
✅ backend/supabase/setup.sql - Vector DB schema
✅ frontend/src/App.jsx - Monolithic component (needs refactoring)
❌ Dataset not downloaded (AI_EarthHack_Dataset.csv missing)
❌ Component architecture not implemented
❌ Enhanced UI sections missing
```

---

## Implementation Approach

### Phase 1: Data Pipeline Enhancement
**Objective**: Transform CSV dataset into semantically meaningful chunks

#### 1.1 Dataset Acquisition
- Download GreenTechGuardians dataset from GitHub
- Verify CSV structure (business_problem, business_solution columns)
- Place in `backend/dataset/GreenTechGuardians/AI_EarthHack_Dataset.csv`

#### 1.2 CSV-Specific Chunking (`chunk.js` rewrite)
**Current Issue**: Generic text chunking doesn't preserve semantic relationships

**New Approach**:
```javascript
// Parse CSV rows
// Each chunk = { 
//   id: row_index,
//   problem: business_problem, 
//   solution: business_solution,
//   full_text: "Problem: [X]. Solution: [Y]",
//   metadata: { category, materials, impact_metrics }
// }
```

**Key Changes**:
- Use CSV parser (csv-parse library)
- Preserve problem/solution pairs as atomic units
- Add metadata extraction from CSV columns
- Output JSON array for embedding step

#### 1.3 Enhanced Embedding Strategy (`embed_and_store.js`)
**Updates Required**:
- Read chunked JSON instead of raw text
- Embed full_text field
- Store metadata in JSONB column
- Add progress logging
- Batch insert with error handling

---

### Phase 2: Backend Intelligence Layer

#### 2.1 Scoring System Overhaul (`scoring.js`)

**Current State**: Equal weighting (12.5% each)
```javascript
const overall = (sum of all 8) / 8;
```

**Required Change**: Weighted scoring per spec
```javascript
const weights = {
  public_participation: 0.15,
  infrastructure: 0.15,
  market_price: 0.20,        // Highest weight
  maintenance: 0.10,
  uniqueness: 0.10,
  size_efficiency: 0.10,
  chemical_safety: 0.10,
  tech_readiness: 0.10
};

const overall_score = Object.keys(weights).reduce((sum, key) => {
  return sum + (parameters[key] * weights[key]);
}, 0);
```

**Validation**: Ensure weights sum to 1.0

#### 2.2 Enhanced AI Reasoning (`ask.js`)

**Current Limitations**:
- Generic system prompt
- Minimal integrity checking
- Missing key output fields: `strengths`, `key_metrics_comparison`, `severity` levels

**New System Prompt Structure**:
```
Role: Senior Circular Economy Auditor
Context: Access to GreenTechGuardians database
Rules:
1. Integrity-first: Flag inflated scores vs. evidence
2. Evidence-based: Every claim cites database case
3. Constructive: Balance critique with recommendations
4. Quantitative: Use similarity scores for validation
5. JSON-only output: No markdown, no preamble
```

**New User Prompt Template**:
```
USER SUBMISSION:
Problem: ${businessProblem}
Solution: ${businessSolution}

USER'S SELF-ASSESSMENT SCORES:
${JSON.stringify(scores, null, 2)}

DATABASE EVIDENCE (Top 3 Similar Projects):
${similarDocs.map((doc, i) => `
Case ${i + 1} (Similarity: ${(doc.similarity * 100).toFixed(1)}%):
Content: ${doc.content}
Metadata: ${JSON.stringify(doc.metadata)}
`).join('\n')}

Return JSON with:
- confidence_score (0-100)
- is_junk_input (boolean)
- audit_verdict (2-3 sentences)
- comparative_analysis (vs database)
- integrity_gaps: [{ issue, evidence_source_id, severity: low|medium|high }]
- strengths: [{ aspect, evidence_source_id }]
- technical_recommendations: [string]
- similar_cases_summaries: [string] (one per case)
- key_metrics_comparison: { market_readiness, scalability, economic_viability }
```

**Function Signature Change**:
```javascript
// From:
generateReasoning(idea, scores, parameters, similarDocs)

// To:
generateReasoning(businessProblem, businessSolution, scores, parameters, similarDocs)
```

#### 2.3 API Server Updates (`server.js`)

**Input Schema Change**:
```javascript
// From:
{ idea, parameters }

// To:
{ businessProblem, businessSolution, parameters }

// Validation:
- businessProblem: min 200 chars
- businessSolution: min 200 chars
- Both required, non-empty
```

**Embedding Strategy**:
```javascript
const combinedIdea = `Problem: ${businessProblem}. Solution: ${businessSolution}`;
const embeddingRes = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: combinedIdea,
});
```

---

### Phase 3: Frontend Component Architecture

**Current**: Single 1500-line App.jsx monolith
**Target**: Modular component structure

#### 3.1 New Folder Structure
```
frontend/src/
├── App.jsx (orchestrator)
├── App.css (global styles)
├── constants/
│   └── evaluationData.js (factor metadata, guidance, examples)
├── utils/
│   └── helpers.js (formatting, extraction, calculations)
├── components/
│   ├── RadarChartSection.jsx
│   ├── MetricInfoModal.jsx
│   ├── EvidenceCard.jsx
│   ├── ParameterSliders.jsx
│   ├── InfoIconButton.jsx
│   └── ContextModal.jsx
└── views/
    ├── LandingView.jsx
    ├── ResultsView.jsx
    └── EvaluationCriteriaView.jsx
```

#### 3.2 Component Specifications

**`constants/evaluationData.js`**
```javascript
export const FACTOR_METADATA = {
  public_participation: {
    title: "Public Participation",
    category: "Access Value",
    description: "Ease of stakeholder engagement",
    scaleGuide: {
      low: "0-30: Expert-only access",
      mid: "40-60: Community involvement",
      high: "70-100: Universal participation"
    },
    examples: [
      { score: 90, case: "Municipal composting", reason: "Zero barriers" },
      { score: 50, case: "Product take-back", reason: "Moderate effort" },
      { score: 20, case: "B2B partnerships", reason: "Limited access" }
    ],
    methodology: "Based on barrier analysis: technical knowledge, geographic access, cost, time commitment"
  },
  // ... similar for all 8 factors
};

export const MARKET_AVERAGES = {
  tech_readiness: 62,
  market_price: 58,
  // ... computed from database analysis
};
```

**`utils/helpers.js`**
```javascript
export function getConfidenceLevel(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

export function extractProblem(content) {
  const match = content.match(/Problem:\s*([^.]+)/);
  return match ? match[1] : content.slice(0, 200);
}

export function getSeverityIcon(severity) {
  const icons = { low: '⚠️', medium: '⚠️⚠️', high: '🚨' };
  return icons[severity] || '•';
}

export function formatSimilarityLevel(similarity) {
  if (similarity >= 0.8) return 'high';
  if (similarity >= 0.5) return 'medium';
  return 'low';
}
```

**`components/InfoIconButton.jsx`**
```jsx
export default function InfoIconButton({ onClick, modalContent }) {
  return (
    <button className="info-icon-btn" onClick={onClick}>
      <svg>...</svg>
    </button>
  );
}
```

**`components/ParameterSliders.jsx`**
```jsx
import { FACTOR_METADATA } from '../constants/evaluationData';

export default function ParameterSliders({ parameters, onChange }) {
  const categories = {
    'Access Value': ['public_participation', 'infrastructure'],
    'Embedded Value': ['market_price', 'maintenance', 'uniqueness'],
    'Processing Value': ['size_efficiency', 'chemical_safety', 'tech_readiness']
  };

  return (
    <div className="parameters-container">
      {Object.entries(categories).map(([category, factors]) => (
        <div key={category} className="parameter-category">
          <h3>{category}</h3>
          {factors.map(factor => {
            const meta = FACTOR_METADATA[factor];
            return (
              <div key={factor} className="parameter-item">
                <div className="parameter-header">
                  <label>{meta.title}</label>
                  <InfoIconButton modalContent={factor} />
                </div>
                <div className="parameter-scale-guide">
                  <span className="scale-marker low">{meta.scaleGuide.low}</span>
                  <span className="scale-marker mid">{meta.scaleGuide.mid}</span>
                  <span className="scale-marker high">{meta.scaleGuide.high}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={parameters[factor]}
                  onChange={(e) => onChange(factor, Number(e.target.value))}
                />
                <div className="parameter-value">{parameters[factor]}</div>
                <p className="parameter-example">
                  Example: {meta.examples[0].case} = {meta.examples[0].score}
                </p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

**`components/EvidenceCard.jsx`**
```jsx
export default function EvidenceCard({ caseItem, summary, onViewFull }) {
  const similarityLevel = formatSimilarityLevel(caseItem.similarity);
  
  return (
    <div className="evidence-card" data-similarity={similarityLevel}>
      <div className="card-header">
        <div className="similarity-badge">
          {(caseItem.similarity * 100).toFixed(1)}% Match
        </div>
        <div className="case-metadata">
          Case #{caseItem.id} | {caseItem.metadata?.category}
        </div>
      </div>
      
      <h3 className="case-insight">{summary}</h3>
      
      <div className="case-content">
        <div className="problem-solution">
          <strong>Problem:</strong> {extractProblem(caseItem.content)}
        </div>
        <div className="problem-solution">
          <strong>Solution:</strong> {extractSolution(caseItem.content)}
        </div>
      </div>
      
      <button onClick={() => onViewFull(caseItem)}>
        Read Full Case Study →
      </button>
    </div>
  );
}
```

**`views/LandingView.jsx`**
```jsx
export default function LandingView({ 
  businessProblem, 
  businessSolution,
  parameters,
  onProblemChange,
  onSolutionChange,
  onParameterChange,
  onSubmit,
  loading,
  error 
}) {
  return (
    <div className="landing-view">
      {/* Two-part input */}
      <div className="input-section">
        <div className="input-field">
          <div className="field-header">
            <h3>Business Problem</h3>
            <InfoIconButton modalContent="problemGuide" />
          </div>
          <textarea
            placeholder="What environmental or circular economy challenge does your business address? (e.g., 'Single-use plastic packaging creates 8M tons of ocean waste annually...')"
            value={businessProblem}
            onChange={(e) => onProblemChange(e.target.value)}
            rows={5}
          />
          <div className="char-count">{businessProblem.length}/200 minimum</div>
        </div>

        <div className="input-field">
          <div className="field-header">
            <h3>Business Solution</h3>
            <InfoIconButton modalContent="solutionGuide" />
          </div>
          <textarea
            placeholder="How does your business solve this problem? Include materials, processes, and circularity strategy. (e.g., 'Compostable packaging from hemp waste using a hub-and-spoke collection model...')"
            value={businessSolution}
            onChange={(e) => onSolutionChange(e.target.value)}
            rows={5}
          />
          <div className="char-count">{businessSolution.length}/200 minimum</div>
        </div>
      </div>

      {/* Advanced Parameters */}
      <ParameterSliders parameters={parameters} onChange={onParameterChange} />

      {/* Submit */}
      <button onClick={onSubmit} disabled={loading}>
        {loading ? 'Analyzing...' : 'Evaluate Business Idea'}
      </button>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
```

**`views/ResultsView.jsx`**
```jsx
export default function ResultsView({ result, onBackToInput, onViewCriteria }) {
  const { overall_score, sub_scores, audit, similar_cases } = result;

  return (
    <div className="results-view">
      {/* Executive Summary */}
      <div className="executive-summary">
        <div className="summary-header">
          <h2>Executive Summary</h2>
          <div className="confidence-badge" data-level={getConfidenceLevel(audit.confidence_score)}>
            {audit.confidence_score}% Confidence
          </div>
        </div>
        <p className="verdict">{audit.audit_verdict}</p>
        <div className="key-finding">
          <strong>Key Finding:</strong> {audit.comparative_analysis}
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="overall-score-section">
        <div className="score-display">
          <div className="score-circle">{overall_score}</div>
          <div className="score-label">Overall Circularity Score</div>
        </div>
      </div>

      {/* Radar Chart */}
      <RadarChartSection scores={sub_scores} />

      {/* Integrity Analysis */}
      <div className="integrity-section">
        <h2>Integrity Analysis</h2>
        <p className="explanation">
          We compare your self-assessed scores against real-world projects...
        </p>
        
        {audit.integrity_gaps?.map((gap, i) => (
          <div key={i} className="integrity-gap" data-severity={gap.severity}>
            <div className="gap-icon">{getSeverityIcon(gap.severity)}</div>
            <div className="gap-content">
              <p className="gap-issue">{gap.issue}</p>
              {gap.evidence_source_id && (
                <button onClick={() => highlightCase(gap.evidence_source_id)}>
                  View Supporting Evidence →
                </button>
              )}
            </div>
          </div>
        ))}
        
        {audit.strengths?.map((strength, i) => (
          <div key={i} className="strength-item">
            <div className="strength-icon">✓</div>
            <div className="strength-content">
              <p className="strength-aspect">{strength.aspect}</p>
              {strength.evidence_source_id && (
                <span className="evidence-badge">Validated by Case {strength.evidence_source_id}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comparative Metrics Dashboard */}
      <div className="metrics-comparison">
        <h2>Metrics Comparison</h2>
        <div className="comparison-grid">
          <div className="metric-card">
            <h3>Market Readiness</h3>
            <p className="insight">{audit.key_metrics_comparison?.market_readiness}</p>
          </div>
          <div className="metric-card">
            <h3>Scalability</h3>
            <p className="insight">{audit.key_metrics_comparison?.scalability}</p>
          </div>
          <div className="metric-card">
            <h3>Economic Viability</h3>
            <p className="insight">{audit.key_metrics_comparison?.economic_viability}</p>
          </div>
        </div>
      </div>

      {/* Database Evidence */}
      <div className="evidence-section">
        <h2>Database Evidence</h2>
        <p className="evidence-intro">
          These {similar_cases?.length || 0} projects share characteristics with your idea.
        </p>
        
        {similar_cases?.map((caseItem, idx) => (
          <EvidenceCard
            key={caseItem.id}
            caseItem={caseItem}
            summary={audit.similar_cases_summaries?.[idx]}
            onViewFull={handleViewFullCase}
          />
        ))}
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h2>Evidence-Based Recommendations</h2>
        {audit.technical_recommendations?.map((rec, i) => (
          <div key={i} className="recommendation-card">
            <div className="rec-number">{i + 1}</div>
            <div className="rec-content">
              <p className="rec-text">{rec}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="nav-buttons">
        <button onClick={onBackToInput}>← New Evaluation</button>
        <button onClick={onViewCriteria}>View Methodology</button>
      </div>
    </div>
  );
}
```

---

### Phase 4: Styling & Visual Design

#### 4.1 CSS Theme Variables
```css
:root {
  --primary-emerald: #34a83a;
  --secondary-blue: #4a90e2;
  --secondary-orange: #ff9800;
  --text-primary: #333;
  --text-secondary: #666;
  --bg-light: #f5f5f5;
  --bg-white: #ffffff;
  --border-light: #e0e0e0;
  
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-lg: 0 8px 16px rgba(0,0,0,0.2);
  
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

#### 4.2 Key Visual Patterns

**Score Indicators**:
```css
.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-emerald), #2d8f33);
  color: white;
  font-size: 48px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confidence-badge {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-weight: 600;
}

.confidence-badge[data-level="high"] {
  background: #e8f5e9;
  color: var(--primary-emerald);
}

.confidence-badge[data-level="medium"] {
  background: #fff8e1;
  color: #f57c00;
}

.confidence-badge[data-level="low"] {
  background: #ffebee;
  color: #d32f2f;
}
```

**Evidence Cards**:
```css
.evidence-card {
  background: white;
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.evidence-card:hover {
  border-color: var(--primary-emerald);
  box-shadow: var(--shadow-md);
}

.evidence-card[data-similarity="high"] {
  border-left: 4px solid var(--primary-emerald);
}

.evidence-card[data-similarity="medium"] {
  border-left: 4px solid var(--secondary-blue);
}

.evidence-card[data-similarity="low"] {
  border-left: 4px solid var(--text-secondary);
}
```

**Integrity Analysis**:
```css
.integrity-gap[data-severity="high"] {
  background: #ffebee;
  border-left: 4px solid #d32f2f;
}

.integrity-gap[data-severity="medium"] {
  background: #fff8e1;
  border-left: 4px solid #f57c00;
}

.integrity-gap[data-severity="low"] {
  background: #e3f2fd;
  border-left: 4px solid #1976d2;
}

.strength-item {
  background: #e8f5e9;
  border-left: 4px solid var(--primary-emerald);
}
```

---

## Data Model Changes

### Supabase Schema Update

**Current**:
```sql
create table documents (
  id bigserial primary key,
  content text,
  embedding vector(1536)
);
```

**Required**:
```sql
create table documents (
  id bigserial primary key,
  content text,
  embedding vector(1536),
  metadata jsonb,              -- NEW: Store structured data
  created_at timestamp default now()
);

-- Update match_documents function to return metadata
create or replace function match_documents (...)
returns table (
  id bigint,
  content text,
  metadata jsonb,              -- NEW
  similarity float
)
```

### API Response Schema

**Current**:
```typescript
{
  overall_score: number,
  sub_scores: { [key: string]: number },
  audit: {
    confidence_score: number,
    is_junk_input: boolean,
    audit_verdict: string,
    comparative_analysis: string,
    integrity_gaps: Array<{ issue: string, evidence_source_id: number | null }>,
    technical_recommendations: string[],
    similar_cases_summaries: string[]
  },
  similar_cases: Array<{ id: number, content: string, similarity: number }>
}
```

**Required**:
```typescript
{
  overall_score: number,
  sub_scores: { 
    public_participation: number,
    infrastructure: number,
    market_price: number,
    maintenance: number,
    uniqueness: number,
    size_efficiency: number,
    chemical_safety: number,
    tech_readiness: number
  },
  audit: {
    confidence_score: number,
    is_junk_input: boolean,
    audit_verdict: string,
    comparative_analysis: string,
    
    integrity_gaps: Array<{
      issue: string,
      evidence_source_id: number | null,
      severity: 'low' | 'medium' | 'high'        // NEW
    }>,
    
    strengths: Array<{                            // NEW
      aspect: string,
      evidence_source_id: number | null
    }>,
    
    technical_recommendations: string[],
    similar_cases_summaries: string[],
    
    key_metrics_comparison: {                     // NEW
      market_readiness: string,
      scalability: string,
      economic_viability: string
    }
  },
  similar_cases: Array<{ 
    id: number, 
    content: string, 
    metadata: object,                             // NEW
    similarity: number 
  }>
}
```

---

## Verification Approach

### Testing Strategy

#### Backend Testing
```bash
# Manual API tests
cd backend
node src/test.js  # Existing test file for basic validation

# Integration test flow:
# 1. Verify Supabase connection
# 2. Test embedding generation
# 3. Test vector search with sample query
# 4. Test scoring calculation with known inputs
# 5. Test AI reasoning with mock data
```

#### Frontend Testing
```bash
cd frontend
npm run lint    # ESLint validation
npm run build   # Production build test
```

### Manual Verification Checklist

**Data Pipeline**:
- [ ] CSV successfully parsed with all columns
- [ ] Chunks preserve problem/solution pairs
- [ ] Metadata extracted correctly
- [ ] Embeddings generated (1536 dimensions)
- [ ] Database populated (verify row count)
- [ ] Similarity search returns relevant results

**Backend API**:
- [ ] Input validation works (min 200 chars each field)
- [ ] Junk input detection functional
- [ ] Weighted scoring produces correct overall_score
- [ ] RAG retrieval returns top 3 cases
- [ ] AI response includes all new fields (strengths, severity, key_metrics_comparison)
- [ ] Error handling for OpenAI/Supabase failures

**Frontend UI**:
- [ ] Two-part input fields render correctly
- [ ] Character counters update live
- [ ] Parameter sliders show guidance scales
- [ ] Info modals display with correct content
- [ ] Loading states visible during API calls
- [ ] Error messages clear and actionable
- [ ] Executive summary displays with confidence badge
- [ ] Integrity gaps show severity indicators
- [ ] Evidence cards render with similarity badges
- [ ] Radar chart displays all 8 factors
- [ ] Responsive design works on mobile

**User Experience**:
- [ ] Form validation prevents premature submission
- [ ] Professional tone throughout
- [ ] Emerald theme consistent
- [ ] No overly playful language
- [ ] Evidence feels trustworthy
- [ ] Recommendations are actionable

---

## Risk Mitigation

### Potential Challenges

1. **Dataset Availability**
   - Risk: GreenTechGuardians repo structure changes
   - Mitigation: Document exact download path, create backup

2. **API Rate Limits**
   - Risk: OpenAI token limits during embedding
   - Mitigation: Batch processing with delays, progress logging

3. **Vector Search Performance**
   - Risk: Slow queries with large dataset
   - Mitigation: pgvector index already in place, limit to top 3 results

4. **AI Output Consistency**
   - Risk: GPT-4o-mini may not follow JSON schema
   - Mitigation: Use `response_format: { type: 'json_object' }`, add output validation

5. **Component Complexity**
   - Risk: State management across many components
   - Mitigation: Keep state in App.jsx, pass via props (avoid premature Context API)

---

## Dependencies

### Required External Resources
1. GreenTechGuardians dataset: https://github.com/techandy42/GreenTechGuardians
2. OpenAI API key (user must provide)
3. Supabase project (user must create)

### New npm Packages Needed
```bash
# Backend
cd backend
npm install csv-parse  # For CSV parsing in chunk.js

# Frontend
# None - all dependencies already installed
```

---

## Success Criteria

The implementation is complete when:

1. ✅ Dataset processing creates semantically meaningful chunks
2. ✅ Weighted scoring matches specification exactly
3. ✅ AI responses include all new fields with realistic values
4. ✅ Frontend has 10+ modular components
5. ✅ Two-part input (problem/solution) with validation
6. ✅ Integrity analysis flags unrealistic claims
7. ✅ Evidence cards show database cases with summaries
8. ✅ UI feels professional, not playful
9. ✅ Emerald theme consistent throughout
10. ✅ All info modals provide educational value
11. ✅ Methodology is transparent and documented
12. ✅ Manual testing passes all verification checks

---

## Estimated Effort

- **Phase 1 (Data Pipeline)**: 2-3 hours
- **Phase 2 (Backend)**: 3-4 hours
- **Phase 3 (Frontend Components)**: 5-6 hours
- **Phase 4 (Styling)**: 2-3 hours
- **Testing & Polish**: 2 hours

**Total**: 14-18 hours of development time

---

## Next Steps

See `plan.md` for detailed implementation tasks broken down by deliverable.
