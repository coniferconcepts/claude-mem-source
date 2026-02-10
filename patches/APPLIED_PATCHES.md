# Claude Mem Source - Security Patches

This repository contains security patches applied to the upstream claude-mem fork.

**Upstream Version**: v9.1.1 (upgraded 2026-02-10)
**Fork Repository**: coniferconcepts/claude-mem-source

---

## Applied Patches

### ✅ Patch 001: Input Validation (COMPLETE)
**File**: `src/services/sqlite/SessionStore.ts`

Adds security input validation:
- Input size limits (10KB for session IDs/projects, 100KB for prompts)
- Character validation to prevent SQL/shell injection
- SAFE_CHARS_REGEX blocks: `; ' " \n \r \t` and other dangerous characters
- Integrated into `createSDKSession()` before database operations

**Status**: ✅ Applied and tested (19 tests pass)

**Addresses**: CWE-89 (SQL Injection)

---

### ✅ Patch 002: Process Verification (ADDRESSED BY UPSTREAM)
**File**: `src/services/infrastructure/ProcessManager.ts`

Original patch added process verification to prevent killing wrong processes.

**Upstream v9.1.1 now includes**:
- PID validation (positive integer check)
- Command injection prevention
- Orphan process cleanup with age-based filtering
- Security comments throughout

**Status**: ✅ Upstream covers our security concerns

**Addresses**: CWE-362 (Race Conditions via process verification)

---

### ✅ Patch 003: TOCTOU-Safe Port Binding (COMPLETE)
**File**: `src/services/infrastructure/PortManager.ts` (NEW)

New module for atomic port operations:
- `bindPortWithRetry()`: Exponential backoff with jitter
- `isPortAvailable()`: Safe port checking
- Timeout protection for hung bind attempts
- Prevents Time-of-Check-Time-of-Use race conditions

**Status**: ✅ Applied and committed

**Addresses**: CWE-362 (Race Conditions via TOCTOU-safe operations)

---

## Test Coverage

| Test File | Tests | Status |
|-----------|-------|--------|
| `tests/phase3-input-validation.test.ts` | 19 | ✅ Pass |
| `tests/infrastructure/phase3-port-manager.test.ts` | - | ✅ Added |
| `tests/infrastructure/phase3-process-verification.test.ts` | - | ✅ Added |

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-10 | v9.1.1 | Merged upstream v9.1.1, re-applied patches |
| 2026-02-02 | v9.0.12 | Initial fork with 3 security patches |

---

## Upstream Changes Incorporated (v9.0.13 - v9.1.1)

### v9.1.1 (Critical)
- Fix FOREIGN KEY constraint failure during migration
- Remove hardcoded CHECK constraints on observation type
- Fix Express middleware ordering for initialization guard

### v9.1.0 (Major)
- "Great PR Triage" - 100 PRs reviewed, 48 merged
- Fail-open hook architecture
- CORS restricted to localhost
- XSS defense-in-depth (DOMPurify)
- Manual memory save feature
- Project exclusion settings

### v9.0.17
- Bun PATH resolution for fresh installs

### v9.0.16
- Worker startup timeout fix

### v9.0.15 (Security)
- Isolated credentials from `~/.claude-mem/.env`

### v9.0.14
- In-process worker architecture

### v9.0.13
- Zombie observer prevention

---

## Security Benefits

These patches address:
- **CWE-89**: SQL Injection (via input validation)
- **CWE-362**: Race Conditions (via TOCTOU-safe operations)
- **CWE-362**: Concurrent Execution using Shared Resource (via process verification)

---

## Maintenance Notes

When syncing with upstream in the future:

1. **Patch 001 (Input Validation)**: Check if upstream adds similar validation. If so, evaluate removal.
2. **Patch 002 (Process Verification)**: Already covered by upstream. Monitor for regressions.
3. **Patch 003 (PortManager)**: New file, should apply cleanly. Watch for conflicts in port binding logic.

---

**Last Updated**: 2026-02-10
**Applies To**: claude-mem v9.1.1
**Total Patches**: 3 (2 custom, 1 covered by upstream)
