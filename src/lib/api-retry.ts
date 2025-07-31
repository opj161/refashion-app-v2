/**
 * Centralized API retry utility
 * Provides consistent retry logic across all API calls in the application
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

export interface RetryableError {
  message: string;
  status?: number;
  code?: string | number;
  isRetryable: boolean;
  shouldEndRetry?: boolean;
}

/**
 * Determines if an error should be retried based on its characteristics
 */
export function isRetryableError(error: any): boolean {
  // HTTP status codes that should be retried
  const retryableHttpCodes = [
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ];

  // Check HTTP status codes
  if (error?.status && retryableHttpCodes.includes(error.status)) {
    return true;
  }
  if (error?.code && retryableHttpCodes.includes(error.code)) {
    return true;
  }

  // Google AI/Gemini specific error patterns
  if (error?.message?.includes('overloaded')) return true;
  if (error?.message?.includes('rate limit')) return true;
  if (error?.message?.includes('UNAVAILABLE')) return true;
  if (error?.message?.includes('RESOURCE_EXHAUSTED')) return true;
  if (error?.message?.includes('DEADLINE_EXCEEDED')) return true;
  if (error?.message?.includes('INTERNAL')) return true;

  // Network/connection errors
  const networkErrorCodes = ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENETUNREACH'];
  if (error?.code && networkErrorCodes.includes(error.code)) {
    return true;
  }

  // Axios/fetch specific patterns
  if (error?.name === 'AxiosError' && error?.code === 'NETWORK_ERROR') return true;
  if (error?.name === 'FetchError') return true;

  return false;
}

/**
 * Calculates delay for next retry attempt
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  jitter: boolean
): number {
  let delay = baseDelay * Math.pow(backoffMultiplier, attempt);
  delay = Math.min(delay, maxDelay);
  
  if (jitter) {
    // Add random jitter (±25%)
    const jitterAmount = delay * 0.25;
    delay += (Math.random() - 0.5) * 2 * jitterAmount;
  }
  
  return Math.max(delay, 0);
}

/**
 * Waits for the specified number of milliseconds
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced retry wrapper for API calls with comprehensive error handling
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  context: string = 'API call'
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateDelay(attempt - 1, baseDelay, maxDelay, backoffMultiplier, jitter);
        console.log(`🔄 Retrying ${context} (attempt ${attempt + 1}/${maxRetries + 1}) after ${Math.round(delay)}ms delay...`);
        await wait(delay);
      }

      const result = await fn();
      
      if (attempt > 0) {
        console.log(`✅ ${context} succeeded on attempt ${attempt + 1}/${maxRetries + 1}`);
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries;
      const canRetry = isRetryableError(error);
      
      console.error(`❌ ${context} failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      
      if (!canRetry) {
        console.log(`🚫 Error is not retryable, stopping retry attempts for ${context}`);
        break;
      }
      
      if (isLastAttempt) {
        console.log(`🔚 Max retries (${maxRetries + 1}) reached for ${context}`);
        break;
      }
    }
  }

  // If we get here, all retries failed
  const errorMessage = lastError?.message || 'Unknown error';
  const enhancedError = new Error(
    `${context} failed after ${maxRetries + 1} attempts. Last error: ${errorMessage}`
  );
  
  // Preserve original error properties
  if (lastError?.status) (enhancedError as any).status = lastError.status;
  if (lastError?.code) (enhancedError as any).code = lastError.code;
  
  throw enhancedError;
}

/**
 * Retry wrapper specifically for Gemini API calls
 */
export async function withGeminiRetry<T>(
  fn: () => Promise<T>,
  context: string = 'Gemini API call'
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 4, // More retries for Gemini due to frequent overload
    baseDelay: 2000, // Start with 2s delay
    maxDelay: 60000, // Max 60s delay
    backoffMultiplier: 2,
    jitter: true,
  }, context);
}

/**
 * Retry wrapper for general HTTP API calls
 */
export async function withHttpRetry<T>(
  fn: () => Promise<T>,
  context: string = 'HTTP API call'
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    jitter: true,
  }, context);
}