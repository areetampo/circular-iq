/**
 * Manages the set of active SSE client connections for the uptime monitor.
 * Acts as the single source of truth for who is connected; both the route handler
 * (to add/remove clients) and the polling service (to broadcast events) import from here,
 * avoiding any circular dependency.
 */

const clients = new Set();

/**
 * Registers a new SSE client response stream.
 * Side effect: retains the response object until `removeClient` or a failed broadcast removes it.
 *
 * @param {import('express').Response} res - Open Express response stream that will receive SSE frames.
 */
export function addClient(res) {
  clients.add(res);
}

/**
 * Removes a client response stream (called when the connection closes).
 * Idempotent for streams that are not currently registered.
 *
 * @param {import('express').Response} res - Response stream whose connection has closed or failed.
 */
export function removeClient(res) {
  clients.delete(res);
}

/**
 * Broadcasts an SSE event to all currently connected clients.
 * If writing to a client fails, that client is silently removed from the set.
 * Side effect: writes SSE frames to each retained response stream.
 *
 * @param {string} event - SSE event name such as 'poll-complete' or 'connected'.
 * @param {Record<string, unknown>|Array<unknown>|string|number|boolean|null} data - JSON-serializable event payload written after the SSE `data:` prefix.
 */
export function broadcastUptimeEvent(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch (error) {
      logger.error({ error, clientCount: clients.size }, 'Failed to write to SSE client');
      clients.delete(client);
    }
  }
}
