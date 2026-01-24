# Backend API Documentation

Complete reference for the Circular Economy Business Auditor API.

---

## 📋 Overview

The backend is a Node.js + Express API that:

1. **Scores** business ideas using deterministic 8-factor algorithm
2. **Searches** similar cases using vector embeddings
3. **Reasons** about evaluations using RAG with GPT-4o-mini
4. **Returns** comprehensive JSON with scores, gaps, and recommendations

**Base URL**: `http://localhost:3001` (development)

---

## 🔌 Endpoints

### 1. POST /score

**Main evaluation endpoint** - Score a business idea and receive comprehensive audit.

#### Request

```http
POST http://localhost:3001/score
Content-Type: application/json

{
  "businessProblem": "string",          # Problem description (50+ chars)
  "businessSolution": "string",          # Solution description (50+ chars)
  "parameters": {                        # All 8 required
    "public_participation": number,      # 0-100
    "infrastructure": number,            # 0-100
    "market_price": number,              # 0-100
    "maintenance": number,               # 0-100
    "uniqueness": number,                # 0-100
    "size_efficiency": number,           # 0-100
    "chemical_safety": number,           # 0-100
    "tech_readiness": number             # 0-100
  }
}
```

#### Request Examples

**Minimal Request** (50 character minimum):

```json
{
  "businessProblem": "We have excess plastic packaging from our manufacturing process",
  "businessSolution": "We will collect and repurpose the plastic into consumer products",
  "parameters": {
    "public_participation": 50,
    "infrastructure": 50,
    "market_price": 50,
    "maintenance": 50,
    "uniqueness": 50,
    "size_efficiency": 50,
    "chemical_safety": 50,
    "tech_readiness": 50
  }
}
```

**Full Request** (with specific scores):

```json
{
  "businessProblem": "Single-use textiles create enormous landfill waste. Most charitable donations are not recyclable due to synthetic fiber contamination. Current sorting is manual and unreliable.",
  "businessSolution": "We developed an AI-powered sorting system that identifies fiber composition using spectroscopy. Automatically separates natural from synthetic at 95% accuracy. Reduces manual labor by 80%.",
  "parameters": {
    "public_participation": 75,
    "infrastructure": 65,
    "market_price": 70,
    "maintenance": 55,
    "uniqueness": 80,
    "size_efficiency": 60,
    "chemical_safety": 85,
    "tech_readiness": 75
  }
}
```

#### Response (Success)

```json
{
  "overall_score": 70,
  "confidence_level": 82,
  "sub_scores": {
    "public_participation": 75,
    "infrastructure": 65,
    "market_price": 70,
    "maintenance": 55,
    "uniqueness": 80,
    "size_efficiency": 60,
    "chemical_safety": 85,
    "tech_readiness": 75
  },
  "score_breakdown": {
    "access_value": 70,           # (public_participation + infrastructure) / 2
    "embedded_value": 71,         # Weighted: market_price*0.5 + maintenance*0.25 + uniqueness*0.25
    "processing_value": 73        # Weighted: size_efficiency + chemical_safety + tech_readiness
  },
  "audit": {
    "confidence_score": 82,
    "audit_verdict": "This textile sorting initiative demonstrates strong circular economy principles with particularly strong technical innovation. The AI-powered sorting system addresses a real market need, though market price realization remains uncertain.",
    "comparative_analysis": "Compared to similar waste management projects in the database, this idea shows above-average uniqueness and chemical safety protocols. Most similar projects achieved 65-72 overall scores; this one projects 70.",
    "integrity_gaps": [
      {
        "type": "Potential Underestimation",
        "severity": "low",
        "description": "Infrastructure score (65) may be conservative. AI sorting requires power supply and minimal infrastructure—most facilities have this already.",
        "evidence_source_id": "row_12_recycling_facility",
        "recommendation": "Consider infrastructure 70-75 if facility already has power and drainage"
      }
    ],
    "strengths": [
      "Uniqueness (80): AI-powered sorting is genuinely novel in the textile space",
      "Tech Readiness (75): Spectroscopy is proven technology; integration is the challenge",
      "Chemical Safety (85): Excellent safety protocols reduce environmental risk"
    ],
    "technical_recommendations": [
      "Conduct pilot with 3 textile facilities to validate 95% accuracy claim",
      "Develop clear ROI model showing payback within 3-5 years",
      "Create supply agreement with apparel manufacturers for material off-take",
      "Document energy consumption per kg of sorted material"
    ],
    "similar_cases_summaries": [
      "Row 42 (Municipal E-waste Sort): Similar AI sorting approach, achieved 68 overall score with 5-year ROI",
      "Row 127 (Synthetic Fiber Recycler): Market leader with 72 score, focuses on one fiber type rather than sorting",
      "Row 89 (Textile Collection Network): 65 score, manual sorting; your automation is competitive advantage"
    ],
    "key_metrics_comparison": {
      "market_leadership": {
        "your_score": 70,
        "similar_projects_avg": 62,
        "top_quartile": 80,
        "interpretation": "Above average but room for growth"
      },
      "technical_feasibility": {
        "your_score": 75,
        "similar_projects_avg": 68,
        "top_quartile": 85,
        "interpretation": "Strong technical foundation"
      },
      "accessibility": {
        "your_score": 70,
        "similar_projects_avg": 65,
        "top_quartile": 80,
        "interpretation": "Accessible to medium-large facilities"
      }
    }
  },
  "similar_cases": [
    {
      "row": 42,
      "category": "Waste Management",
      "problem": "Electronic waste sorting requires manual labor...",
      "solution": "AI-powered computer vision system sorts circuit boards...",
      "similarity": 0.87,
      "summary": "AI sorting of e-waste with 92% accuracy, reduced labor costs 75%"
    },
    {
      "row": 127,
      "category": "Textiles",
      "problem": "Synthetic fibers mixed with natural textiles...",
      "solution": "Specialized sorting facility using mechanical separation...",
      "similarity": 0.79,
      "summary": "Manual sorting with focus on polyester recovery, established supply chain"
    },
    {
      "row": 89,
      "category": "Textiles",
      "problem": "Need to collect used clothing from consumers...",
      "solution": "Community drop-off network with volunteer sorting...",
      "similarity": 0.73,
      "summary": "Community-based collection model with human-powered sorting"
    }
  ],
  "processing_info": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "processing_time_ms": 1847,
    "timestamp": "2024-01-15T10:30:45.123Z",
    "vector_search_time_ms": 245,
    "llm_reasoning_time_ms": 1502
  }
}
```

