// Performance monitoring utilities for identifying bottlenecks
// These utilities help track performance metrics in development and production

/**
 * Measures the execution time of a function
 * @param fn Function to measure
 * @param label Optional label for the measurement
 * @returns Result of the function and execution time in milliseconds
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  
  if (label && process.env.NODE_ENV === 'development') {
    console.log(`⏱️ [Performance] ${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

/**
 * Measures the execution time of a synchronous function
 * @param fn Function to measure
 * @param label Optional label for the measurement
 * @returns Result of the function and execution time in milliseconds
 */
export function measureSync<T>(
  fn: () => T,
  label?: string
): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  if (label && process.env.NODE_ENV === 'development') {
    console.log(`⏱️ [Performance] ${label}: ${duration.toFixed(2)}ms`);
  }
  
  return { result, duration };
}

/**
 * Performance mark for tracking specific points in code
 * @param name Name of the mark
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure the time between two marks
 * @param name Name of the measurement
 * @param startMark Start mark name
 * @param endMark End mark name (optional, defaults to now)
 * @returns Duration in milliseconds or null if marks don't exist
 */
export function measure(
  name: string,
  startMark: string,
  endMark?: string
): number | null {
  if (typeof performance === 'undefined' || !performance.measure) {
    return null;
  }
  
  try {
    const measureResult = endMark 
      ? performance.measure(name, startMark, endMark)
      : performance.measure(name, startMark);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ [Performance] ${name}: ${measureResult.duration.toFixed(2)}ms`);
    }
    
    return measureResult.duration;
  } catch (error) {
    console.warn(`Failed to measure ${name}:`, error);
    return null;
  }
}

/**
 * Tracks rendering performance for React components (use in useEffect)
 * @param componentName Name of the component
 * @param dependencies Dependencies that trigger re-renders
 */
export function trackRender(componentName: string, dependencies?: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `🔄 [Render] ${componentName}`,
      dependencies ? `with deps: ${JSON.stringify(dependencies)}` : ''
    );
  }
}

/**
 * Debounce function to limit execution frequency
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Throttle function to limit execution frequency
 * @param fn Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize expensive function results
 * @param fn Function to memoize
 * @param keyFn Optional function to generate cache key
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
