# Patches Applied to claude-mem-source

This directory contains patches applied to the upstream claude-mem fork for Conifer Concepts' use.

## Overview

These patches address security and stability issues identified during production use. They include:

1. **Input Validation** - Size limits and character sanitization
2. **Process Verification** - PID reuse detection and race condition prevention
3. **TOCTOU-Safe Port Binding** - Atomic port operations with retry logic

## Patch List

### 001-input-validation.patch
**File**: `src/services/sqlite/SessionStore.ts`
**Status**: ✅ Applied

Adds input validation to prevent SQL injection and resource exhaustion:
- Session ID/project name limit: 10KB (10,000 characters)
- User prompt limit: 100KB (100,000 characters)
- Character validation to prevent SQL/shell injection
- Integrated into `createSDKSession()`

**Why Needed**: Prevents malicious input from causing SQL injection or exhausting resources.

**Upstream Potential**: High - these are security best practices.

### 002-process-verification.patch
**File**: `src/services/infrastructure/ProcessManager.ts`
**Status**: ✅ Applied

Adds process verification to prevent killing wrong processes:
- Parent PID validation
- Process age checking
- Race condition detection
- Integrated into `cleanupOrphanedProcesses()`

**Why Needed**: Prevents race conditions where a PID might be reused by a different process.

**Upstream Potential**: Medium - important for process safety.

### 003-port-manager.patch
**File**: `src/services/infrastructure/PortManager.ts` (NEW)
**Status**: ✅ Applied

New module for TOCTOU-safe port binding:
- Atomic bind operations
- Exponential backoff with jitter
- Timeout protection
- Port availability checking

**Why Needed**: Prevents Time-of-Check-Time-of-Use race conditions in port binding.

**Upstream Potential**: High - improves reliability significantly.

### 004-test-coverage.patch
**Files**: 
- `tests/phase3-input-validation.test.ts`
- `tests/infrastructure/phase3-process-verification.test.ts`
- `tests/infrastructure/phase3-port-manager.test.ts`
**Status**: ✅ Applied

Comprehensive test coverage for all patches:
- 20+ tests for input validation
- 15+ tests for process verification
- 20+ tests for port manager

**Why Needed**: Ensures patches work correctly and don't break existing functionality.

**Upstream Potential**: High - test coverage is always valuable.

## Applying Patches

### Method 1: Git Apply (Recommended)

```bash
cd /Users/benjaminerb/CODE/claude-mem-source

# Apply each patch in order
git apply patches/001-input-validation.patch
git apply patches/002-process-verification.patch
git apply patches/003-port-manager.patch
git apply patches/004-test-coverage.patch

# Commit
git add -A
git commit -m "security: Apply Phase 3 security patches

- Input validation (SQL injection prevention)
- Process verification (PID reuse detection)
- TOCTOU-safe port binding
- Comprehensive test coverage"
```

### Method 2: Manual Copy

For new files (PortManager.ts, test files), simply copy them to the appropriate locations.

For modified files, manually apply the changes using the .patch files as guides.

## Creating New Patches

To create a patch from modifications:

```bash
# Make your changes to the code
# Then create a patch
git diff > patches/005-your-patch-name.patch

# Update this README
echo "### 005-your-patch-name.patch" >> patches/README.md
```

## Syncing with Upstream

When syncing with upstream:

1. Fetch upstream changes: `git fetch upstream`
2. Create sync branch: `git checkout -b sync/upstream-$(date +%Y%m%d)`
3. Merge upstream: `git merge upstream/main`
4. **Check for conflicts in patched files**
5. If conflicts exist, resolve carefully preserving our patches
6. Re-apply patches if needed: `git apply patches/*.patch`
7. Run tests to verify: `bun test`

## Testing Patches

```bash
# Run all tests
bun test

# Run specific patch tests
bun test tests/phase3-input-validation.test.ts
bun test tests/infrastructure/phase3-process-verification.test.ts
bun test tests/infrastructure/phase3-port-manager.test.ts
```

## Security Considerations

These patches address:
- **CWE-89**: SQL Injection (via input validation)
- **CWE-362**: Race Conditions (via TOCTOU-safe operations)
- **CWE-362**: Concurrent Execution using Shared Resource (via process verification)

## License

These patches are provided under the same AGPL-3.0 license as the upstream project.

## Contact

For questions about these patches:
- Issues: https://github.com/coniferconcepts/claude-mem-source/issues
- Upstream: https://github.com/thedotmack/claude-mem/issues (for upstream suggestions)

---

**Last Updated**: 2026-02-02
**Patches Version**: 1.0.0
**Applies To**: claude-mem v9.0.12
