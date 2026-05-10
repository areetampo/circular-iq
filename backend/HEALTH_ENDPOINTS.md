# Health Check Endpoints Documentation

## Overview

The Circular Economy API includes comprehensive health monitoring endpoints that provide detailed insights into system health, dependencies, and performance metrics. The health check system is implemented in `services/health.service.js` and provides multiple levels of health verification from basic load balancer checks to detailed system diagnostics.

## Base Endpoint: `/health`

### Basic Health Check

```txt
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

```txt
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
      "timestamp": "2025-01-19T10:35:00.000Z"
    }
  }
}
```

## Dedicated Health Routes

### Database Health

```txt
GET /health/database
```

**Purpose**: Check database connectivity and performance
**Response**: Database connection status, type, and response time

### Aiven Database Health

```txt
GET /health/database/aiven
```

**Purpose**: Check Aiven PostgreSQL database connectivity and performance
**Response**: Aiven database connection status, type, and response time

### OpenAI API Health

```txt
GET /health/openai
```

**Purpose**: Check OpenAI API connectivity
**Response**: API status and response time (or disabled status if no API key)

### System Resources

```txt
GET /health/system
```

**Purpose**: Monitor system resource usage
**Response**: Memory usage, uptime, Node.js version, platform info

### Configuration Health

```txt
GET /health/config
```

**Purpose**: Validate configuration integrity
**Response**: Configuration status, environment, and any issues

### Kubernetes Probes

```txt
GET /health/readiness
GET /health/liveness
```

**Purpose**: Kubernetes orchestration support
**Response**: Application readiness and liveness status

### Version Information

```txt
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

## Uptime Monitor Integration

The health endpoints are automatically polled by the uptime monitoring system:

- **Polling Interval**: Every 30 seconds (production only)
- **Endpoints Monitored**: `/health`, `/health?detailed=true`, `/health/database`, `/health/database/aiven`, `/health/openai`, `/health/system`, `/health/config`, `/health/readiness`, `/health/liveness`, `/health/version`
- **Data Storage**: Results stored in `uptime_checks` table with 7-day retention
- **Dashboard**: Real-time visualization available at `/uptime-monitor` in frontend
- **Cleanup**: Automatic cleanup of records older than 7 days runs daily

### Monitored Metrics

- **Response Time**: Measured for each endpoint in milliseconds
- **Status**: Boolean `up` flag based on HTTP status and response validation
- **Payload**: Full JSON response stored for historical analysis
- **Endpoint Classification**:
  - `health`: Basic application health endpoint
  - `detailed`: Comprehensive health check with all subsystems
  - `database`: Database connectivity and performance
  - `database-aiven`: Aiven PostgreSQL database connectivity and performance
  - `openai`: External API connectivity
  - `system`: System resources and Node.js runtime metrics
  - `config`: Configuration validation and environment status
  - `readiness`: Kubernetes readiness probe status
  - `liveness`: Kubernetes liveness probe status
  - `version`: Build and version information

### Documentation

The uptime monitoring dashboard is fully documented in:

- `frontend/src/pages/UptimeMonitorPage/README.md` - Complete architecture, components, and usage guide

This includes detailed information about:

- Real-time dashboard components and charts
- Data aggregation and visualization
- Export functionality and metrics
- Frontend refresh intervals and state management

### Configuration

Uptime monitoring is controlled by:

- `BACKEND_CONFIG.uptime.pollingEnabled` (automatically `true` when `NODE_ENV=production`)
- `BACKEND_CONFIG.uptime.pollIntervalMs` (default: 30000ms - 30s)
- `BACKEND_CONFIG.uptime.retentionDays` (default: 7 days)
- `BACKEND_CONFIG.uptime.cleanupOnStart` (controlled by `UPTIME_CHECKS_CLEANUP_ON_START` env var, default: `true`)
- `BACKEND_CONFIG.uptime.cleanupIntervalDurationMs` (default: 86400000ms - daily)
- `BACKEND_CONFIG.uptime.endpoints` array of endpoint paths to monitor
