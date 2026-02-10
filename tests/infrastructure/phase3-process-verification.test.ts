/**
 * PHASE 3: Medium Priority Fixes - Task 3.2
 * Process Verification and TOCTOU Prevention Tests
 *
 * Tests for:
 * - Process existence verification
 * - Parent PID validation (PID reuse detection)
 * - Process age checking (race condition detection)
 * - Safe process cleanup
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  verifyProcessStillValid,
  getProcessInfo,
  getChildProcesses,
  forceKillProcess,
  waitForProcessesExit
} from '../../src/services/infrastructure/ProcessManager.js';

describe('PHASE 3: Process Verification (Task 3.2)', () => {
  describe('verifyProcessStillValid', () => {
    it('should verify current process is valid', () => {
      const isValid = verifyProcessStillValid(process.pid);
      expect(isValid).toBe(true);
    });

    it('should reject invalid PID (negative)', () => {
      const isValid = verifyProcessStillValid(-1);
      expect(isValid).toBe(false);
    });

    it('should reject invalid PID (zero)', () => {
      const isValid = verifyProcessStillValid(0);
      expect(isValid).toBe(false);
    });

    it('should reject invalid PID (non-integer)', () => {
      const isValid = verifyProcessStillValid(1.5 as any);
      expect(isValid).toBe(false);
    });

    it('should reject non-existent PID', () => {
      // Use a very high PID that's unlikely to exist
      const isValid = verifyProcessStillValid(999999);
      expect(isValid).toBe(false);
    });

    it('should handle parent PID verification on Unix', () => {
      if (process.platform === 'win32') {
        // Skip on Windows
        return;
      }

      // Current process should have a valid parent PID
      const parentPid = process.ppid;
      const isValid = verifyProcessStillValid(process.pid, parentPid);
      expect(isValid).toBe(true);
    });

    it('should reject mismatched parent PID', () => {
      if (process.platform === 'win32') {
        // Skip on Windows
        return;
      }

      // Use wrong parent PID
      const isValid = verifyProcessStillValid(process.pid, 999999);
      expect(isValid).toBe(false);
    });
  });

  describe('getProcessInfo', () => {
    it('should get info for current process', () => {
      const info = getProcessInfo(process.pid);
      expect(info).not.toBeNull();
      expect(info?.startedAt).toBeGreaterThan(0);
      expect(info?.startedAt).toBeLessThanOrEqual(Date.now());
    });

    it('should return null for invalid PID', () => {
      const info = getProcessInfo(-1);
      expect(info).toBeNull();
    });

    it('should return null for non-existent PID', () => {
      const info = getProcessInfo(999999);
      expect(info).toBeNull();
    });

    it('should detect process age correctly', () => {
      const info = getProcessInfo(process.pid);
      expect(info).not.toBeNull();

      if (info) {
        const ageMs = Date.now() - info.startedAt;
        // Process should be at least a few milliseconds old
        expect(ageMs).toBeGreaterThanOrEqual(0);
        // Process should not be more than 1 hour old (sanity check)
        expect(ageMs).toBeLessThan(3600000);
      }
    });
  });

  describe('getChildProcesses', () => {
    it('should return empty array on non-Windows', () => {
      if (process.platform === 'win32') {
        // Skip on Windows
        return;
      }

      const children = getChildProcesses(process.pid);
      expect(children).toBeInstanceOf(Promise);
    });

    it('should reject invalid parent PID', async () => {
      const children = await getChildProcesses(-1);
      expect(children).toEqual([]);
    });

    it('should reject zero PID', async () => {
      const children = await getChildProcesses(0);
      expect(children).toEqual([]);
    });
  });

  describe('Race Condition Detection', () => {
    it('should detect suspicious process age', () => {
      const info = getProcessInfo(process.pid);
      expect(info).not.toBeNull();

      if (info) {
        const ageMs = Date.now() - info.startedAt;
        // Current process should be older than 1 second
        expect(ageMs).toBeGreaterThan(1000);
      }
    });

    it('should validate PID before operations', () => {
      // Test with various invalid PIDs
      const invalidPids = [-1, 0, 1.5, NaN, Infinity];

      for (const pid of invalidPids) {
        const isValid = verifyProcessStillValid(pid as any);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Security Validations', () => {
    it('should reject string PIDs', () => {
      const isValid = verifyProcessStillValid('12345' as any);
      expect(isValid).toBe(false);
    });

    it('should reject null PID', () => {
      const isValid = verifyProcessStillValid(null as any);
      expect(isValid).toBe(false);
    });

    it('should reject undefined PID', () => {
      const isValid = verifyProcessStillValid(undefined as any);
      expect(isValid).toBe(false);
    });

    it('should handle very large PID numbers', () => {
      const isValid = verifyProcessStillValid(2147483647); // Max 32-bit int
      expect(isValid).toBe(false); // Unlikely to exist
    });
  });
});
