# Architecture Documentation

## System Architecture Overview

### High-Level Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                             │
│                          (React + Vite)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Landing View │  │ Results View │  │ Criteria View│               │
│  │  (Input)     │  │ (Display)    │  │ (Education) │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
                              │
                    HTTP POST /score
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      API SERVER (Express)                            │
│                    (backend/api/server.js)                           │
│                                                                      │
│  1. Validate inputs (50+ chars, junk detection)                     │
│  2. Call deterministic scoring algorithm                            │
│  3. Generate query embedding                                        │
│  4. Search database for similar cases                               │
│  5. Call LLM for qualitative reasoning                              │
│  6. Return comprehensive JSON response                              │
└──────────────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
                 ▼            ▼            ▼
    ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Scoring Engine   │  │ RAG Pipeline │  │   OpenAI     │
    │ (Pure Code)      │  │  (Ask.js)    │  │   API        │
    │                  │  │              │  │              │
    │ Deterministic    │  │ • Embedding  │  │ • Embedding  │
    │ 8-factor scoring │  │ • Search     │  │ • LLM        │
    │                  │  │ • Reasoning  │  │              │
    └──────────────────┘  └──────────────┘  └──────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │ Supabase Database    │
                    │ (PostgreSQL pgvector)│
                    │                      │
                    │ • Vector Search      │
                    │ • Documents Table    │
                    │ • Metadata JSONB     │
                    │ • 9 SQL Functions    │
                    └──────────────────────┘
                              │
                              ▼
                  ┌──────────────────────────┐
                  │ GreenTechGuardians Data  │
                  │ (50,000+ Embeddings)     │
                  │ Problem/Solution Pairs   │
                  └──────────────────────────┘
```

---

## Component Architecture

### Frontend Components Hierarchy

```
App.jsx (Router)
├── LandingView
│   ├── Header
│   ├── ProblemInput + InfoIconButton
│   ├── SolutionInput + InfoIconButton
│   ├── ParameterSliders
│   │   ├── SliderGroup (Access Value)
│   │   ├── SliderGroup (Embedded Value)
│   │   └── SliderGroup (Processing Value)
│   ├── ParameterSlider (×8)
│   │   └── InfoIconButton
│   └── SubmitButton
│
├── EvaluationCriteriaView
│   ├── MethodologyHeader
│   ├── ValueCategorySection (×3)
│   │   └── FactorCard (×2-3)
│   │       ├── FactorName + Weight
│   │       ├── Definition
│   │       ├── Calibration Scale (5 levels)
│   │       ├── Examples (4 cases)
│   │       └── InfoIconButton
│   └── NavigationButtons
│
└── ResultsView
    ├── ExecutiveSummaryCard
    │   ├── OverallScore (large, color-coded)
    │   ├── ConfidenceBadge
    │   └── AuditVerdict
    ├── IntegrityAnalysisSection
    │   └── GapCard (×N)
    │       ├── GapType + Severity
    │       ├── Description
    │       └── EvidenceReference
    ├── ComparativeMetricsDashboard
    │   ├── RadarChartSection
    │   ├── SubScoreCards (×8)
    │   └── CategoryAverages
    ├── EvidenceCardsSection
    │   └── EvidenceCard (×3)
    │       ├── MatchPercentage
    │       ├── SemanticTitle
    │       ├── ContentPreview
    │       ├── CategoryBadge
    │       └── ViewFullContextButton
    │           └── ContextModal (on click)
    ├── RecommendationsSection
    │   └── RecommendationCard (×4-6)
    └── NavigationButtons
```

---

## Backend Services Architecture

### Scoring Engine (scoring.js)

```
Input: {
  public_participation: 75,
  infrastructure: 65,
  market_price: 70,
  maintenance: 55,
  uniqueness: 80,
  size_efficiency: 60,
  chemical_safety: 85,
  tech_readiness: 75
}
         │
         ▼
┌──────────────────────┐
│ calculateScores()    │
│                      │
│ Weights (8 factors)  │
│ ├─ pub_part: 0.15    │
│ ├─ infra: 0.15       │
│ ├─ market: 0.20      │
│ ├─ maint: 0.10       │
│ ├─ unique: 0.10      │
│ ├─ size: 0.10        │
│ ├─ chem: 0.10        │
│ └─ tech: 0.10        │
│ (sum = 1.0)          │
└──────────────────────┘
         │
         ▼
    overall_score = 70
    confidence = 78
    sub_scores = {...}
    score_breakdown = {...}
    integrity_gaps = [...]
```

### RAG Pipeline (ask.js)

```
Input: {
  businessProblem,
  businessSolution,
  scores,
  similarDocs (from database)
}
         │
         ▼
