/**
 * Async Utilities
 * Helper functions for async operations and delays
 *
 * Location: src/utils/async.js
 */

/**
 * Delay function for async operations
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 *
 * @example
 * await delay(1000); // Wait 1 second
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts (default 3)
 * @param {number} baseDelay - Base delay in ms (default 1000, doubles each retry)
 * @returns {Promise} Result of function or throws last error
 *
 * @example
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   3,
 *   1000
 * );
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        const delayTime = baseDelay * Math.pow(2, i);
        console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delayTime}ms`);
        await delay(delayTime);
      }
    }
  }

  throw lastError;
}

/**
 * Timeout wrapper for promises
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise} Original promise or timeout error
 *
 * @example
 * const result = await withTimeout(
 *   fetch('/api/slow-endpoint'),
 *   5000
 * );
 */
export function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs),
    ),
  ]);
}

/**
 * Debounce function calls
 * Delays execution until after wait time has elapsed since last call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 *
 * @example
 * const debouncedSearch = debounce((query) => {
 *   console.log('Searching for:', query);
 * }, 300);
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * Ensures function is called at most once per limit period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in ms
 * @returns {Function} Throttled function
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   console.log('Scroll event');
 * }, 100);
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Execute multiple promises in batches
 * @param {Array<Function>} tasks - Array of functions returning promises
 * @param {number} batchSize - Number of concurrent tasks (default 3)
 * @returns {Promise<Array>} Results array
 *
 * @example
 * const urls = ['url1', 'url2', 'url3', ...];
 * const tasks = urls.map(url => () => fetch(url));
 * const results = await batchExecute(tasks, 3);
 */
export async function batchExecute(tasks, batchSize = 3) {
  const results = [];

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((task) => task()));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Execute promises sequentially (one after another)
 * @param {Array<Function>} tasks - Array of functions returning promises
 * @returns {Promise<Array>} Results array
 *
 * @example
 * const tasks = [
 *   () => asyncTask1(),
 *   () => asyncTask2(),
 *   () => asyncTask3()
 * ];
 * const results = await executeSequentially(tasks);
 */
export async function executeSequentially(tasks) {
  const results = [];

  for (const task of tasks) {
    const result = await task();
    results.push(result);
  }

  return results;
}

/**
 * Poll a function until it returns true or timeout
 * @param {Function} fn - Function to poll (should return boolean or promise)
 * @param {number} interval - Polling interval in ms (default 1000)
 * @param {number} timeout - Max wait time in ms (default 30000)
 * @returns {Promise<boolean>} True if condition met, false if timeout
 *
 * @example
 * const isReady = await poll(
 *   async () => {
 *     const status = await checkStatus();
 *     return status === 'ready';
 *   },
 *   1000,
 *   10000
 * );
 */
export async function poll(fn, interval = 1000, timeout = 30000) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await fn();
      if (result) {
        return true;
      }
    } catch (error) {
      console.warn('Poll error:', error);
    }

    await delay(interval);
  }

  return false;
}

/**
 * Race multiple promises with labels
 * Returns the first resolved promise with its label
 * @param {Object} promiseMap - Object mapping labels to promises
 * @returns {Promise<Object>} {label, result}
 *
 * @example
 * const result = await raceWithLabels({
 *   primary: fetch('/api/primary'),
 *   fallback: fetch('/api/fallback')
 * });
 * console.log(`${result.label} completed first:`, result.result);
 */
export async function raceWithLabels(promiseMap) {
  const entries = Object.entries(promiseMap);
  const labeledPromises = entries.map(([label, promise]) =>
    promise.then((result) => ({ label, result })),
  );

  return Promise.race(labeledPromises);
}

/**
 * Create a cancellable promise
 * @param {Promise} promise - Promise to make cancellable
 * @returns {Object} {promise, cancel}
 *
 * @example
 * const { promise, cancel } = makeCancellable(fetch('/api/data'));
 *
 * // Later, if needed:
 * cancel();
 *
 * try {
 *   const result = await promise;
 * } catch (error) {
 *   if (error.message === 'Cancelled') {
 *     console.log('Request was cancelled');
 *   }
 * }
 */
export function makeCancellable(promise) {
  let cancelled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise
      .then((value) => (cancelled ? reject(new Error('Cancelled')) : resolve(value)))
      .catch((error) => (cancelled ? reject(new Error('Cancelled')) : reject(error)));
  });

  return {
    promise: wrappedPromise,
    cancel: () => {
      cancelled = true;
    },
  };
}

/**
 * Sleep for a random duration within a range
 * Useful for simulating variable delays
 * @param {number} minMs - Minimum delay in ms
 * @param {number} maxMs - Maximum delay in ms
 * @returns {Promise} Promise that resolves after random delay
 */
export function randomDelay(minMs, maxMs) {
  const randomMs = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return delay(randomMs);
}
