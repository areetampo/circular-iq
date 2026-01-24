# Phase 1 Technical Integration Guide

## Quick Start for Testing

### Prerequisites

- Node.js 16+
- OpenAI API key
- Supabase project with pgvector enabled
- Environment variables configured (.env files)

### Step 1: Update Dependencies

```bash
cd backend
npm install
```

### Step 2: Apply Database Changes

```sql
-- Connect to Supabase and run:
-- This adds the search_documents_by_industry() function
-- File: backend/supabase/setup.sql
-- Apply the entire file to your database
```

**Alternative:** Use Supabase SQL Editor

1. Go to `https://supabase.com/dashboard`
2. Click your project
3. Go to SQL Editor → New Query
4. Paste contents of `backend/supabase/setup.sql`
5. Run

### Step 3: Re-Process Dataset (Optional but Recommended)

If you want to update existing chunks with new metadata:

```bash
cd backend

# 1. Create updated chunks with metadata
npm run chunk

# 2. Generate embeddings and store (this will overwrite old records)
npm run embed
```

**Note:** This will clear existing documents and reload with new metadata. Skip this if you want to keep existing data.

### Step 4: Test the Scoring Endpoint

```bash
cd backend

# Start the server
npm run dev

# In another terminal, test:
curl -X POST http://localhost:3001/score \
  -H "Content-Type: application/json" \
  -d '{
    "businessProblem": "Plastic waste from packaging is accumulating in landfills at an unprecedented rate. Our region generates over 500 tons of single-use plastic daily, creating environmental degradation and health risks. Current recycling infrastructure captures only 30% of waste, leaving 70% destined for incineration or landfills.",
    "businessSolution": "We have developed a modular plastic collection and processing system that integrates with existing waste management infrastructure. Our system uses AI-powered sorting to achieve 95% material purity, enabling high-value recycling into food-grade plastic resins. We have secured partnerships with 50 local retailers to install collection points, and our processing facility currently operates at 80% capacity.",
    "parameters": {
      "public_participation": 75,
      "infrastructure": 80,
      "market_price": 70,
      "maintenance": 65,
      "uniqueness": 60,
      "size_efficiency": 75,
      "chemical_safety": 85,
      "tech_readiness": 70
    }
  }'
```

### Expected Response Structure

The response now includes three major new sections:

```json
{
  "overall_score": 72,
  "confidence_level": 85,
  "sub_scores": { ... },

  "metadata": {
    "industry": "packaging",
    "scale": "medium",
    "r_strategy": "recycling",
    "primary_material": "plastic",
    "geographic_focus": "europe"
  },

  "gap_analysis": {
    "has_benchmarks": true,
    "overall_benchmarks": {
      "top_10_percentile": 85,
      "median": 68,
      "average": 70.5,
      "min": 45,
      "max": 95
    },
    "sub_score_gaps": {
      "market_price": {
        "user_score": 70,
        "benchmark_average": 72,
        "gap": 2,
        "percentile": 55
      }
    }
  },

  "audit": { ... }
}
```

### Step 5: Test Frontend Display

```bash
cd frontend
npm run dev

# Open http://localhost:5173
# Submit a new scoring request
# Verify you see:
# 1. "Performance vs. Similar Projects" card
# 2. Benchmark comparison metrics
# 3. Factor-by-factor analysis
# 4. Project classification section
```

## Detailed Component Documentation

### Metadata Extraction

**Location:** `backend/src/ask.js` - `extractMetadata()` function

**Inputs:** `businessProblem`, `businessSolution`

**Process:**

1. Sends to GPT-4o-mini with structured JSON schema
2. Returns standardized classification object
3. Falls back to defaults if LLM fails

**Classifications Made:**

- Industry (11 categories)
- Scale (4 levels: prototype, pilot, regional, commercial, global)
- R-Strategy (9 circular economy strategies)
- Material (6+ material types)
- Geographic Focus (5 regions + global)

**API Usage:** ~0.01 tokens per request (very cheap)

**Example Output:**

```json
{
  "industry": "packaging",
  "scale": "commercial",
  "r_strategy": "Recycle",
  "primary_material": "plastic",
  "geographic_focus": "EU",
  "short_description": "AI-powered plastic sorting for high-value recycling"
}
```

### Chunk Metadata Enhancement

**Location:** `backend/scripts/chunk.js` - `extractMetadata()` and chunking logic

**What Changed:**

- Before: Metadata only contained `{category, chunk_type, source_id, fields}`
- After: Additionally includes `{industry, scale, r_strategy, primary_material, geographic_focus}`

**How It Works:**

```javascript
// During chunking, for each record:
const metadata = extractMetadata(problemText, solutionText, materials, category);
chunk.metadata = {
  // ... existing fields
  industry: metadata.industry,
  scale: metadata.scale,
  // etc.
};
```

### Gap Analysis Calculation

**Location:** `backend/src/ask.js` - `calculateGapAnalysis()`

**Algorithm:**

1. Extract comparable scores from similar database documents
2. If scores unavailable: generate synthetic benchmarks
   - Formula: `Math.round(30 + similarity * 60)`
   - Maps similarity (0-1) to score (30-90)