┌────────────────────────────────┐
│ generateReasoning()            │
│                                │
│ 1. Build System Prompt         │
│    • 15+ principles            │
│    • Evidence-based analysis   │
│    • Professional tone         │
│                                │
│ 2. Build User Prompt           │
│    • Business context          │
│    • Similar cases             │
│    • Specific questions        │
│                                │
│ 3. Call GPT-4o-mini           │
│    • Structured JSON output   │
│    • Temperature: 0.3         │
│                                │
│ 4. Parse Response              │
│    • Extract fields           │
│    • Validate JSON            │
│    • Ensure evidence cited    │
└────────────────────────────────┘
         │
         ▼
Output: {
  confidence_score: 82,
  audit_verdict: "...",
  comparative_analysis: "...",
  integrity_gaps: [...],
  strengths: [...],
  technical_recommendations: [...],
  similar_cases_summaries: [...],
  key_metrics_comparison: {...}
}
```

### Vector Search (Supabase)

```
Step 1: Embed Query
┌──────────────────────────────┐
│ User's business problem      │
│ (text)                       │
│          │                   │
│          ▼                   │
│ text-embedding-3-small       │
│ (1536 dimensions)            │
│          │                   │
│          ▼                   │
│ Query vector (1536-dim)      │
└──────────────────────────────┘
         │
         ▼
Step 2: Search Database
┌──────────────────────────────┐
│ Supabase match_documents()   │
│                              │
│ SELECT documents            │
│ WHERE <embedding> is close   │
│ (using ivfflat index)        │
│                              │
│ Return top 3 matches         │
└──────────────────────────────┘
         │
         ▼
Step 3: Return Results
┌──────────────────────────────┐
│ Similar Cases:               │
│ 1. Row 42 - similarity: 0.87│
│ 2. Row 127 - similarity: 0.79│
│ 3. Row 89 - similarity: 0.73│
│                              │
│ With full content + metadata │
└──────────────────────────────┘
```

---

## Database Architecture

### Document Storage (PostgreSQL)

```
documents table:
┌─────────────────────────────────────────────────────────┐
│ id (BIGSERIAL)                                          │
│ content (TEXT)                                          │
│ embedding (VECTOR<1536>)    ← pgvector column         │
│ metadata (JSONB)                                        │
│ ├─ source_row: integer                                 │
│ ├─ chunk_type: string (primary|secondary)             │
│ ├─ category: string (Packaging, Textiles, etc.)       │
│ ├─ fields: {problem, solution, materials, ...}        │
│ ├─ chunk_id: string                                    │
│ └─ word_count: integer                                 │
│ created_at (TIMESTAMP)                                 │
│ updated_at (TIMESTAMP)                                 │
└─────────────────────────────────────────────────────────┘

Indexes:
├─ ivfflat on embedding (vector similarity, lists=100)
├─ GIN on content (text search, trgm ops)
├─ GIN on metadata (JSONB filtering)
├─ btree on created_at (timestamp sorting)
└─ btree on id (primary key)
```

### Search Functions

```
1. match_documents(vector, count, threshold)
   → SELECT id, content, metadata, similarity
   → Returns top N by cosine similarity
   → Performance: <100ms

2. search_documents_by_category(vector, category, count)
   → Filtered match_documents by metadata.category
   → Performance: <150ms

3. search_documents_hybrid(vector, keyword, count, weights)
   → Combines vector (0.7) + keyword (0.3) scoring
   → Performance: <200ms

4. get_document_statistics()
   → COUNT, categories, chunk types, avg content length
   → Performance: <50ms

5. count_documents_by_category()
   → GROUP BY metadata.category
   → Performance: <50ms
```

---

## Data Pipeline

### CSV → Embedding Flow

```
Step 1: Load Dataset
┌──────────────────────┐
│ GreenTechGuardians   │
│ AI_EarthHack_Dataset │
│ (CSV file)           │
└──────────────────────┘
         │
         ▼
Step 2: Chunk (chunk.js)
┌──────────────────────────────┐
│ 1. Parse CSV rows            │
│ 2. Preserve problem/solution │
│    pairs as primary chunks   │
│ 3. Split if >525 words       │
│    - Secondary chunks        │
│ 4. Target: 300-500 tokens    │
│    (~350 target, using       │
│     1.3 tokens/word)         │
│ 5. Add metadata              │
└──────────────────────────────┘
         │
         ▼
Output: chunks.json
┌──────────────────────────────┐
│ [                            │
│   {                          │
│     chunk_id: "row_0_p",    │
│     source_row: 0,          │
│     chunk_type: "primary",  │
│     content: "...",         │
│     metadata: {...},        │
│     word_count: 387         │
│   },                         │
│   ...                        │
│ ]                            │
└──────────────────────────────┘
         │
         ▼
