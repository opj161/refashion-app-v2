'use server';

import 'server-only';

import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type ApiCategory = 'GEMINI_TEXT' | 'GEMINI_IMAGE' | 'FAL_IMAGE' | 'FAL_VIDEO' | 'STORAGE';
export type ApiStatus = 'START' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'RETRY' | 'WARNING';

interface ApiLogContext {
  requestId: string;
  category: ApiCategory;
  operation: string;
  username?: string;
  model?: string;
  endpoint?: string;
  keyIndex?: number;
}

interface ApiLogMetrics {
  startTime: number;
  endTime?: number;
  responseTime?: number;
  retryCount?: number;
}

/**
 * Standardized API logger for external service calls (Gemini, Fal.ai, etc.)
 * 
 * Features:
 * - Unique request IDs for tracing
 * - Automatic timing measurements
 * - Consistent formatting with emojis and separators
 * - Configurable verbosity (detailed in dev, concise in prod)
 * - Structured output for log aggregation
 * 
 * @example
 * const logger = createApiLogger('GEMINI_TEXT', 'Prompt Enhancement', {
 *   username: 'john',
 *   model: 'gemini-2.5-pro',
 *   keyIndex: 1,
 * });
 * 
 * logger.start({ prompt: 'Generate image...' });
 * try {
 *   const result = await apiCall();
 *   logger.success({ description: result.text });
 *   return result;
 * } catch (error) {
 *   logger.error(error, 'Using fallback value');
 *   throw error;
 * }
 */
class ApiLogger {
  private context: ApiLogContext;
  private metrics: ApiLogMetrics;
  private verboseMode: boolean;

  constructor(category: ApiCategory, operation: string, options: {
    username?: string;
    model?: string;
    endpoint?: string;
    keyIndex?: number;
    requestId?: string;
  } = {}) {
    this.context = {
      requestId: options.requestId || uuidv4().slice(0, 8),
      category,
      operation,
      username: options.username,
      model: options.model,
      endpoint: options.endpoint,
      keyIndex: options.keyIndex,
    };
    this.metrics = {
      startTime: Date.now(),
      retryCount: 0,
    };
    this.verboseMode = process.env.API_LOG_VERBOSE === 'true' || process.env.NODE_ENV === 'development';
  }

  private getEmoji(status: ApiStatus): string {
    const emojiMap: Record<ApiStatus, string> = {
      START: '🔵',
      IN_PROGRESS: '⏳',
      SUCCESS: '✅',
      FAILED: '❌',
      RETRY: '🔄',
      WARNING: '⚠️',
    };
    return emojiMap[status];
  }

  private getSeparator(): string {
    return '═'.repeat(80);
  }

