# API Server Testing Guide

## Implementation Summary

The API server has been updated with the following changes:

### 1. **New Input Schema**
- ✅ Changed from `{ idea, parameters }` to `{ businessProblem, businessSolution, parameters }`
- ✅ Both `businessProblem` and `businessSolution` must be ≥ 200 characters
- ✅ Enhanced validation messages guide users to provide detailed input

### 2. **Enhanced Validation**
- ✅ Separate validation for problem and solution fields
- ✅ Junk input detection for both fields
- ✅ Parameters object validation
- ✅ Clear, actionable error messages

### 3. **Updated Embedding Strategy**
- ✅ Combines problem and solution: `Problem: ${businessProblem}. Solution: ${businessSolution}`
- ✅ Single embedding captures full context for similarity search

### 4. **Updated AI Integration**
- ✅ Updated `generateReasoning()` call signature:
  - Old: `generateReasoning(idea, scores, parameters, similarDocs)`
  - New: `generateReasoning(businessProblem, businessSolution, scores, parameters, similarDocs)`

### 5. **Enhanced Response Structure**
- ✅ Similar cases now include full metadata mapping:
  ```javascript
  similar_cases: [{
    id: doc.id,
    content: doc.content,
    metadata: doc.metadata || {},
    similarity: doc.similarity
  }]
  ```

### 6. **Improved Error Handling**
- ✅ Specific error messages for OpenAI failures
- ✅ Specific error messages for Supabase failures
- ✅ Generic fallback for other errors

---

## Testing Prerequisites

### Required Environment Variables

Before testing, add these to `backend/.env`:

```env
OPENAI_API_KEY=sk-...your-key...
SUPABASE_URL=https://...your-project....supabase.co
SUPABASE_ANON_KEY=...your-anon-key...
```

### Required Setup

1. **Supabase Database**: Must have `documents` table with embeddings populated
2. **Dependencies**: Run `npm install` in backend directory

---

## Running the Tests

### Start the Server

```bash
cd backend
node api/server.js
```

Expected output:
```
API running on http://localhost:3001
```

### Run Automated Tests

In a new terminal:

```bash
cd backend
node test-api.js
```

### Test Cases Covered

#### ✅ Test 1: Valid Request
- **Expected**: 200 OK
- **Validates**:
  - Problem and solution ≥ 200 chars
  - All 8 parameters provided
  - Response includes all required fields

#### ✅ Test 2: Short Business Problem
- **Expected**: 400 Bad Request
- **Validates**: Problem length validation

#### ✅ Test 3: Short Business Solution
- **Expected**: 400 Bad Request
- **Validates**: Solution length validation

#### ✅ Test 4: Missing Parameters
- **Expected**: 400 Bad Request
- **Validates**: Parameters object validation

---

## Manual Testing with cURL

### Valid Request Example

```bash
curl -X POST http://localhost:3001/score \
  -H "Content-Type: application/json" \
  -d '{
    "businessProblem": "Single-use plastic packaging creates approximately 8 million tons of ocean waste annually, harming marine ecosystems and entering the food chain. Current recycling infrastructure only processes 9% of plastic waste, leaving the majority in landfills or the environment. The packaging industry lacks economically viable alternatives that maintain product freshness while being truly biodegradable.",
    "businessSolution": "We produce compostable food packaging from agricultural hemp waste using a hub-and-spoke collection model. Our packaging decomposes within 90 days in commercial composting facilities, returning nutrients to soil. We partner with organic farms to source hemp byproducts, creating a closed-loop system where packaging becomes soil amendment for future crops. Our material maintains barrier properties equivalent to conventional plastics while costing 15% less due to waste stream sourcing.",
    "parameters": {
      "public_participation": 75,
      "infrastructure": 60,
      "market_price": 70,
      "maintenance": 80,
      "uniqueness": 85,
      "size_efficiency": 65,
      "chemical_safety": 90,
      "tech_readiness": 70
    }
  }'
```

### Expected Response Structure

```json
{
  "overall_score": 72,
  "sub_scores": {
    "public_participation": 75,
    "infrastructure": 60,
    "market_price": 70,
    "maintenance": 80,
    "uniqueness": 85,
    "size_efficiency": 65,
    "chemical_safety": 90,
    "tech_readiness": 70
  },
  "audit": {
    "confidence_score": 85,
    "is_junk_input": false,
    "audit_verdict": "...",
    "comparative_analysis": "...",
    "integrity_gaps": [
      {
        "issue": "...",
        "evidence_source_id": 123,
        "severity": "medium"
      }
    ],
    "strengths": [
      {
        "aspect": "...",
        "evidence_source_id": 456
      }
    ],
    "technical_recommendations": ["...", "..."],
    "similar_cases_summaries": ["...", "...", "..."],
    "key_metrics_comparison": {
      "market_readiness": "...",
      "scalability": "...",
      "economic_viability": "..."
    }
  },
  "similar_cases": [
    {
      "id": 123,
      "content": "Problem: ... Solution: ...",
      "metadata": {
        "category": "packaging",
        "source_id": "GTG_001"
      },
      "similarity": 0.87
    }
  ]
}
```

---

## Validation Checklist

After running tests, verify:

- [ ] **Input Validation**: 400 errors for inputs < 200 characters
- [ ] **Response Structure**: All fields present in 200 response
- [ ] **Sub-scores**: Exactly 8 factors, all numbers 0-100
- [ ] **Overall Score**: Weighted average matches specification
- [ ] **Audit Fields**: All new fields populated (integrity_gaps, strengths, key_metrics_comparison)
- [ ] **Similar Cases**: Include id, content, metadata, similarity
- [ ] **Metadata**: Each similar case has metadata object (can be empty {})
- [ ] **Error Messages**: Clear and actionable
- [ ] **Logging**: Console shows response structure for debugging

---

## Troubleshooting

### Error: "Missing required parameters for evaluation"
- Ensure parameters object is included in request body
- All 8 factors must be present

### Error: "AI service temporarily unavailable"
- Check OPENAI_API_KEY in .env
- Verify API key is valid and has credits

### Error: "Database service temporarily unavailable"
- Check SUPABASE_URL and SUPABASE_ANON_KEY in .env
- Verify Supabase project is active
- Ensure match_documents function exists

### Empty similar_cases array
- Database may not have embeddings yet
- Run `node scripts/embed_and_store.js` to populate
- Check documents table has data: `SELECT COUNT(*) FROM documents;`

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark "API Server Updates" step complete in plan.md
2. Move to Phase 3: Frontend Architecture
3. Update frontend to use new API schema
4. Build components to display new audit fields

---

## Changes Made to Files

### `backend/api/server.js`
- Updated input destructuring: `{ businessProblem, businessSolution, parameters }`
- Changed validation to require ≥ 200 chars for both fields
- Combined problem + solution for embedding
- Updated `generateReasoning()` call with new signature
- Enhanced similar_cases response to include metadata
- Improved error handling with specific messages

### `backend/package.json`
- Added `node-fetch@^3.3.2` for testing

### `backend/test-api.js` (NEW)
- Automated test suite for all validation scenarios
- Response structure verification
- Error handling tests
