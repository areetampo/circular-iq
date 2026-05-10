import { buildApiUrl } from '@/lib/apiClient';

export async function fetchHistoryFromBackend(endpointId, limit = 10000) {
  try {
    const url = buildApiUrl(`/api/uptime/history/${endpointId}?limit=${limit}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.checks.map((c) => ({
      ts: new Date(c.createdAt).getTime(),
      up: c.up,
      ms: c.responseTimeMs,
      status: c.status,
      data: c.payload,
    }));
  } catch (err) {
    logger.warn(`Failed to fetch history for ${endpointId}:`, err);
    return [];
  }
}
