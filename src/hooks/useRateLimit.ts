import { useState, useRef } from 'react';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

export function useRateLimit(config: RateLimitConfig) {
  const [isBlocked, setIsBlocked] = useState(false);
  const attemptsRef = useRef<number[]>([]);
  const blockTimeoutRef = useRef<NodeJS.Timeout>();

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const { maxAttempts, windowMs, blockDurationMs = 60000 } = config;

    // Remove attempts outside the current window
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );

    // Check if we're currently blocked
    if (isBlocked) {
      return false;
    }

    // Check if we've exceeded the rate limit
    if (attemptsRef.current.length >= maxAttempts) {
      setIsBlocked(true);
      
      // Clear the block after the specified duration
      if (blockTimeoutRef.current) {
        clearTimeout(blockTimeoutRef.current);
      }
      
      blockTimeoutRef.current = setTimeout(() => {
        setIsBlocked(false);
        attemptsRef.current = [];
      }, blockDurationMs);
      
      return false;
    }

    // Record this attempt
    attemptsRef.current.push(now);
    return true;
  };

  const getRemainingAttempts = (): number => {
    return Math.max(0, config.maxAttempts - attemptsRef.current.length);
  };

  return {
    checkRateLimit,
    isBlocked,
    getRemainingAttempts,
  };
}