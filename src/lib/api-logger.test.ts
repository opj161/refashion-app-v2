// Mock server-only to allow testing
jest.mock('server-only', () => ({}));

import { createApiLogger, logApiCall } from './api-logger';

describe('ApiLogger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('createApiLogger', () => {
    it('should create a logger with unique request ID', () => {
      const logger1 = createApiLogger('GEMINI_TEXT', 'Test Operation 1');
      const logger2 = createApiLogger('GEMINI_TEXT', 'Test Operation 2');

      expect(logger1.getRequestId()).toBeTruthy();
      expect(logger2.getRequestId()).toBeTruthy();
      expect(logger1.getRequestId()).not.toBe(logger2.getRequestId());
    });

    it('should accept custom request ID', () => {
      const customId = 'custom123';
      const logger = createApiLogger('GEMINI_TEXT', 'Test', {
        requestId: customId,
      });

      expect(logger.getRequestId()).toBe(customId);
    });

    it('should log start with all context', () => {
      const logger = createApiLogger('GEMINI_TEXT', 'Test Operation', {
        username: 'testuser',
        model: 'gemini-flash-lite-latest',
        keyIndex: 1,
      });

      logger.start({ prompt: 'Test prompt' });

      expect(consoleLogSpy).toHaveBeenCalled();
      const allLogs = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allLogs).toContain('GEMINI_TEXT START');
      expect(allLogs).toContain('Operation: Test Operation');
      expect(allLogs).toContain('User: testuser');
      expect(allLogs).toContain('Model: gemini-flash-lite-latest');
      expect(allLogs).toContain('Key Index: 1');
    });

    it('should log success with timing', () => {
      const logger = createApiLogger('FAL_IMAGE', 'Test');
      logger.start();

      // Simulate some work
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      return delay(10).then(() => {
        logger.success({ imageUrl: 'https://example.com/image.png' });

        const allLogs = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
        expect(allLogs).toContain('FAL_IMAGE SUCCESS');
        expect(allLogs).toContain('Response Time:');
      });
    });

    it('should log errors with context', () => {
      const logger = createApiLogger('GEMINI_IMAGE', 'Test');
      logger.start();

      const error = new Error('API rate limit exceeded');
      logger.error(error, 'Using cached result');

      const allLogs = consoleErrorSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allLogs).toContain('GEMINI_IMAGE FAILED');
      expect(allLogs).toContain('Error Message: API rate limit exceeded');
      expect(allLogs).toContain('Fallback Action: Using cached result');
    });

    it('should track retry attempts', () => {
      const logger = createApiLogger('FAL_VIDEO', 'Test');
      logger.start();
      logger.retry(1, 'Timeout error');
      logger.retry(2, 'Connection refused');

      const metrics = logger.getMetrics();
      expect(metrics.retryCount).toBe(2);
    });

    it('should log progress updates', () => {
      const logger = createApiLogger('STORAGE', 'Test Upload');
      logger.start();
      logger.progress('Uploading file...');
      logger.progress('Processing...');

      const allLogs = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allLogs).toContain('Uploading file...');
      expect(allLogs).toContain('Processing...');
    });

    it('should log warnings', () => {
      const logger = createApiLogger('GEMINI_TEXT', 'Test');
      logger.warning('API key rotation recommended', {
        currentUsage: 950,
        limit: 1000,
      });

      const allLogs = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allLogs).toContain('WARNING');
      expect(allLogs).toContain('API key rotation recommended');
    });
  });

  describe('logApiCall helper', () => {
    it('should automatically log start and success', async () => {
      const result = await logApiCall(
        'GEMINI_TEXT',
        'Test',
        async (logger) => {
          logger.progress('Working...');
          return 'success';
        },
        { username: 'testuser' }
      );

      expect(result).toBe('success');
      const allLogs = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allLogs).toContain('START');
      expect(allLogs).toContain('SUCCESS');
    });

    it('should automatically log errors', async () => {
      const error = new Error('Test error');

      await expect(
        logApiCall('FAL_IMAGE', 'Test', async () => {
          throw error;
        })
      ).rejects.toThrow('Test error');

      const allLogs = consoleErrorSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allLogs).toContain('FAILED');
    });
  });

  describe('truncation', () => {
    it('should truncate long strings in input when verbose mode is enabled', () => {
      // Set verbose mode
      process.env.API_LOG_VERBOSE = 'true';
      
      const logger = createApiLogger('GEMINI_TEXT', 'Test');
      const longString = 'a'.repeat(300);

      logger.start({ longInput: longString });

      const allLogs = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(allLogs).toContain('...');
      expect(allLogs).not.toContain('a'.repeat(201));
      
      // Clean up
      delete process.env.API_LOG_VERBOSE;
    });
  });

  describe('timing', () => {
    it('should format milliseconds correctly', () => {
      const logger = createApiLogger('FAL_VIDEO', 'Test');
      logger.start();

      // Mock the timing
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      return delay(100).then(() => {
        logger.success();
        const allLogs = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
        expect(allLogs).toMatch(/Response Time: \d+(\.\d+)?m?s/);
      });
    });
  });
});
