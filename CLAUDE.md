# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Bun/TypeScript monorepo (workspaces) containing tools for validating Web Components usage against [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (CEM) files. Uses [wireit](https://github.com/google/wireit) for incremental build caching.

### Packages

- **`projects/cli/`** (`@webq/cli`) — Bun/TypeScript CLI tool and MCP server for querying and validating CEM JSON files. Includes 18 HTML validation rules. See `projects/cli/CLAUDE.md` for details.
- **`projects/eslint/`** (`@webq/eslint`) — ESLint plugin that validates custom element HTML usage via `@html-eslint/parser`. Delegates validation to the `webq` CLI. See `projects/eslint/CLAUDE.md` for details.
- **`projects/schemas/`** — JSON schemas for custom-elements, custom-attributes, custom-patterns, custom-styles, DTCG tokens, and VSCode custom data formats.

## Quick Reference

### Monorepo (root)

```bash
bun install               # Install all dependencies
bun run ci                # Build + test all packages (wireit, cached)
bun run format            # Check formatting (prettier)
bun run format:fix        # Fix formatting
```

### CLI (`projects/cli`)

```bash
cd projects/cli
bun run ci                # Lint + test + build
bun test                  # Run tests
bun run build             # Build for all platforms
bun src/index.ts          # Run CLI directly
bun test src/internal/elements/store.test.ts  # Single test
```

### ESLint Plugin (`projects/eslint`)

```bash
cd projects/eslint
bun run ci                # Build + test (wireit, cached)
bun run build             # TypeScript compilation
bun test                  # Run all tests (vitest)
npx vitest run src/rules/no-unknown-attr.test.ts  # Single test
```

## Cross-Cutting Concepts

Both packages consume CEM JSON (`custom-elements.json`) files — the standard format for documenting Web Components. The ESLint plugin delegates validation to the `webq` CLI at lint time; the CLI provides runtime querying and HTML validation via CLI or MCP protocol. Both packages implement the same 18 validation rules.