  private getPrefix(): string {
    return `[${this.context.requestId}]`;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  private truncate(text: string, maxLength: number = 200): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  /**
   * Log the start of an API call with context and input details
   */
  start(input?: Record<string, any>) {
    const emoji = this.getEmoji('START');
    console.log(`\n${this.getPrefix()} ${emoji} ${this.context.category} START`);
    console.log(this.getSeparator());
    console.log(`Operation: ${this.context.operation}`);
    
    if (this.context.username) {
      console.log(`User: ${this.context.username}`);
    }
    
    if (this.context.model) {
      console.log(`Model: ${this.context.model}`);
    }
    
    if (this.context.endpoint) {
      console.log(`Endpoint: ${this.context.endpoint}`);
    }
    
    if (this.context.keyIndex !== undefined) {
      console.log(`Key Index: ${this.context.keyIndex}`);
    }
    
    if (this.verboseMode && input) {
      console.log('\nInput Details:');
      Object.entries(input).forEach(([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        console.log(`  ${key}: ${this.truncate(stringValue)}`);
      });
    }
    
    console.log(this.getSeparator());
  }

  /**
   * Log progress updates for long-running operations
   */
  progress(message: string) {
    const emoji = this.getEmoji('IN_PROGRESS');
    console.log(`${this.getPrefix()} ${emoji} ${this.context.category} | ${message}`);
  }

  /**
   * Log successful API call completion with timing and output
   */
  success(output?: Record<string, any>) {
    this.metrics.endTime = Date.now();
    this.metrics.responseTime = this.metrics.endTime - this.metrics.startTime;

    const emoji = this.getEmoji('SUCCESS');
    console.log(`\n${this.getPrefix()} ${emoji} ${this.context.category} SUCCESS`);
    console.log(this.getSeparator());
    console.log(`Response Time: ${this.formatDuration(this.metrics.responseTime)}`);
    
    if (this.metrics.retryCount && this.metrics.retryCount > 0) {
      console.log(`Retry Count: ${this.metrics.retryCount}`);
    }
    
    if (this.verboseMode && output) {
      console.log('\nOutput Details:');
      Object.entries(output).forEach(([key, value]) => {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        console.log(`  ${key}: ${this.truncate(stringValue)}`);
      });
    }
    
    console.log(this.getSeparator());
  }

  /**
   * Log retry attempts
   */
  retry(attemptNumber: number, reason: string) {
    this.metrics.retryCount = attemptNumber;
    const emoji = this.getEmoji('RETRY');
    console.log(`${this.getPrefix()} ${emoji} ${this.context.category} RETRY (Attempt ${attemptNumber}): ${reason}`);
  }

  /**
   * Log warnings (non-fatal issues, degraded mode, etc.)
   */
  warning(message: string, details?: Record<string, any>) {
    const emoji = this.getEmoji('WARNING');
    console.log(`\n${this.getPrefix()} ${emoji} ${this.context.category} WARNING`);
    console.log(this.getSeparator());
    console.log(`Message: ${message}`);
    
    if (details) {
      console.log('\nDetails:');
      Object.entries(details).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }
    
    console.log(this.getSeparator());
  }

  /**
   * Log errors with full context and optional fallback action
   */
  error(error: Error | unknown, fallback?: string) {
    this.metrics.endTime = Date.now();
    this.metrics.responseTime = this.metrics.endTime - this.metrics.startTime;

    const emoji = this.getEmoji('FAILED');
    const errorObj = error as Error;
    
    console.error(`\n${this.getPrefix()} ${emoji} ${this.context.category} FAILED`);
    console.error(this.getSeparator());
    console.error(`Response Time: ${this.formatDuration(this.metrics.responseTime)}`);
    console.error(`Error Type: ${errorObj.name || 'Error'}`);
    console.error(`Error Message: ${errorObj.message || String(error)}`);
    
    if (fallback) {
      console.error(`Fallback Action: ${fallback}`);
    }
    
    if (this.verboseMode && errorObj.stack) {
      console.error('\nStack Trace:');
      console.error(errorObj.stack);
    }
    
    console.error(this.getSeparator());
  }

  /**
   * Get the unique request ID for correlation
   */
  getRequestId(): string {
    return this.context.requestId;
  }

  /**
   * Get current metrics (timing, retry count, etc.)
   */
  getMetrics(): ApiLogMetrics {
    return { ...this.metrics };
  }
}

/**
 * Factory function to create a new API logger instance
 * 
 * @param category The type of API (GEMINI_TEXT, FAL_IMAGE, etc.)
 * @param operation A descriptive name for this specific operation
 * @param options Optional context (username, model, endpoint, etc.)
 * @returns ApiLogger instance
 */
export function createApiLogger(
  category: ApiCategory,
  operation: string,
  options: {
    username?: string;
    model?: string;
    endpoint?: string;
    keyIndex?: number;
    requestId?: string;
  } = {}
): ApiLogger {
  return new ApiLogger(category, operation, options);
}

/**
 * Helper to wrap an async API call with automatic logging
 * Logs start, success/error automatically
 * 
 * @param category API category
 * @param operation Operation name
 * @param fn Async function that receives the logger and returns a result
 * @param options Context options
 * @returns Promise with the result of fn
 * 
 * @example
 * const result = await logApiCall('GEMINI_TEXT', 'Classification', async (logger) => {
 *   logger.progress('Processing...');
 *   return await apiCall();
 * }, { username: 'john', model: 'gemini-2.0-flash-exp' });
 */
export async function logApiCall<T>(
  category: ApiCategory,
  operation: string,
  fn: (logger: ApiLogger) => Promise<T>,
  options: {
    username?: string;
    model?: string;
    endpoint?: string;
    keyIndex?: number;
  } = {}
): Promise<T> {
  const logger = createApiLogger(category, operation, options);
  logger.start();
  
  try {
    const result = await fn(logger);
    logger.success();
    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
