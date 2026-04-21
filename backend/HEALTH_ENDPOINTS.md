# Health Check Endpoints Documentation

## Overview

The Circular Economy API now includes comprehensive health monitoring endpoints that provide detailed insights into system health, dependencies, and performance metrics.

## Base Endpoint: `/health`

### Basic Health Check

```
GET /health
```

**Purpose**: Load balancer health check (minimal response)
**Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-01-19T10:35:00.000Z"
}
```

**HTTP Status**: `200` for healthy, `503` for unhealthy

### Detailed Health Check

```
GET /health?detailed=true
GET /health?detailed=true&checks=database,openai
```

**Purpose**: Comprehensive system health monitoring
**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-01-19T10:35:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "responseTime": "245ms",
  "checks": {
    "database": {
      "status": "healthy",
      "type": "supabase",
      "responseTime": "45ms",
      "timestamp": "2025-01-19T10:35:00.000Z"
    },
    "openai": {
      "status": "healthy",
      "responseTime": "180ms",
      "timestamp": "2025-01-19T10:35:00.000Z"
    },
    "system": {
      "uptime": "3600s",
      "memory": {
        "used": "128MB",
        "total": "256MB",
        "external": "32MB",
        "rss": "192MB"
      },
      "nodeVersion": "v20.0.0",
      "platform": "linux",
      "timestamp": "2025-01-19T10:35:00.000Z"
    },
    "configuration": {
      "status": "healthy",
      "environment": "production",
      "apiAuthEnabled": true,
      "publicRoutes": ["/health", "/api/score", "/api/score/stream", "/api/assessments/public"],
      "timestamp": "2025-01-19T10:35:00.000Z"
    }
  }
}
```

## Dedicated Health Routes

### Database Health

```
GET /health/database
```

**Purpose**: Check database connectivity and performance
**Response**: Database connection status, type, and response time

### OpenAI API Health

```
GET /health/openai
```

**Purpose**: Check OpenAI API connectivity
**Response**: API status and response time (or disabled status if no API key)

### System Resources

```
GET /health/system
```

**Purpose**: Monitor system resource usage
**Response**: Memory usage, uptime, Node.js version, platform info

### Configuration Health

```
GET /health/config
```

**Purpose**: Validate configuration integrity
**Response**: Configuration status, environment, and any issues

### Kubernetes Probes

```
GET /health/readiness
GET /health/liveness
```

**Purpose**: Kubernetes orchestration support
**Response**: Application readiness and liveness status

### Version Information

```
GET /health/version
```

**Purpose**: Build and version information
**Response**: Version, name, environment, Node.js version

## Health Status Values

- **healthy**: All systems operational
- **degraded**: Some services have issues but core functionality works
- **unhealthy**: Critical services are down
- **disabled**: Service is intentionally disabled (e.g., no OpenAI API key)
- **error**: Health check failed to execute

## HTTP Status Codes

- **200**: Service is healthy or ready
- **503**: Service is unhealthy or not ready
- **500**: Internal error during health check

## Usage Examples

### Load Balancer Configuration

```bash
# Basic health check for load balancers
curl -f http://localhost:3000/health || exit 1
```

### Monitoring Script

```bash
# Detailed health check
curl http://localhost:3000/health/detailed | jq '.status'
```

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Kubernetes Readiness Probe

```yaml
readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Performance Considerations

- Basic `/health` endpoint responds within 10ms
- Detailed health checks complete within 500ms
- Database checks use lightweight queries
- OpenAI checks have 5-second timeout
- All endpoints are public (no authentication required)

## Monitoring Integration

The health endpoints are designed to work with:

- Load balancers (AWS ALB, Nginx, etc.)
- Container orchestrators (Kubernetes, Docker Swarm)
- Monitoring systems (Prometheus, DataDog, New Relic)
- Alerting systems (PagerDuty, OpsGenie)

## Security Notes

- All health endpoints are publicly accessible
- No sensitive information is exposed
- API keys and secrets are masked in responses
- Configuration checks only validate presence, not values
