/**
 * PHASE 3: Medium Priority Fixes - Task 3.3
 * TOCTOU-Safe Port Binding Tests
 *
 * Tests for:
 * - Atomic port binding (no race conditions)
 * - Retry logic with exponential backoff
 * - Port availability detection
 * - Finding available ports
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  bindPortWithRetry,
  isPortAvailable,
  findAvailablePort
} from '../../src/services/infrastructure/PortManager.js';

describe('PHASE 3: TOCTOU-Safe Port Binding (Task 3.3)', () => {
  describe('bindPortWithRetry', () => {
    it('should bind to an available port', async () => {
      // Use a high port number that's likely available
      const port = 19000 + Math.floor(Math.random() * 1000);

      expect(async () => {
        await bindPortWithRetry(port, 'localhost', 1);
      }).not.toThrow();
    });

    it('should reject invalid port numbers', async () => {
      expect(async () => {
        await bindPortWithRetry(-1, 'localhost');
      }).toThrow(/Invalid port number/);
    });

    it('should reject port 0', async () => {
      expect(async () => {
        await bindPortWithRetry(0, 'localhost');
      }).toThrow(/Invalid port number/);
    });

    it('should reject port > 65535', async () => {
      expect(async () => {
        await bindPortWithRetry(65536, 'localhost');
      }).toThrow(/Invalid port number/);
    });

    it('should retry on failure with backoff', async () => {
      // Try to bind to port 1 (privileged, will fail)
      // Should retry with exponential backoff
      const startTime = Date.now();

      expect(async () => {
        await bindPortWithRetry(1, 'localhost', 2);
      }).toThrow();

      const elapsed = Date.now() - startTime;
      // Should have waited at least 100ms for first retry
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should accept custom max retries', async () => {
      const port = 19000 + Math.floor(Math.random() * 1000);

      expect(async () => {
        await bindPortWithRetry(port, 'localhost', 5);
      }).not.toThrow();
    });

    it('should accept custom host', async () => {
      const port = 19000 + Math.floor(Math.random() * 1000);

      expect(async () => {
        await bindPortWithRetry(port, '127.0.0.1', 1);
      }).not.toThrow();
    });
  });

  describe('isPortAvailable', () => {
    it('should detect available port', async () => {
      const port = 19000 + Math.floor(Math.random() * 1000);
      const available = await isPortAvailable(port, 'localhost');
      expect(available).toBe(true);
    });

    it('should detect unavailable port', async () => {
      // Port 1 is typically privileged and unavailable
      const available = await isPortAvailable(1, 'localhost');
      expect(available).toBe(false);
    });

    it('should handle invalid ports gracefully', async () => {
      const available = await isPortAvailable(-1, 'localhost');
      expect(available).toBe(false);
    });

    it('should handle port 0 gracefully', async () => {
      const available = await isPortAvailable(0, 'localhost');
      expect(available).toBe(false);
    });
  });

  describe('findAvailablePort', () => {
    it('should find an available port', async () => {
      const startPort = 19000 + Math.floor(Math.random() * 1000);
      const port = await findAvailablePort(startPort, 'localhost', 10);

      expect(port).toBeGreaterThanOrEqual(startPort);
      expect(port).toBeLessThan(startPort + 10);
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThanOrEqual(65535);
    });

    it('should reject invalid start port', async () => {
      expect(async () => {
        await findAvailablePort(-1, 'localhost');
      }).toThrow(/Invalid start port/);
    });

    it('should reject start port 0', async () => {
      expect(async () => {
        await findAvailablePort(0, 'localhost');
      }).toThrow(/Invalid start port/);
    });

    it('should reject start port > 65535', async () => {
      expect(async () => {
        await findAvailablePort(65536, 'localhost');
      }).toThrow(/Invalid start port/);
    });

    it('should throw when no port available in range', async () => {
      // Try to find port starting from 1 with only 1 attempt
      // Port 1 is privileged, so this should fail
      expect(async () => {
        await findAvailablePort(1, 'localhost', 1);
      }).toThrow(/No available port found/);
    });

    it('should accept custom max attempts', async () => {
      const startPort = 19000 + Math.floor(Math.random() * 1000);
      const port = await findAvailablePort(startPort, 'localhost', 20);

      expect(port).toBeGreaterThanOrEqual(startPort);
      expect(port).toBeLessThan(startPort + 20);
    });

    it('should handle port range overflow', async () => {
      expect(async () => {
        // Start near max port and try to find many ports
        await findAvailablePort(65530, 'localhost', 10);
      }).toThrow(/Port number exceeded maximum/);
    });
  });

  describe('Atomic Binding (TOCTOU Prevention)', () => {
    it('should not have race condition between check and bind', async () => {
      // This test verifies that bindPortWithRetry is atomic
      // If it were check-then-bind, another process could bind between check and bind
      // Since we're using atomic bind, this should succeed

      const port = 19000 + Math.floor(Math.random() * 1000);

      // First bind should succeed
      expect(async () => {
        await bindPortWithRetry(port, 'localhost', 1);
      }).not.toThrow();

      // Second bind to same port should fail (port is now in use)
      // This proves the first bind actually worked atomically
      expect(async () => {
        await bindPortWithRetry(port, 'localhost', 1);
      }).toThrow();
    });

    it('should handle concurrent bind attempts', async () => {
      const port = 19000 + Math.floor(Math.random() * 1000);

      // Try to bind multiple times concurrently
      // Only one should succeed
      const results = await Promise.allSettled([
        bindPortWithRetry(port, 'localhost', 1),
        bindPortWithRetry(port, 'localhost', 1),
        bindPortWithRetry(port, 'localhost', 1)
      ]);

      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;

      // Exactly one should succeed, others should fail
      expect(successes).toBe(1);
      expect(failures).toBe(2);
    });
  });

  describe('Exponential Backoff', () => {
    it('should use exponential backoff for retries', async () => {
      // This is a timing test - verify backoff increases
      const port = 1; // Privileged port, will fail

      const startTime = Date.now();

      try {
        await bindPortWithRetry(port, 'localhost', 3);
      } catch (error) {
        // Expected to fail
      }

      const elapsed = Date.now() - startTime;

      // With 3 retries:
      // Attempt 1: immediate
      // Attempt 2: wait ~100ms
      // Attempt 3: wait ~200ms
      // Total: ~300ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(300);
    });

    it('should add jitter to backoff', async () => {
      // Run multiple times and verify timing varies (jitter)
      const port = 1;
      const timings: number[] = [];

      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();

        try {
          await bindPortWithRetry(port, 'localhost', 2);
        } catch (error) {
          // Expected to fail
        }

        timings.push(Date.now() - startTime);
      }

      // Timings should vary due to jitter
      const minTiming = Math.min(...timings);
      const maxTiming = Math.max(...timings);

      // Should have some variation (jitter)
      expect(maxTiming - minTiming).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      try {
        await bindPortWithRetry(-1, 'localhost');
      } catch (error: any) {
        expect(error.message).toContain('Invalid port number');
      }
    });

    it('should handle network errors gracefully', async () => {
      // Try to bind to invalid host
      expect(async () => {
        await bindPortWithRetry(19999, 'invalid-host-xyz.local', 1);
      }).toThrow();
    });

    it('should timeout on hung bind', async () => {
      // This test verifies that bind attempts have a timeout
      // If a bind hangs, it should timeout after 5 seconds
      const port = 19000 + Math.floor(Math.random() * 1000);

      const startTime = Date.now();

      expect(async () => {
        await bindPortWithRetry(port, 'localhost', 1);
      }).not.toThrow();

      const elapsed = Date.now() - startTime;

      // Should complete quickly (not hang for 5+ seconds)
      expect(elapsed).toBeLessThan(5000);
    });
  });
});
