export function createToastContext() {
  return window.__toastContext || null;
}

export function setToastContext(context) {
  window.__toastContext = context;
}

/**
 * Global API error handler with retry logic and user-friendly messages
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 2) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (!res.ok) {
        const data = await res.json();
        const message = data.error || `Request failed (${res.status})`;
        throw new Error(message);
      }

      return res;
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}
