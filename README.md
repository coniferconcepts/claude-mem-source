# claude-mem-source

> **Fork of [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem) with upstream tracking and Conifer Concepts patches**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/coniferconcepts/claude-mem-source/ci.yml?branch=main)](https://github.com/coniferconcepts/claude-mem-source/actions)

This repository is a fork of the original Claude Mem plugin by [Alex Newman](https://github.com/thedotmack), maintained by Conifer Concepts with additional patches and upstream tracking.

## Overview

**Claude Mem** is a memory layer for Claude Desktop that enables:
- Persistent conversation memory across sessions
- Semantic search using ChromaDB vector database
- Automatic context window management
- Project-aware memory organization

## Architecture

This repository contains the **core memory service** (worker process):
- SQLite database for memory storage
- ChromaDB for vector embeddings
- HTTP API on port 37777
- MCP (Model Context Protocol) integration

## Installation

### As a Git Submodule (Recommended)

```bash
cd your-project
git submodule add https://github.com/coniferconcepts/claude-mem-source.git .claude/plugins/claude-mem
git submodule update --init --recursive
```

### Manual Clone

```bash
git clone https://github.com/coniferconcepts/claude-mem-source.git
cd claude-mem-source
npm install
npm run build
```

## Upstream Tracking

This fork maintains connection to the original upstream repository:

```bash
# Fetch upstream changes
git fetch upstream
git checkout main
git merge upstream/main

# Push to our fork
git push origin main
```

### Current Status
- **Upstream**: https://github.com/thedotmack/claude-mem
- **Our Fork**: https://github.com/coniferconcepts/claude-mem-source
- **Tracking Branch**: `main`
- **Last Sync**: (update manually after syncs)

## Patches Applied

This fork includes the following modifications from upstream:

1. *(To be documented as patches are applied)*

To see the exact differences:
```bash
git log upstream/main..main --oneline
```

## Development

### Setup

```bash
npm install
npm run dev
```

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## Integration

This repository is designed to work with:
- **opencode-memory-bridge**: OpenCode plugin that provides hooks and integration
- **Claude Desktop**: Primary client for the memory service
- **Any MCP-compatible client**: Uses standard Model Context Protocol

## License

**AGPL-3.0** - This is inherited from the original upstream project.

See [LICENSE](./LICENSE) for full terms.

## Related Repositories

- [opencode-memory-bridge](https://github.com/coniferconcepts/opencode-memory-bridge) - OpenCode integration layer
- [opencode-global-config](https://github.com/coniferconcepts/opencode-global-config) - Hook interfaces and configuration
- [Original Upstream](https://github.com/thedotmack/claude-mem) - thedotmack's original project

## Contributing

Since this is a fork of upstream:
1. **Upstream bugs/features**: Submit to [thedotmack/claude-mem](https://github.com/thedotmack/claude-mem)
2. **Fork-specific patches**: Submit PRs to this repository
3. **Integration issues**: Check [opencode-memory-bridge](https://github.com/coniferconcepts/opencode-memory-bridge)

## Support

- **Upstream Issues**: https://github.com/thedotmack/claude-mem/issues
- **Fork Issues**: https://github.com/coniferconcepts/claude-mem-source/issues
- **Integration Issues**: https://github.com/coniferconcepts/opencode-memory-bridge/issues

## Acknowledgments

- Original plugin by [Alex Newman](https://github.com/thedotmack)
- Conifer Concepts maintenance and patches
