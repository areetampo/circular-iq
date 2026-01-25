# Architecture Overview

High-level system design and technical decisions.

---

## 🏗️ System Architecture

```
┌─────────────────┐
│  React Frontend │ (Vite, Router, Tailwind)
│   - LandingView │
│  - ResultsView  │
│  - HistoryView  │
│ComparisonView   │
└────────┬────────┘
         │
    HTTP API
         │
┌────────▼────────┐
│ Express Backend │ (Node.js)
│ - /assess       │
│ - /assessments  │
│ - /embeddings   │
│ - /similar      │
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    │          │              │
┌───▼──┐  ┌───▼──┐      ┌───▼──┐
│OpenAI│  │Supabase      │Test  │
│API   │  │+ pgvector    │Cases │
└──────┘  └───────┘      └──────┘
```

---

## 🎯 Core Design Decisions

### 1. Deterministic Scoring

- All numeric scores calculated via algorithms
- Ensures reproducibility and explainability
- LLM only contextualizes results
- No AI bias in scoring logic

### 2. RAG Architecture

- Semantic search over 1,108 project embeddings
- OpenAI ada-002 for embeddings
- Supabase pgvector for efficient similarity search
- Threshold-based filtering for relevance

### 3. Two-Field Input System

- **Problem** (200+ chars): Environmental/circular economy challenge
- **Solution** (200+ chars): How business addresses it
- Encourages detailed, structured thinking
- Better semantic search quality

### 4. 8 Evaluation Parameters

| Parameter            | Focus                 |
| -------------------- | --------------------- |
| Public Participation | Community engagement  |
| Infrastructure       | Resource availability |
| Market Price         | Economic viability    |
| Maintenance          | Lifecycle support     |
| Uniqueness           | Material value        |
| Size Efficiency      | Physical handling     |
| Chemical Safety      | Environmental risk    |
| Tech Readiness       | Technology complexity |

---

## 🔄 Data Flow

### Assessment Workflow

1. User inputs problem + solution
2. Optional: adjust 8 parameters (1-100 scale)
3. Backend receives request
4. Scoring engine calculates sub-scores
5. Semantic search finds 5-10 similar projects
6. LLM analyzes gaps and strengths
7. Results formatted with evidence
8. Frontend displays charts + insights

### Comparison Workflow

1. User selects 2 saved assessments
2. Navigate to /compare/:id1/:id2
3. Load both assessment results
4. Render side-by-side:
   - Radar chart comparison
   - Bar charts for parameters
   - Similarity metrics
5. Highlight differences

### Market Analysis

1. User views competitive landscape
2. Semantic search finds similar projects
3. Filter by scale/industry
4. Visualize as scatter plot
5. Show benchmark metrics

---

## 📊 Database Schema

### Assessments Table

```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  industry VARCHAR,
  overall_score INTEGER,
  result_json JSONB,  -- Full result payload
  created_at TIMESTAMP
);
```

### Embeddings Table

```sql
CREATE TABLE embeddings (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI ada-002
  metadata JSONB,  -- Project metadata
  created_at TIMESTAMP
);

CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## 🔐 Security & Privacy

### Data Handling

- Assessment data stored per session (no cross-session access)
- No personal information collected
- API keys stored in backend .env (never exposed)
- Supabase RLS policies for row-level security

### API Design

- CORS configured for frontend origin
- Rate limiting on assessment endpoint
- Input validation on all endpoints
- Error responses don't leak sensitive info

---

## ⚡ Performance Optimizations

### Frontend

- Code splitting with lazy loading (React.lazy)
- Vite for fast HMR during development
- Chart components memoized to prevent re-renders
- Custom scrollbar styling (native, no JS overhead)
- Tailwind for minimal CSS payload

### Backend

- Connection pooling for database
- Caching common queries
- Vector search with appropriate indexing
- Async/await for non-blocking I/O

### Data

- Embeddings pre-computed offline
- Batch processing for bulk queries
- Efficient vector search with cosine similarity

---

## 🔄 State Management

### Frontend

- React Hooks (useState, useEffect, useContext)
- Custom hooks for API calls and storage
- Local state for form inputs
- Session storage for temporary data
- URL params for persistent routing state

### Backend

- Stateless Express handlers
- Database as source of truth
- Cached embeddings in vector DB
- Session-based assessment isolation

---

## 🚀 Deployment Architecture

### Frontend Deployment

- Build: Vite produces optimized bundle
- Hosting: Static file hosting (Vercel, Netlify)
- Environment: Runtime env vars injected
- CDN: Automatic via hosting platform

### Backend Deployment

- Container: Node.js runtime
- Database: Managed Supabase (PostgreSQL)
- APIs: OpenAI (requires API key)
- Scaling: Serverless or containerized

---

## 📈 Scalability Considerations

### Current Limitations

- 1,108 embeddings (manageable with pgvector)
- Assessment history per session only
- No multi-user collaboration

### Future Scaling

- Add user accounts for cross-session access
- Implement assessment sharing/collaboration
- Expand embedding corpus as needed
- Add caching layer (Redis) for popular queries
- Implement search result pagination

---

## 🔧 Technology Choices & Rationale

| Technology   | Why                                  |
| ------------ | ------------------------------------ |
| React + Vite | Fast dev cycle, excellent DX         |
| React Router | Full-page routing without complexity |
| Tailwind CSS | Rapid UI development, consistency    |
| Recharts     | Lightweight, composable charts       |
| Supabase     | Managed PostgreSQL + vector support  |
| OpenAI API   | Best embedding & LLM quality         |
| Express.js   | Lightweight, flexible backend        |
| Node.js      | JavaScript full-stack development    |

---

## 🧪 Testing Strategy

### Unit Tests

- API endpoint handlers
- Scoring algorithm calculations
- Utility functions

### Integration Tests

- Full assessment workflow
- Database operations
- API response validation

### E2E Tests

- Complete user workflows
- Multi-page navigation
- Chart rendering

---

## 📝 Documentation Structure

- **DEVELOPMENT.md** - Setup and development workflow
- **ARCHITECTURE.md** - This file, system design
- **API_DOCUMENTATION.md** - API endpoint reference
- **Database Layer** - Schema and migrations
- **README.md** - Project overview
