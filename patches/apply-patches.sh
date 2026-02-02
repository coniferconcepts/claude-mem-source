#!/bin/bash
# Script to apply all patches to claude-mem-source

set -e

echo "Applying patches to claude-mem-source..."
cd /Users/benjaminerb/CODE/claude-mem-source

# Check if patches exist
if [ ! -d "patches" ]; then
  echo "❌ Patches directory not found"
  exit 1
fi

# Apply patches in order
for patch in patches/*.patch; do
  if [ -f "$patch" ]; then
    echo "📦 Applying: $(basename $patch)"
    git apply "$patch" || {
      echo "❌ Failed to apply: $(basename $patch)"
      echo "You may need to apply manually"
      exit 1
    }
    echo "✅ Applied: $(basename $patch)"
  fi
done

echo ""
echo "✅ All patches applied successfully!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Run tests: bun test"
echo "  3. Commit: git add -A && git commit -m 'security: Apply Phase 3 security patches'"
