# API Documentation

Base URL: `http://localhost:3001`

## Conventions

- Requests and responses use JSON unless noted.
- Authentication: open in development. In production, set `API_AUTH_ENABLED=true` and `API_KEY=<secret>` to require a bearer token (Authorization: Bearer) or `X-API-Key` on all routes except `/health`.
- All timestamps are ISO 8601.

## Health

### GET /health

Returns service status.

```http
GET /health
```

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "version": "1.0.0"
}
```

## Scoring

### POST /score

Evaluate a business problem/solution pair using the 8-factor framework.

#### Request Body (/score)

```json
{
  "businessProblem": "Min 200 characters describing the problem...",
  "businessSolution": "Min 200 characters describing the solution...",
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
}
```

All parameters must be numbers between 0-100.

#### Response (/score)

```json
{
  "overall_score": 78,
  "confidence_level": 82,
  "sub_scores": { "business_viability": 74 },
  "score_breakdown": { "access": 25, "embedded": 28, "processing": 25 },
  "audit": { "audit_verdict": "promising", "findings": [] },
  "similar_cases": [],
  "metadata": { "industry": "textiles" },
  "gap_analysis": {},
  "processing_info": {
    "request_id": "abc123",
    "processing_time_ms": 1420,
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

## Assessments

### POST /assessments

Persist a completed assessment for later retrieval.

#### Request Body (/assessments)

```json
{
  "title": "Solar textile recycling",
  "businessProblem": "...",
  "businessSolution": "...",
  "sessionId": "client-session-id",
  "parameters": { "public_participation": 70 },
  "result": {
    "overall_score": 78,
    "sub_scores": { "business_viability": 74 },
    "metadata": { "industry": "textiles" },
    "audit": { "audit_verdict": "promising" }
  }
}
```

#### Response (/assessments)

```json
{
  "id": 123,
  "message": "Assessment saved successfully",
  "assessment": {
    "id": 123,
    "title": "Solar textile recycling",
    "overall_score": 78,
    "industry": "textiles",
    "result_json": { "overall_score": 78, "input_parameters": { "public_participation": 70 } }
  }
}
```

### GET /assessments

List saved assessments with pagination, search, and filters.

Query parameters:

- `sessionId` (string): Limit results to a client session.
- `page` (number, default 1): 1-based page.
- `pageSize` (number, default 20, max 100): Items per page.
- `sortBy` (created_at | overall_score | title, default created_at): Sort field.
- `order` (asc | desc, default desc): Sort direction.
- `search` (string): Case-insensitive match on title or industry.
- `industry` (string): Exact industry match.
- `createdFrom` (ISO date): created_at >= value.
- `createdTo` (ISO date): created_at <= value.
- `minScore` (number): overall_score >= value.
- `maxScore` (number): overall_score <= value.

#### Response (list)

```json
{
  "assessments": [
    {
      "id": 123,
      "title": "Solar textile recycling",
      "overall_score": 78,
      "industry": "textiles",
      "created_at": "2024-01-15T10:30:45.123Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

### GET /assessments/:id

Fetch a single assessment by id.

```http
GET /assessments/123
```

#### Response (detail)

```json
{
  "assessment": { "id": 123, "title": "Solar textile recycling", "result_json": {} }
}
```

### DELETE /assessments/:id

Delete a saved assessment.

```http
DELETE /assessments/123
```

#### Response (delete)

```json
{ "message": "Assessment deleted successfully" }
```

## Methodology

### GET /docs/methodology

Returns the 8-factor framework, weights, and descriptions used in scoring.

```http
GET /docs/methodology
```

## Analytics

### GET /analytics/market

Retrieve aggregate market data and statistics. Returns `market_data` (array) and `stats` (object or null).

```http
GET /analytics/market
```

## Error Format

Errors return HTTP 4xx/5xx with a structured body:

```json
{
  "error": "Human-readable message",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "code": "ERROR_CODE"
}
```
