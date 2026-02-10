/**
 * PHASE 3: Medium Priority Fixes - Task 3.1
 * Input Size Limits and Character Validation Tests
 *
 * Tests for:
 * - Input size validation (contentSessionId, project, userPrompt)
 * - Character validation for project names
 * - Rejection of oversized inputs
 * - Rejection of invalid characters
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { SessionStore } from '../src/services/sqlite/SessionStore.js';

describe('PHASE 3: Input Size Limits and Character Validation', () => {
  let db: Database;
  let store: SessionStore;

  beforeEach(() => {
    // Use in-memory database for testing
    db = new Database(':memory:');
    store = new SessionStore(':memory:');
  });

  afterEach(() => {
    if (store && store.db) {
      store.db.close();
    }
  });

  describe('Task 3.1: Input Size Validation', () => {
    it('should accept valid inputs', () => {
      const sessionId = 'valid-session-123';
      const project = 'my-project';
      const prompt = 'This is a valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).not.toThrow();
    });

    it('should reject oversized contentSessionId', () => {
      const sessionId = 'x'.repeat(10001); // Exceeds 10KB limit
      const project = 'my-project';
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).toThrow(/contentSessionId too long/);
    });

    it('should reject oversized project name', () => {
      const sessionId = 'valid-session';
      const project = 'x'.repeat(10001); // Exceeds 10KB limit
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).toThrow(/project name too long/);
    });

    it('should reject oversized user prompt', () => {
      const sessionId = 'valid-session';
      const project = 'my-project';
      const prompt = 'x'.repeat(100001); // Exceeds 100KB limit

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).toThrow(/user prompt too long/);
    });

    it('should accept maximum valid sizes', () => {
      const sessionId = 'x'.repeat(10000); // Exactly at limit
      const project = 'y'.repeat(10000); // Exactly at limit
      const prompt = 'z'.repeat(100000); // Exactly at limit

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).not.toThrow();
    });

    it('should accept empty project and prompt (SAVE hook pattern)', () => {
      const sessionId = 'valid-session-123';
      const project = '';
      const prompt = '';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).not.toThrow();
    });
  });

  describe('Task 3.1: Character Validation', () => {
    it('should accept alphanumeric project names', () => {
      const sessionId = 'session-123';
      const project = 'MyProject123';
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).not.toThrow();
    });

    it('should accept spaces in project names', () => {
      const sessionId = 'session-123';
      const project = 'My Project Name';
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).not.toThrow();
    });

    it('should accept common punctuation in project names', () => {
      const sessionId = 'session-123';
      const project = 'my-project_v1.0 (test)';
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).not.toThrow();
    });

    it('should reject special characters in project names', () => {
      const sessionId = 'session-123';
      const project = 'my-project; DROP TABLE sessions;--';
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).toThrow(/Invalid characters in project name/);
    });

    it('should reject shell metacharacters in project names', () => {
      const sessionId = 'session-123';
      const project = 'my-project | cat /etc/passwd';
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).toThrow(/Invalid characters in project name/);
    });

    it('should reject backticks in project names', () => {
      const sessionId = 'session-123';
      const project = 'my-project`whoami`';
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).toThrow(/Invalid characters in project name/);
    });

    it('should reject newlines in project names', () => {
      const sessionId = 'session-123';
      const project = 'my-project\nmalicious';
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).toThrow(/Invalid characters in project name/);
    });
  });

  describe('Task 3.1: Edge Cases', () => {
    it('should handle unicode characters in prompts', () => {
      const sessionId = 'session-123';
      const project = 'my-project';
      const prompt = 'Unicode test: 你好世界 🌍 مرحبا';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).not.toThrow();
    });

    it('should handle very long but valid project names', () => {
      const sessionId = 'session-123';
      const project = 'my-project-' + 'x'.repeat(9980); // Just under limit
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).not.toThrow();
    });

    it('should handle whitespace-only project names', () => {
      const sessionId = 'session-123';
      const project = '   '; // Only spaces
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).not.toThrow();
    });
  });

  describe('Task 3.1: Database Integrity', () => {
    it('should store valid inputs correctly', () => {
      const sessionId = 'test-session-001';
      const project = 'test-project';
      const prompt = 'Test prompt content';

      const dbId = store.createSDKSession(sessionId, project, prompt);
      expect(dbId).toBeGreaterThan(0);

      // Verify data was stored
      const session = store.getSessionById(dbId);
      expect(session).not.toBeNull();
      expect(session?.content_session_id).toBe(sessionId);
      expect(session?.project).toBe(project);
      expect(session?.user_prompt).toBe(prompt);
    });

    it('should be idempotent with same inputs', () => {
      const sessionId = 'test-session-002';
      const project = 'test-project';
      const prompt = 'Test prompt';

      const dbId1 = store.createSDKSession(sessionId, project, prompt);
      const dbId2 = store.createSDKSession(sessionId, project, prompt);

      expect(dbId1).toBe(dbId2);
    });

    it('should prevent SQL injection via project name', () => {
      const sessionId = 'session-123';
      const project = "test'; DROP TABLE sdk_sessions; --";
      const prompt = 'Valid prompt';

      expect(() => {
        store.createSDKSession(sessionId, project, prompt);
      }).toThrow(/Invalid characters in project name/);

      // Verify table still exists
      const tables = store.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sdk_sessions'"
      ).all();
      expect(tables.length).toBe(1);
    });
  });
});
