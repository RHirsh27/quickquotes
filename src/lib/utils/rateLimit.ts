/**
 * Client-side rate limiting utilities
 * Prevents rapid-fire form submissions and API calls
 */

interface RateLimitOptions {
  maxAttempts: number
  windowMs: number
}

class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  /**
   * Check if an action is allowed based on rate limit
   * @param key Unique identifier for the rate limit (e.g., user ID, IP, form type)
   * @param options Rate limit options
   * @returns true if allowed, false if rate limited
   */
  isAllowed(key: string, options: RateLimitOptions = { maxAttempts: 5, windowMs: 60000 }): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    // Remove attempts outside the time window
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < options.windowMs)

    if (recentAttempts.length >= options.maxAttempts) {
      return false
    }

    // Add current attempt
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)

    return true
  }

  /**
   * Get time until next attempt is allowed (in milliseconds)
   */
  getTimeUntilNext(key: string, options: RateLimitOptions = { maxAttempts: 5, windowMs: 60000 }): number {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < options.windowMs)

    if (recentAttempts.length < options.maxAttempts) {
      return 0
    }

    // Find the oldest attempt in the window
    const oldestAttempt = Math.min(...recentAttempts)
    const timeUntilOldestExpires = options.windowMs - (now - oldestAttempt)

    return Math.max(0, timeUntilOldestExpires)
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.attempts.delete(key)
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.attempts.clear()
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter()

/**
 * Hook-like function to throttle form submissions
 * Returns a function that checks rate limit before executing
 */
export function createThrottledSubmit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string,
  options: RateLimitOptions = { maxAttempts: 5, windowMs: 60000 }
): T {
  return (async (...args: Parameters<T>) => {
    if (!rateLimiter.isAllowed(key, options)) {
      const timeUntilNext = rateLimiter.getTimeUntilNext(key, options)
      const seconds = Math.ceil(timeUntilNext / 1000)
      throw new Error(`Please wait ${seconds} seconds before trying again`)
    }

    return fn(...args)
  }) as T
}

