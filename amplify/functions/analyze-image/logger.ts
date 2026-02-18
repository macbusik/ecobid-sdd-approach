/**
 * Structured logging module for CloudWatch Logs
 * Provides JSON-formatted logging for error tracking and monitoring
 * 
 * Requirements:
 * - 7.1: Log AWS service errors with service name, operation, and details
 * - 7.2: Log processing start with image key and timestamp
 * - 7.3: Log successful completion with metadata and duration
 * - 7.4: Log unrecoverable errors with full stack trace
 * - 7.5: Use structured JSON format for CloudWatch parsing
 */

export interface ErrorContext {
  operation: string;
  service: string;
  error: Error;
  metadata?: Record<string, any>;
}

export interface LogMetadata {
  [key: string]: any;
}

/**
 * Logs an error with structured context for CloudWatch
 * 
 * @param context - Error context including operation, service, and error details
 * 
 * Requirements: 7.1, 7.4, 7.5
 */
export function logError(context: ErrorContext): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    operation: context.operation,
    service: context.service,
    error: {
      name: context.error.name,
      message: context.error.message,
      stack: context.error.stack
    },
    metadata: context.metadata || {}
  };

  console.error(JSON.stringify(logEntry));
}

/**
 * Logs an informational message with optional metadata
 * 
 * @param message - Log message
 * @param metadata - Optional metadata to include in log
 * 
 * Requirements: 7.2, 7.3, 7.5
 */
export function logInfo(message: string, metadata?: LogMetadata): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message,
    metadata: metadata || {}
  };

  console.log(JSON.stringify(logEntry));
}
