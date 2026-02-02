# Claude Mem Source - Security Patches

This repository contains security patches applied to the upstream claude-mem fork.

## Applied Patches

### ✅ Patch 001: Input Validation (COMPLETE)
**File**: `src/services/sqlite/SessionStore.ts`

Adds security input validation:
- Input size limits (10KB for session IDs/projects, 100KB for prompts)
- Character validation to prevent SQL/shell injection
- Integrated into `createSDKSession()` before database operations

**Status**: Applied and committed

### ⏳ Patch 002: Process Verification (PENDING)
**File**: `src/services/infrastructure/ProcessManager.ts`

Adds process verification to prevent killing wrong processes:
- Parent PID validation
- Process age checking
- Race condition detection

**Status**: Identified in content-tracker, needs extraction and application

### ⏳ Patch 003: TOCTOU-Safe Port Binding (PENDING)
**File**: `src/services/infrastructure/PortManager.ts` (NEW)

New module for atomic port operations:
- Atomic bind operations
- Exponential backoff with jitter
- Timeout protection

**Status**: Identified in content-tracker, needs extraction and application

## How to Apply Remaining Patches

The remaining patches are in `/Users/benjaminerb/CODE/content-tracker/.claude/plugins/claude-mem/`:

1. **ProcessManager.ts changes**: Compare with upstream and apply diff
2. **PortManager.ts**: Copy new file from content-tracker
3. **Test files**: Copy test coverage files

## Quick Commands

```bash
# Check differences
diff /Users/benjaminerb/CODE/claude-mem-source/src/services/infrastructure/ProcessManager.ts \
     /Users/benjaminerb/CODE/content-tracker/.claude/plugins/claude-mem/src/services/infrastructure/ProcessManager.ts

# Copy PortManager.ts
cp /Users/benjaminerb/CODE/content-tracker/.claude/plugins/claude-mem/src/services/infrastructure/PortManager.ts \
   /Users/benjaminerb/CODE/claude-mem-source/src/services/infrastructure/
```

## Security Benefits

These patches address:
- **CWE-89**: SQL Injection (via input validation)
- **CWE-362**: Race Conditions (via TOCTOU-safe operations)
- **CWE-362**: Concurrent Execution using Shared Resource (via process verification)

## Next Steps

1. Extract ProcessManager.ts diff and apply
2. Copy PortManager.ts new file
3. Copy test files for coverage
4. Commit all patches
5. Test with `bun test`

---

**Patch Date**: 2026-02-02
**Applies To**: claude-mem v9.0.12
