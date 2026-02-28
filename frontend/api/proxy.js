/**
 * Vercel Serverless Function: API Proxy
 *
 * This function acts as a secure intermediary between the frontend and the backend API.
 * It hides the backend API key from the browser by injecting it server-side.
 *
 * Environment Variables (set in Vercel dashboard, NOT in .env.local):
 * - INTERNAL_BACKEND_API_KEY: The actual API key for backend authentication
 * - VITE_API_URL: The Railway backend URL (can be public, used as destination)
 *
 * Usage: Frontend calls /api/proxy?path=/api/score&method=POST
 * Then this function forwards to {VITE_API_URL}/api/score with x-api-key header
 *
 * Security:
 * - INTERNAL_BACKEND_API_KEY never leaves server
 * - Browser only knows about /api/proxy endpoint
 * - All requests are authenticated server-to-server
 */

export default async function handler(req, res) {
  // Enable CORS for requests from the Vercel domain
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version',
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get configuration from environment
    const backendApiUrl = process.env.VITE_API_URL;
    const internalApiKey = process.env.INTERNAL_BACKEND_API_KEY;

    // Validate required environment variables
    if (!backendApiUrl) {
      return res.status(500).json({
        error: 'Backend URL not configured',
        code: 'BACKEND_URL_MISSING',
      });
    }

    if (!internalApiKey) {
      return res.status(500).json({
        error: 'Internal API key not configured',
        code: 'API_KEY_MISSING',
      });
    }

    // Extract path and method from query parameters
    const { path, method = req.method } = req.query;

    if (!path) {
      return res.status(400).json({
        error: 'Missing path parameter',
        code: 'INVALID_REQUEST',
      });
    }

    // Ensure path is properly formatted
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Build the full backend URL
    const backendUrl = new URL(normalizedPath, backendApiUrl);

    // Forward any query parameters from the original request
    const queryKeys = Object.keys(req.query).filter((key) => key !== 'path' && key !== 'method');
    queryKeys.forEach((key) => {
      backendUrl.searchParams.append(key, req.query[key]);
    });

    // Prepare headers for backend request
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': internalApiKey,
    };

    // Forward Authorization header if present (for Supabase auth tokens)
    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }

    // Forward custom headers that are safe to forward
    const headersToForward = ['x-request-id', 'user-agent'];
    headersToForward.forEach((headerName) => {
      if (req.headers[headerName]) {
        headers[headerName] = req.headers[headerName];
      }
    });

    // Forward client IP headers so backend can track original client IP
    // Prefer existing x-forwarded-for if present, otherwise set to the socket remote address
    if (req.headers['x-forwarded-for']) {
      headers['x-forwarded-for'] = req.headers['x-forwarded-for'];
    } else if (req.socket && req.socket.remoteAddress) {
      headers['x-forwarded-for'] = req.socket.remoteAddress;
    }

    // Forward x-real-ip and cf-connecting-ip if present
    if (req.headers['x-real-ip']) headers['x-real-ip'] = req.headers['x-real-ip'];
    if (req.headers['cf-connecting-ip'])
      headers['cf-connecting-ip'] = req.headers['cf-connecting-ip'];

    // Prepare request body
    let requestBody;
    if (['POST', 'PATCH', 'PUT'].includes(method) && req.body) {
      requestBody = JSON.stringify(req.body);
    }

    // Make the request to the backend
    const backendResponse = await fetch(backendUrl.toString(), {
      method: method || 'GET',
      headers,
      body: requestBody,
    });

    // Get the response data
    const responseData = await backendResponse.json().catch(() => ({}));

    // Forward the response status and data
    res.status(backendResponse.status).json(responseData);
  } catch (error) {
    console.error('[PROXY_ERROR]', error);

    res.status(500).json({
      error: error.message || 'Internal server error',
      code: 'PROXY_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
}