#### Response Fields Explanation

| Field                             | Type   | Description                                    |
| --------------------------------- | ------ | ---------------------------------------------- |
| `overall_score`                   | number | 0-100, weighted average of all 8 parameters    |
| `confidence_level`                | number | 0-100, how confident AI is in the assessment   |
| `sub_scores`                      | object | The 8 individual factor scores (echo of input) |
| `score_breakdown`                 | object | Aggregated scores by value category            |
| `audit`                           | object | AI-generated analysis                          |
| `audit.confidence_score`          | number | AI's self-assessed confidence                  |
| `audit.audit_verdict`             | string | 2-3 sentence overall assessment                |
| `audit.comparative_analysis`      | string | How it compares to database cases              |
| `audit.integrity_gaps`            | array  | Potential scoring inconsistencies              |
| `audit.strengths`                 | array  | Validated strengths                            |
| `audit.technical_recommendations` | array  | Actionable improvements                        |
| `audit.similar_cases_summaries`   | array  | One-liner relevance explanations               |
| `audit.key_metrics_comparison`    | object | Benchmark comparisons                          |
| `similar_cases`                   | array  | Top 3 database matches                         |
| `processing_info`                 | object | Performance metrics                            |

#### Response Codes

| Code | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| 200  | Success - Evaluation complete                                  |
| 400  | Bad Request - Missing/invalid parameters                       |
| 422  | Unprocessable Entity - Input validation failed (junk detected) |
| 500  | Server Error - Internal error (check logs)                     |
| 503  | Service Unavailable - OpenAI/Supabase not responding           |

#### Error Responses

**400 - Missing Required Field**:

```json
{
  "error": "Missing required fields: parameters.public_participation",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "code": "VALIDATION_ERROR"
}
```

**422 - Input Too Short**:

```json
{
  "error": "Business problem must be at least 50 characters",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "code": "INPUT_VALIDATION_ERROR"
}
```

**422 - Junk Input Detected**:

```json
{
  "error": "Input appears to be junk/test data. Please provide genuine business descriptions.",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "code": "JUNK_INPUT_DETECTED"
}
```

**500 - Server Error**:

```json
{
  "error": "Failed to generate reasoning: OpenAI API unavailable",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "code": "INTERNAL_SERVER_ERROR",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 2. GET /health

**Server health check** - Verify API is running and all dependencies are available.

#### Request

```http
GET http://localhost:3001/health
```

#### Response (Success)

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "checks": {
    "server": "ok",
    "supabase": "ok",
    "openai": "ok",
    "database": "ok"
  }
}
```

