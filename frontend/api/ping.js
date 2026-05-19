/**
 * @module ping
 * @description Vercel serverless function for health check ping.
 * Pings the backend health endpoint to verify connectivity.
 *
 * @param {Object} req - Vercel request object.
 * @param {Object} res - Vercel response object.
 * @returns {Promise<void>} Sends JSON response with status.
 */
export default async function handler(req, res) {
  try {
    const baseUrl = process.env.VITE_API_URL;

    if (!baseUrl) {
      return res.status(500).json({ error: 'VITE_API_URL not set' });
    }

    await fetch(`${baseUrl}/health`);

    return res.status(200).json({ status: 'ok' });
  } catch {
    return res.status(500).json({ status: 'error' });
  }
}
