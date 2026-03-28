import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  batchExecute,
  debounce,
  delay,
  executeSequentially,
  raceWithLabels,
  throttle,
} from './async';

describe('async utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('delay', () => {
    it('resolves after specified time', async () => {
      const promise = delay(1000);

      vi.advanceTimersByTime(1000);

      await expect(promise).resolves.toBeUndefined();
    });

    it('works with zero delay', async () => {
      const promise = delay(0);

      vi.advanceTimersByTime(0);

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('debounce', () => {
    it('delays function execution', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('resets timer on subsequent calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 300);

      debouncedFn('first');
      vi.advanceTimersByTime(200);

      debouncedFn('second');
      vi.advanceTimersByTime(200);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
    });
  });

  describe('throttle', () => {
    it('limits function calls to once per limit period', () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 300);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('first');

      vi.advanceTimersByTime(300);

      throttledFn('fourth');

      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('fourth');
    });
  });

  describe('batchExecute', () => {
    it('executes tasks in batches', async () => {
      const tasks = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockResolvedValue('result2'),
        vi.fn().mockResolvedValue('result3'),
        vi.fn().mockResolvedValue('result4'),
      ];

      const promise = batchExecute(tasks, 2);

      await vi.runAllTimersAsync();

      const results = await promise;

      expect(results).toEqual(['result1', 'result2', 'result3', 'result4']);
      expect(tasks[0]).toHaveBeenCalled();
      expect(tasks[1]).toHaveBeenCalled();
      expect(tasks[2]).toHaveBeenCalled();
      expect(tasks[3]).toHaveBeenCalled();
    });
  });

  describe('executeSequentially', () => {
    it('executes tasks one after another', async () => {
      const tasks = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockResolvedValue('result2'),
        vi.fn().mockResolvedValue('result3'),
      ];

      const promise = executeSequentially(tasks);

      await vi.runAllTimersAsync();

      const results = await promise;

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(tasks[0]).toHaveBeenCalled();
      expect(tasks[1]).toHaveBeenCalled();
      expect(tasks[2]).toHaveBeenCalled();
    });
  });

  describe('raceWithLabels', () => {
    it('returns first resolved promise with label', async () => {
      const fastPromise = new Promise((resolve) => setTimeout(() => resolve('fast'), 100));
      const slowPromise = new Promise((resolve) => setTimeout(() => resolve('slow'), 200));

      const promise = raceWithLabels({
        fast: fastPromise,
        slow: slowPromise,
      });

      await vi.advanceTimersByTimeAsync(100);

      const result = await promise;

      expect(result).toEqual({ label: 'fast', result: 'fast' });
    });
  });
});
