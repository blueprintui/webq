#!/bin/bash
set -e
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || cd "$(git rev-parse --show-toplevel)" 2>/dev/null || exit 0
bun run format:fix && bun run lint && bun run test && bun run build
