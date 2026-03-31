import { describe, it, expect } from 'node:test';

import {
  logOperation,
  successResponse,
  errorResponse,
  validateRequiredFields,
  extractUserInfo,
} from './controller-helpers.js';

describe('controller-helpers', () => {
  describe('logOperation', () => {
    it('should be a function', () => {
      expect(typeof logOperation).toBe('function');
    });
  });

  describe('successResponse', () => {
    it('should return formatted success response', () => {
      const data = { id: 1, name: 'test' };
      const result = successResponse(data, 'Success message');

      expect(result).toEqual({
        success: true,
        message: 'Success message',
        data,
        timestamp: expect.any(String),
      });
    });

    it('should use default message when none provided', () => {
      const result = successResponse({ test: true });

      expect(result.message).toBe('Operation successful');
    });
  });

  describe('errorResponse', () => {
    it('should return formatted error response', () => {
      const result = errorResponse('Error message', 400, { field: 'invalid' });

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Error message',
          code: 400,
          details: { field: 'invalid' },
          timestamp: expect.any(String),
        },
      });
    });

    it('should use default error code when none provided', () => {
      const result = errorResponse('Error message');

      expect(result.error.code).toBe(500);
    });
  });

  describe('validateRequiredFields', () => {
    it('should not throw when all required fields are present', () => {
      const body = { name: 'test', email: 'test@example.com' };

      expect(() => validateRequiredFields(body, ['name', 'email'])).not.toThrow();
    });

    it('should throw when required fields are missing', () => {
      const body = { name: 'test' };

      expect(() => validateRequiredFields(body, ['name', 'email'])).toThrow(
        'Missing required fields: email',
      );
    });

    it('should throw with multiple missing fields', () => {
      const body = {};

      expect(() => validateRequiredFields(body, ['name', 'email', 'age'])).toThrow(
        'Missing required fields: name, email, age',
      );
    });
  });

  describe('extractUserInfo', () => {
    it('should extract user information from request', () => {
      const mockReq = {
        ip: '192.168.1.1',
        connection: { remoteAddress: '192.168.1.1' },
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
      };

      const result = extractUserInfo(mockReq);

      expect(result).toEqual({
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: expect.any(String),
      });
    });

    it('should handle missing ip gracefully', () => {
      const mockReq = {
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
      };

      const result = extractUserInfo(mockReq);

      expect(result.ip).toBeUndefined();
      expect(result.userAgent).toBe('Mozilla/5.0');
    });
  });
});
