/**
 * Aggregate checks into 5‑minute buckets for the last 24h (288 columns)
 * Returns array of { timeLabel, anyFailure, hasData, averageMs }
 * timeLabel format: "HH:MM" (24h, e.g. "14:30")
 */
export function getLast24hStatus5min(history, endpoints) {
  const now = Date.now();
  const buckets = [];
  const totalBuckets = 24 * 12; // 24h * 12 (5-min intervals)

  for (let i = totalBuckets - 1; i >= 0; i--) {
    const bucketStart = now - (i + 1) * 5 * 60 * 1000;
    const bucketEnd = now - i * 5 * 60 * 1000;
    let anyFailure = false;
    let hasData = false;
    let totalMs = 0;
    let count = 0;

    for (const ep of endpoints) {
      const checks = history[ep.id] || [];
      const checksInBucket = checks.filter((c) => c.ts >= bucketStart && c.ts < bucketEnd);
      if (checksInBucket.some((c) => !c.up)) anyFailure = true;
      if (checksInBucket.length > 0) hasData = true;
      const avgMs =
        checksInBucket.reduce((sum, c) => sum + (c.ms || 0), 0) / (checksInBucket.length || 1);
      if (checksInBucket.length > 0) {
        totalMs += avgMs;
        count++;
      }
    }

    const date = new Date(bucketStart);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeLabel = `${hours}:${minutes}`;

    buckets.push({
      timeLabel,
      anyFailure: hasData && anyFailure, // only mark failure if there is data and a failure occurred
      hasData,
      averageMs: count ? Math.round(totalMs / count) : null,
    });
  }
  return buckets;
}

/**
 * Compute overall uptime percentage over time (daily buckets)
 * Returns array of { dayLabel, uptimePct }
 */
export function getUptimeOverTime(history, endpoints) {
  const checksByDay = new Map();
  for (const ep of endpoints) {
    const checks = history[ep.id] || [];
    for (const check of checks) {
      const day = new Date(check.ts).toISOString().slice(0, 10);
      if (!checksByDay.has(day)) checksByDay.set(day, []);
      checksByDay.get(day).push(check);
    }
  }
  const sortedDays = Array.from(checksByDay.keys()).sort();
  return sortedDays.map((day) => {
    const dayChecks = checksByDay.get(day);
    const upCount = dayChecks.filter((c) => c.up).length;
    const pct = dayChecks.length ? (upCount / dayChecks.length) * 100 : 100;
    return { dayLabel: day, uptimePct: Math.round(pct) };
  });
}

/**
 * Health distribution: count of endpoints with healthy/degraded/unhealthy/noData based on latest check
 */
export function getHealthDistribution(history, endpoints) {
  let healthy = 0,
    degraded = 0,
    unhealthy = 0,
    noData = 0;

  for (const ep of endpoints) {
    const checks = history[ep.id] || [];
    if (!checks.length) {
      noData++;
      continue;
    }
    const latest = checks[checks.length - 1];
    if (!latest.up) unhealthy++;
    else {
      const pct = (checks.filter((c) => c.up).length / checks.length) * 100;
      if (pct >= 99) healthy++;
      else if (pct >= 95) degraded++;
      else unhealthy++;
    }
  }

  return { healthy, degraded, unhealthy, noData };
}

/**
 * Global average response time over time (hourly buckets)
 */
export function getGlobalResponseTrend(history, endpoints) {
  const now = Date.now();
  const hours = [];
  for (let i = 23; i >= 0; i--) {
    const hourStart = now - (i + 1) * 3600000;
    let totalMs = 0;
    let count = 0;
    for (const ep of endpoints) {
      const checks = history[ep.id] || [];
      const checksInHour = checks.filter((c) => c.ts >= hourStart);
      const avgMs =
        checksInHour.reduce((sum, c) => sum + (c.ms || 0), 0) / (checksInHour.length || 1);
      if (checksInHour.length > 0) {
        totalMs += avgMs;
        count++;
      }
    }
    hours.push({
      hourLabel: new Date(hourStart).toLocaleTimeString([], { hour: '2-digit' }),
      avgResponseTime: count ? Math.round(totalMs / count) : null,
    });
  }
  return hours;
}