#### Response (Partial Failure)

```json
{
  "status": "degraded",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "checks": {
    "server": "ok",
    "supabase": "ok",
    "openai": "warning - rate limit approaching",
    "database": "ok"
  }
}
```

---

### 3. GET /docs/methodology

**Framework documentation** - Retrieve complete 8-factor methodology.

#### Request

```http
GET http://localhost:3001/docs/methodology
```

#### Response

```json
{
  "title": "8-Factor Circular Economy Evaluation Framework",
  "description": "Comprehensive methodology for evaluating circular economy business ideas...",
  "factors": {
    "access_value": {
      "weight": 0.3,
      "factors": [
        {
          "name": "public_participation",
          "weight": 0.15,
          "definition": "How easily can stakeholders engage...",
          "scale": [
            { "score": 90, "label": "Universal Access" },
            { "score": 75, "label": "Wide Accessibility" }
            // ... etc
          ]
        }
        // ... infrastructure
      ]
    },
    "embedded_value": {
      "weight": 0.4,
      "factors": [
        // ... market_price, maintenance, uniqueness
      ]
    },
    "processing_value": {
      "weight": 0.3,
      "factors": [
        // ... size_efficiency, chemical_safety, tech_readiness
      ]
    }
  },
  "scoring_formula": "overall_score = sum(factor_score * factor_weight)",
  "confidence_calculation": "Based on variance of factor consistency",
  "example": {
    "parameters": {
      /* all 8 factors */
    },
    "overall_score": 67,
    "breakdown": {
      /* by category */
    }
  }
}
```

---

## 🔐 Authentication & Security

### Current Setup (Development)

- No authentication required for development
- CORS enabled for `http://localhost:*`

### Production Setup (Recommended)

1. **API Key Authentication**:

   ```http
   POST /score
   Authorization: Bearer YOUR_API_KEY
   ```

2. **Rate Limiting**:
   - 100 requests/hour per IP
   - 10 requests/minute per API key

3. **CORS Configuration**:
   ```javascript
   cors({
     origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
     credentials: true,
   });
   ```

---

## 📊 Data Formats

### Parameter Ranges

All 8 parameters must be between 0-100:

| Parameter            | Range | Unit  |
| -------------------- | ----- | ----- |
| public_participation | 0-100 | Score |
| infrastructure       | 0-100 | Score |
| market_price         | 0-100 | Score |
| maintenance          | 0-100 | Score |
| uniqueness           | 0-100 | Score |
| size_efficiency      | 0-100 | Score |
| chemical_safety      | 0-100 | Score |
| tech_readiness       | 0-100 | Score |

### Score Interpretation

| Range  | Label    | Color             | Interpretation               |
| ------ | -------- | ----------------- | ---------------------------- |
| 75-100 | Strong   | #34a83a (Emerald) | Excellent circular potential |
| 50-74  | Moderate | #4a90e2 (Blue)    | Viable with improvements     |
| 25-49  | Weak     | #ff9800 (Orange)  | Significant gaps remain      |
| 0-24   | Critical | #d32f2f (Red)     | Major concerns to address    |

### Confidence Levels

| Range  | Label    | Meaning                                 |
| ------ | -------- | --------------------------------------- |
| 75-100 | High     | Consistent assessment, reliable scoring |
| 50-74  | Moderate | Some variance, but generally sound      |
| 0-49   | Low      | Large inconsistencies or uncertainty    |

---

## 🔄 Integration Examples

### Python

```python
import requests
import json

url = "http://localhost:3001/score"

payload = {
    "businessProblem": "Single-use plastics create landfill waste...",
    "businessSolution": "We collect and repurpose plastic...",
    "parameters": {
        "public_participation": 75,
        "infrastructure": 60,
        "market_price": 55,
        "maintenance": 70,
        "uniqueness": 65,
        "size_efficiency": 60,
        "chemical_safety": 80,
        "tech_readiness": 70
    }
}

response = requests.post(url, json=payload)
data = response.json()

print(f"Overall Score: {data['overall_score']}")
print(f"Confidence: {data['confidence_level']}%")
print(f"Verdict: {data['audit']['audit_verdict']}")
```

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const url = 'http://localhost:3001/score';
const payload = {
  businessProblem: 'Single-use plastics create landfill waste...',
  businessSolution: 'We collect and repurpose plastic...',
  parameters: {
    public_participation: 75,
    infrastructure: 60,
    market_price: 55,
    maintenance: 70,
    uniqueness: 65,
    size_efficiency: 60,
    chemical_safety: 80,
    tech_readiness: 70,
  },
};