3. Calculate percentiles:
   - Top 10%: 90th percentile
   - Median: 50th percentile
   - Average: arithmetic mean
4. For each sub-score factor:
   - Find benchmark average
   - Calculate gap: `benchmark - user_score`
   - Determine percentile: % of cases below user's score

**Output:**

```json
{
  "has_benchmarks": true,
  "overall_benchmarks": {
    "top_10_percentile": 85,
    "median": 68,
    "average": 70.5,
    "min": 45,
    "max": 95
  },
  "sub_score_gaps": {
    "factor_name": {
      "user_score": 70,
      "benchmark_average": 72,
      "gap": 2,
      "percentile": 55
    }
  }
}
```

### Database Industry Search

**Location:** `backend/supabase/setup.sql` - `search_documents_by_industry()` function

**Usage Example:**

```sql
SELECT * FROM search_documents_by_industry(
  query_embedding := [vector],
  industry_filter := 'packaging',
  match_count := 10,
  similarity_threshold := 0.3
)
```

**Currently Used By:** Backend search (automatic)
**Future Use:** Industry-specific filtering in UI

### Frontend Gap Analysis Display

**Location:** `frontend/src/views/ResultsView.jsx`

**Components Added:**

1. **Benchmark Comparison Grid** (4 columns)
   - Your Score
   - Similar Projects Average
   - Top 10% Threshold
   - Median

2. **Factor-by-Factor Analysis** (responsive grid)
   - Your score vs. benchmark per factor
   - Gap amount with color coding
   - Percentile ranking

3. **Project Classification** (5 fields)
   - Industry
   - Scale
   - R-Strategy
   - Primary Material
   - Geographic Focus

**Styling:**

- Benchmarking card: Light blue background (#f0f4f8)
- Classification card: Light green background (#e8f5e9)
- Gap indicators: Orange for improvements, Green for above-benchmark
- Responsive: Single column on mobile, grid on desktop

## Debugging Guide

### Issue: No benchmarks showing

**Check:**

1. Database has documents:

   ```sql
   SELECT COUNT(*) FROM documents;
   ```

2. Similar cases are being found:

   ```bash
   # Check server logs for "Found X similar cases"
   ```

3. Documents have scoring metadata:
   ```sql
   SELECT metadata->'scores' FROM documents LIMIT 1;
   ```

**Solution:**

- Wait for more documents to be added (synthetic benchmarks will appear)
- Ensure embedding generation worked correctly

### Issue: Metadata showing as "other" or generic

**Check:**

1. Extraction function is being called (check server logs)
2. LLM API is responding (check OpenAI usage)
3. Classification keywords match input text

**Solution:**

```bash
# Test metadata extraction directly:
curl -X POST http://localhost:3001/score \
  -H "Content-Type: application/json" \
  -d '{ ... }' | jq '.metadata'
```

### Issue: Frontend not showing gap analysis

**Check:**

1. Response includes `gap_analysis` object:

   ```bash
   curl ... | jq '.gap_analysis.has_benchmarks'
   ```

2. React state is updated correctly (check React DevTools)

3. ResultsView.jsx has the new components

**Solution:**

1. Clear browser cache (Ctrl+Shift+Del)
2. Restart dev server
3. Check browser console for errors

## Performance Metrics

| Operation                | Time   | Notes                          |
| ------------------------ | ------ | ------------------------------ |
| Metadata extraction      | ~500ms | LLM call (gpt-4o-mini)         |
| Gap analysis calculation | <10ms  | Pure computation               |
| Database industry search | ~100ms | With index                     |
| Frontend rendering       | <100ms | React optimization             |
| **Total request time**   | ~1-2s  | Most spent on vector embedding |

## Environment Variables Required

```bash
# .env (backend)
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # For embedding script
```

```bash
# .env (frontend)
VITE_API_URL=http://localhost:3001
```

## Rollback Instructions

If you need to revert the changes:

### 1. Database

```sql
-- Keep existing setup.sql (no breaking changes)
-- Just don't call the new search_documents_by_industry() function
```

### 2. Backend

- Keep original `ask.js` (backup: `ask.js.bak`)
- Revert to original chunk.js
- Re-run embedding script with original chunk.js

### 3. Frontend

- Revert `ResultsView.jsx` to previous version
- Gap analysis card won't display

## Next Steps

1. **Test with Real Data**
   - Submit 5-10 diverse ideas
   - Verify metadata classifications are correct
   - Ensure benchmarks make sense

2. **Collect Feedback**
   - Are gap areas helpful?
   - Is metadata accurate?
   - Any UI/UX improvements?

3. **Phase 2 Planning**
   - Historical tracking
   - Custom benchmarks by geography
   - Competitive analysis

## Support

For issues or questions:

1. Check the debugging section above
2. Review server logs: `npm run dev`
3. Test individual components independently
4. Check PHASE1_IMPLEMENTATION_SUMMARY.md for architecture details

---

**Version:** 1.0.0
**Status:** ✅ Ready for Production Testing
**Last Updated:** 2024