Step 3: Embed (embed_and_store.js)
┌──────────────────────────────┐
│ 1. Read chunks.json          │
│ 2. Batch process (20 at a    │
│    time)                     │
│ 3. Rate limit (500ms delay)  │
│ 4. OpenAI API call           │
│    text-embedding-3-small    │
│    (1536 dimensions)         │
│ 5. Supabase insert           │
│    (100 rows/batch)          │
│ 6. Validate storage          │
└──────────────────────────────┘
         │
         ▼
Step 4: Store & Index
┌──────────────────────────────┐
│ Supabase documents table     │
│ ├─ 50,000+ embeddings       │
│ ├─ ivfflat index ready      │
│ ├─ Vector search <100ms     │
│ └─ Ready for production      │
└──────────────────────────────┘
```

---

## API Response Structure

### POST /score Response (2000+ lines)

```json
{
  "overall_score": 70,                    ← 0-100
  "confidence_level": 82,                 ← 0-100

  "sub_scores": {                         ← Echo input
    "public_participation": 75,
    "infrastructure": 65,
    // ... all 8 factors
  },

  "score_breakdown": {                    ← By category
    "access_value": 70,                   ← (15+15)/2 * weights
    "embedded_value": 71,                 ← Complex weighted avg
    "processing_value": 73                ← (10+10+10) weighted
  },

  "audit": {                              ← AI-generated
    "confidence_score": 82,               ← AI's self-confidence
    "audit_verdict": "...",               ← 2-3 sentences
    "comparative_analysis": "...",        ← vs. database cases
    "integrity_gaps": [                   ← Identified issues
      {
        "type": "Overestimation",
        "severity": "low",
        "description": "...",
        "evidence_source_id": "row_42"
      }
    ],
    "strengths": ["...", "..."],          ← Validated positives
    "technical_recommendations": ["..."], ← Actionable advice
    "similar_cases_summaries": ["..."],  ← One-liners
    "key_metrics_comparison": {           ← Benchmarks
      "market_leadership": {
        "your_score": 70,
        "similar_projects_avg": 62,
        "top_quartile": 80,
        "interpretation": "Above average..."
      }
    }
  },

  "similar_cases": [                      ← Top 3 from database
    {
      "row": 42,
      "category": "Packaging",
      "problem": "...",
      "solution": "...",
      "similarity": 0.87,
      "summary": "..."
    },
    // ... 2 more
  ],

  "processing_info": {                    ← Metadata
    "request_id": "uuid",
    "processing_time_ms": 1847,
    "vector_search_time_ms": 245,
    "llm_reasoning_time_ms": 1502,
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

---

## Performance Characteristics

### Response Times (Typical)

```
Input Validation:     10-20ms
├─ Length check
├─ Character validation
└─ Junk detection

Scoring Calculation:  5-10ms
├─ Factor validation
├─ Weighting
└─ Confidence calc

Vector Embedding:     200-400ms
├─ OpenAI API call
├─ 1536-dim embedding
└─ Network latency

Database Search:      50-150ms
├─ Query construction
├─ Vector similarity
└─ Index lookup

LLM Reasoning:        1000-1500ms
├─ Context building
├─ OpenAI API call
├─ JSON parsing
└─ Network latency

Response Assembly:    10-50ms
├─ JSON construction
├─ Field aggregation
└─ Output formatting

─────────────────────────────
TOTAL:                1300-2200ms
─────────────────────────────
```

### Scalability Limits

| Metric           | Current | Limit | Notes                               |
| ---------------- | ------- | ----- | ----------------------------------- |
| Documents        | 50k     | 500k  | Before performance degrades         |
| Request/sec      | 1       | 100   | Node.js worker pool limited         |
| Response size    | 2kb     | 10mb  | Set by middleware                   |
| Vector dims      | 1536    | 1536  | OpenAI model fixed                  |
| Search results   | 3       | 10    | Configurable, affects response time |
| Concurrent users | 10      | 1000  | With load balancing                 |

---

## Deployment Architecture (Recommended)

```
┌─────────────────────────────────┐
│   Vercel (Frontend)             │
│   ├─ React app                  │
│   ├─ Static assets              │
│   └─ Auto-deploys on git push   │
└─────────────────────────────────┘
            │
     HTTP   │
            ▼
┌─────────────────────────────────┐
│   Railway/Render (Backend)      │
│   ├─ Express server             │
│   ├─ Node.js runtime            │
│   └─ Environment variables      │
└─────────────────────────────────┘
            │
    OpenAI  │    Supabase
    API ────┤    PostgreSQL
            │
     HTTP   │
            ▼
┌─────────────────────────────────┐
│   Supabase (Database)           │
│   ├─ PostgreSQL                 │
│   ├─ pgvector                   │
│   ├─ 50k+ embeddings            │
│   └─ 50GB storage (free tier)   │
└─────────────────────────────────┘
```

---

## Security Architecture

### Authentication (Production)

```
Frontend              Backend              Supabase
  │                    │                     │
  ├─ User login ─────→ ├─ Verify JWT ─────→ │
  │                    │   ← Token issued ── │
  │                    │                     │
  ├─ Include JWT ────→ ├─ Validate ────────→ │
  │    in request      │   (middleware)      │
  │                    │                     │
  │  ← Authorized ──── ├─ Execute query ─→  │
  │    response        │   ← RLS check       │
```

### Data Security

```
.env (Never committed)
├─ OPENAI_API_KEY
├─ SUPABASE_URL
├─ SUPABASE_ANON_KEY
└─ SUPABASE_SERVICE_ROLE_KEY

Supabase RLS Policies
├─ Public read (documents table)
├─ Authenticated write (insert logs)
└─ Service role admin (maintenance)

Input Validation
├─ Length checks
├─ Junk detection
├─ SQL injection prevention
└─ Rate limiting
```

---

## Monitoring & Logging

### Backend Logging

```
┌────────────────────────────────┐
│ Express Middleware             │
│ ├─ Request ID generation       │
│ ├─ Timestamp                   │
│ ├─ Method + URL                │
│ ├─ Response status             │
│ └─ Duration                    │
└────────────────────────────────┘
         │
         ▼
    Log output:
    [2024-01-15 10:30:45.123]
    POST /score (req-1234)
    Input: valid, 87 chars problem
    Scoring: 70 (82% confidence)
    Database: 3 matches found
    LLM: 1502ms reasoning
    Response: 200 OK (1847ms total)
```

---

## File Structure Reference

```
backend/
├── api/
│   └── server.js                 ← Main API (300 lines)
│       ├── Express setup
│       ├── POST /score
│       ├── GET /health
│       └── GET /docs/methodology
│
├── src/
│   ├── scoring.js                ← Scoring (400 lines)
│   │   ├── calculateScores()
│   │   ├── calculateConfidenceLevel()
│   │   ├── identifyIntegrityGaps()
│   │   └── ... 4 more functions
│   │
│   └── ask.js                    ← RAG (350 lines)
│       ├── generateReasoning()
│       └── validateInput()
│
├── scripts/
│   ├── chunk.js                  ← Chunking (200 lines)
│   │   └── loadDataset(), createChunks(), saveChunksToFile()
│   │
│   └── embed_and_store.js        ← Embedding (250 lines)
│       ├── loadChunks()
│       ├── generateEmbeddings()
│       ├── storeInSupabase()
│       └── validateStorage()
│
├── supabase/
│   └── setup.sql                 ← Schema (300 lines)
│       ├── documents table
│       ├── 9 SQL functions
│       ├── 4 indexes
│       ├── RLS policies
│       └── Triggers
│
├── dataset/
│   └── GreenTechGuardians/
│       ├── AI_EarthHack_Dataset.csv  ← Input
│       └── chunks.json               ← Generated
│
├── .env                          ← Secrets (git-ignored)
├── .env.example                  ← Template
├── package.json                  ← Dependencies & scripts
└── node_modules/                 ← Installed packages

frontend/
├── src/
│   ├── App.jsx                   ← Main component
│   ├── App.css                   ← Styling (1110 lines)
│   │
│   ├── constants/
│   │   └── evaluationData.js     ← Guidance (400 lines)
│   │       ├── COLORS
│   │       ├── parameterGuidance (all 8 factors)
│   │       ├── scoreRanges
│   │       └── ... more exports
│   │
│   ├── utils/
│   │   └── helpers.js            ← Utilities (350 lines)
│   │       ├── getScoreColor()
│   │       ├── submitForScoring()
│   │       ├── storage object
│   │       └── ... 12 more functions
│   │
│   ├── components/               ← UI Components (TBD)
│   │   ├── ParameterSliders.jsx      (120 lines)
│   │   ├── MetricInfoModal.jsx       (100 lines)
│   │   ├── RadarChartSection.jsx     (100 lines)
│   │   ├── EvidenceCard.jsx          (70 lines)
│   │   ├── ContextModal.jsx          (100 lines)
│   │   └── InfoIconButton.jsx        (50 lines)
│   │
│   └── views/                    ← Page Views (TBD)
│       ├── LandingView.jsx           (180 lines)
│       ├── EvaluationCriteriaView.jsx (220 lines)
│       └── ResultsView.jsx           (300 lines)
│
├── package.json
└── node_modules/
```

---

**Built with ♻️ for a circular economy future**