axios
  .post(url, payload)
  .then((response) => {
    const { overall_score, confidence_level, audit } = response.data;
    console.log(`Score: ${overall_score}, Confidence: ${confidence_level}%`);
    console.log(`Verdict: ${audit.audit_verdict}`);
  })
  .catch((error) => console.error('Error:', error.message));
```

### cURL

```bash
curl -X POST http://localhost:3001/score \
  -H "Content-Type: application/json" \
  -d '{
    "businessProblem": "Single-use plastics create landfill waste",
    "businessSolution": "We collect and repurpose plastic",
    "parameters": {
      "public_participation": 75,
      "infrastructure": 60,
      "market_price": 55,
      "maintenance": 70,
      "uniqueness": 65,
      "size_efficiency": 60,
      "chemical_safety": 80,
      "tech_readiness": 70
    }
  }'
```

---

## 📈 Performance Characteristics

### Typical Response Times

| Operation            | Time            |
| -------------------- | --------------- |
| Input validation     | 10ms            |
| Embedding generation | 200-300ms       |
| Vector search        | 100-200ms       |
| LLM reasoning        | 1000-1500ms     |
| **Total**            | **1300-2200ms** |

### Database Queries

- **Vector search**: Uses pgvector ivfflat index (~40 operations)
- **Metadata lookup**: Direct table scan with WHERE clause
- **Cache**: None (fresh every request)

### Limitations

- Max request size: 10MB
- Max problem/solution length: 4000 characters each
- Max batch size: 1 request at a time
- Concurrent requests: Queued (depends on Node.js worker pool)

---

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3001/health
```

### Full Evaluation

```bash
curl -X POST http://localhost:3001/score \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "businessProblem": "Test problem with enough characters to pass validation here",
  "businessSolution": "Test solution with enough characters to pass validation here",
  "parameters": {
    "public_participation": 65,
    "infrastructure": 60,
    "market_price": 70,
    "maintenance": 55,
    "uniqueness": 75,
    "size_efficiency": 65,
    "chemical_safety": 80,
    "tech_readiness": 70
  }
}
EOF
```

### Test All Parameters

```bash
# All parameters at minimum (0)
curl -X POST http://localhost:3001/score \
  -H "Content-Type: application/json" \
  -d '{
    "businessProblem": "Minimally viable problem description with enough words",
    "businessSolution": "Minimally viable solution description with enough words",
    "parameters": {
      "public_participation": 0,
      "infrastructure": 0,
      "market_price": 0,
      "maintenance": 0,
      "uniqueness": 0,
      "size_efficiency": 0,
      "chemical_safety": 0,
      "tech_readiness": 0
    }
  }'
```

---

## 📝 Logging

### Log Levels

Set via `LOG_LEVEL` environment variable:

- `debug`: All requests, parameters, processing steps
- `info`: Key milestones, results (default)
- `warn`: Warnings, degraded performance
- `error`: Errors only

### Example Debug Output

```
[2024-01-15 10:30:45] POST /score (req-id: 550e8400)
  Input validation: PASS
  Problem length: 87 chars
  Solution length: 142 chars
  Generating embedding...
  Embedding time: 245ms
  Searching database for similar cases...
  Found 3 matches: 0.87, 0.79, 0.73
  Calling LLM for reasoning...
  LLM reasoning time: 1502ms
  Response complete: 1847ms total
```

---

## 🆘 Troubleshooting

### "OPENAI_API_KEY is not defined"

- Verify `.env` file exists
- Check key is not empty: `grep OPENAI_API_KEY .env`
- Restart server after changing `.env`

### "Failed to connect to Supabase"

- Verify `SUPABASE_URL` and keys are correct
- Check Supabase project is active
- Verify setup.sql was executed

### "Timeout: Vector search took >10s"

- Check database size: `SELECT COUNT(*) FROM documents;`
- If >1M documents, increase connection pool
- Consider archiving old data

### "LLM returning invalid JSON"

- Check OpenAI API status
- Verify model name is correct (gpt-4o-mini)
- Check prompt formatting in ask.js

---

## 📞 Support

For API issues:

1. Check error message and code
2. Verify request format matches documentation
3. Check backend logs: `tail -f backend/api/server.js`
4. Test with health endpoint: `GET /health`
5. Review troubleshooting section above

---

**Built with ♻️ for a circular economy future**
