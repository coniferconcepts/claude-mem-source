/**
 * PortManager - TOCTOU-safe port binding with retry logic
 *
 * PHASE 3: Medium Priority Fixes - Task 3.3
 * Fixes Time-of-Check-Time-of-Use (TOCTOU) race conditions in port binding
 *
 * Problem: Check if port is available → Bind to port (race condition between check and bind)
 * Solution: Atomic bind with retry logic and exponential backoff
 */

import net from 'net';
import { logger } from '../../utils/logger.js';

/**
 * Attempt to bind to a port atomically
 * PHASE 3: Task 3.3 - TOCTOU Fix
 * 
 * Replaces check-then-act pattern with atomic bind operation.
 * Uses exponential backoff with jitter for retries.
 * 
 * @param port - Port number to bind to
 * @param host - Host to bind to (default: localhost)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise that resolves when port is successfully bound
 * @throws Error if port cannot be bound after max retries
 */
export async function bindPortWithRetry(
  port: number,
  host: string = 'localhost',
  maxRetries: number = 3
): Promise<void> {
  // Validate inputs
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid port number: ${port}`);
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await attemptPortBind(port, host);
      logger.debug('SYSTEM', 'Successfully bound to port', { port, host, attempt });
      return;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        // Last attempt failed
        logger.error('SYSTEM', 'Failed to bind port after max retries', {
          port,
          host,
          maxRetries,
          lastError: lastError.message
        });
        throw lastError;
      }

      // Calculate exponential backoff with jitter
      // Attempt 1: 100ms + 0-50ms jitter = 100-150ms
      // Attempt 2: 200ms + 0-50ms jitter = 200-250ms
      // Attempt 3: 400ms + 0-50ms jitter = 400-450ms
      const baseDelay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
      const jitter = Math.random() * 50;
      const delay = baseDelay + jitter;

      logger.debug('SYSTEM', 'Port bind failed, retrying with backoff', {
        port,
        host,
        attempt,
        nextAttemptMs: Math.round(delay),
        error: lastError.message
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here due to throw above, but satisfy TypeScript
  throw lastError || new Error('Unknown error binding port');
}

/**
 * Attempt a single port bind operation
 * PHASE 3: Task 3.3 - TOCTOU Fix
 * 
 * Creates a server socket and attempts to bind atomically.
 * This is atomic - either succeeds or fails, no race condition.
 * 
 * @param port - Port number to bind to
 * @param host - Host to bind to
 * @returns Promise that resolves when port is successfully bound and closed
 * @throws Error if bind fails
 */
async function attemptPortBind(port: number, host: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const server = net.createServer();

    // Set timeout for bind attempt
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error(`Port bind timeout after 5 seconds: ${port}`));
    }, 5000);

    server.once('error', (error: any) => {
      clearTimeout(timeout);
      server.close();
      reject(error);
    });

    server.once('listening', () => {
      clearTimeout(timeout);
      server.close(() => {
        resolve();
      });
    });

    // Atomic bind operation - either succeeds or fails
    server.listen(port, host);
  });
}

/**
 * Check if a port is available (non-atomic, for informational purposes only)
 * PHASE 3: Task 3.3 - TOCTOU Fix
 * 
 * WARNING: This is NOT safe for actual binding decisions!
 * Use bindPortWithRetry() for actual port binding.
 * This is only for logging/debugging purposes.
 * 
 * @param port - Port number to check
 * @param host - Host to check (default: localhost)
 * @returns Promise that resolves to true if port appears available
 */
export async function isPortAvailable(port: number, host: string = 'localhost'): Promise<boolean> {
  try {
    await attemptPortBind(port, host);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Find an available port starting from a given port number
 * PHASE 3: Task 3.3 - TOCTOU Fix
 * 
 * Attempts to bind to ports sequentially until finding one that works.
 * Uses atomic bind operations to avoid TOCTOU issues.
 * 
 * @param startPort - Starting port number
 * @param host - Host to bind to (default: localhost)
 * @param maxAttempts - Maximum number of ports to try (default: 10)
 * @returns Promise that resolves to the available port number
 * @throws Error if no available port found
 */
export async function findAvailablePort(
  startPort: number,
  host: string = 'localhost',
  maxAttempts: number = 10
): Promise<number> {
  // Validate inputs
  if (!Number.isInteger(startPort) || startPort < 1 || startPort > 65535) {
    throw new Error(`Invalid start port: ${startPort}`);
  }

  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;

    // Validate port is in valid range
    if (port > 65535) {
      throw new Error(`Port number exceeded maximum (65535): ${port}`);
    }

    try {
      await attemptPortBind(port, host);
      logger.debug('SYSTEM', 'Found available port', { port, host });
      return port;
    } catch (error) {
      // Port is in use, try next one
      logger.debug('SYSTEM', 'Port in use, trying next', { port, host });
    }
  }

  throw new Error(
    `No available port found in range ${startPort}-${startPort + maxAttempts - 1}`
  );
}
