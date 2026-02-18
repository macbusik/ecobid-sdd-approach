import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logError, logInfo, ErrorContext } from './logger';

describe('Logger Module', () => {
  let consoleErrorSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('logError', () => {
    it('should log error with service name, operation, and error details', () => {
      // Requirements: 7.1
      const error = new Error('Test error message');
      const context: ErrorContext = {
        operation: 'detectLabels',
        service: 'Rekognition',
        error
      };

      logError(context);

      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe('ERROR');
      expect(logOutput.operation).toBe('detectLabels');
      expect(logOutput.service).toBe('Rekognition');
      expect(logOutput.error.name).toBe('Error');
      expect(logOutput.error.message).toBe('Test error message');
      expect(logOutput.error.stack).toBeDefined();
    });

    it('should include metadata when provided', () => {
      const error = new Error('Service unavailable');
      const context: ErrorContext = {
        operation: 'invokeModel',
        service: 'Bedrock',
        error,
        metadata: {
          itemId: 'item-123',
          retryAttempt: 2,
          modelId: 'claude-3-haiku'
        }
      };

      logError(context);

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.metadata.itemId).toBe('item-123');
      expect(logOutput.metadata.retryAttempt).toBe(2);
      expect(logOutput.metadata.modelId).toBe('claude-3-haiku');
    });

    it('should include timestamp in ISO format', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'getObject',
        service: 'S3',
        error
      };

      logError(context);

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.timestamp).toBeDefined();
      expect(() => new Date(logOutput.timestamp)).not.toThrow();
    });

    it('should output valid JSON format', () => {
      // Requirements: 7.5
      const error = new Error('JSON test');
      const context: ErrorContext = {
        operation: 'updateItem',
        service: 'DynamoDB',
        error
      };

      logError(context);

      expect(() => {
        JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      }).not.toThrow();
    });

    it('should handle errors without metadata', () => {
      const error = new Error('No metadata');
      const context: ErrorContext = {
        operation: 'testOperation',
        service: 'TestService',
        error
      };

      logError(context);

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.metadata).toEqual({});
    });

    it('should include full error stack trace', () => {
      // Requirements: 7.4
      const error = new Error('Stack trace test');
      const context: ErrorContext = {
        operation: 'processImage',
        service: 'Lambda',
        error
      };

      logError(context);

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.error.stack).toBeDefined();
      expect(logOutput.error.stack).toContain('Error: Stack trace test');
    });
  });

  describe('logInfo', () => {
    it('should log info message with metadata', () => {
      // Requirements: 7.2, 7.3
      const message = 'Processing started';
      const metadata = {
        imageKey: 'uploads/image.jpg',
        itemId: 'item-456'
      };

      logInfo(message, metadata);

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(logOutput.level).toBe('INFO');
      expect(logOutput.message).toBe('Processing started');
      expect(logOutput.metadata.imageKey).toBe('uploads/image.jpg');
      expect(logOutput.metadata.itemId).toBe('item-456');
    });

    it('should log info message without metadata', () => {
      const message = 'Simple log message';

      logInfo(message);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.message).toBe('Simple log message');
      expect(logOutput.metadata).toEqual({});
    });

    it('should include timestamp in ISO format', () => {
      logInfo('Timestamp test');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.timestamp).toBeDefined();
      expect(() => new Date(logOutput.timestamp)).not.toThrow();
    });

    it('should output valid JSON format', () => {
      // Requirements: 7.5
      logInfo('JSON format test', { key: 'value' });

      expect(() => {
        JSON.parse(consoleLogSpy.mock.calls[0][0]);
      }).not.toThrow();
    });

    it('should handle complex metadata objects', () => {
      const metadata = {
        aiTags: ['Chair', 'Wooden', 'Furniture'],
        processingDuration: 3456,
        success: true,
        nested: {
          field1: 'value1',
          field2: 123
        }
      };

      logInfo('Complex metadata test', metadata);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.metadata.aiTags).toEqual(['Chair', 'Wooden', 'Furniture']);
      expect(logOutput.metadata.processingDuration).toBe(3456);
      expect(logOutput.metadata.success).toBe(true);
      expect(logOutput.metadata.nested.field1).toBe('value1');
    });

    it('should log processing completion with duration', () => {
      // Requirements: 7.3
      const metadata = {
        itemId: 'item-789',
        aiTags: ['Table', 'Wood'],
        aiDescription: 'A wooden table',
        aiConditionAssessment: 'Good',
        processingDuration: 4200
      };

      logInfo('Processing completed successfully', metadata);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.message).toBe('Processing completed successfully');
      expect(logOutput.metadata.processingDuration).toBe(4200);
      expect(logOutput.metadata.aiTags).toEqual(['Table', 'Wood']);
    });
  });

  describe('JSON Format Validation', () => {
    it('should produce parseable JSON for all log types', () => {
      // Requirements: 7.5
      const error = new Error('Test');
      logError({
        operation: 'test',
        service: 'TestService',
        error,
        metadata: { key: 'value' }
      });

      logInfo('Test message', { key: 'value' });

      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledOnce();

      // Both should be valid JSON
      expect(() => JSON.parse(consoleErrorSpy.mock.calls[0][0])).not.toThrow();
      expect(() => JSON.parse(consoleLogSpy.mock.calls[0][0])).not.toThrow();
    });

    it('should handle special characters in messages', () => {
      const message = 'Message with "quotes" and \\backslashes\\ and \nnewlines';
      logInfo(message);

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.message).toBe(message);
    });
  });
});
