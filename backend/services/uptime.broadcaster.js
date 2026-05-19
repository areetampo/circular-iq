/**
 * @module uptime.broadcaster
 * @description Manages the set of active SSE client connections for the uptime monitor.
 * Acts as the single source of truth for who is connected — both the route handler
 * (to add/remove clients) and the polling service (to broadcast events) import from here,
 * avoiding any circular dependency.
 */

const clients = new Set();

/**
 * Registers a new SSE client response stream.
 * @param {import('express').Response} res - The Express response object for the SSE connection.
 */
export function addClient(res) {
  clients.add(res);
}

/**
 * Removes a client response stream (called when the connection closes).
 * @param {import('express').Response} res - The Express response object to remove.
 */
export function removeClient(res) {
  clients.delete(res);
}

/**
 * Broadcasts an SSE event to all currently connected clients.
 * If writing to a client fails, that client is silently removed from the set.
 *
 * @param {string} event - The SSE event name (e.g. 'poll-complete', 'connected').
 * @param {Object} data  - The payload to JSON-serialize and send as the event data.
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
