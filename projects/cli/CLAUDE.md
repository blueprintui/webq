# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebQ is a Bun/TypeScript CLI tool and MCP (Model Context Protocol) server for querying and validating Custom Elements Manifest (CEM) JSON files. It is a 1:1 port of the Go `webq` tool at `../webq/`. It enables AI assistants and CLI users to explore Web Components documentation and validate HTML usage against CEM definitions.

## Build Commands

```bash
bun install           # Install dependencies
bun run build         # Build for current platform (output: dist/webq)
bun run build:all     # Cross-compile for all platforms
bun test              # Run tests (vitest via bun)
bun src/index.ts      # Run CLI directly via Bun
```

### Running a Single Test

```bash
bun test src/internal/elements/store.test.ts
bun test src/internal/validate/rules/no-unknown-attr.test.ts
```

## Architecture

### Package Structure

- `src/cli.ts` - Yargs CLI commands (all commands in one file)
- `src/cli/helpers.ts` - Shared CLI helpers (store creation, config loading, path resolution)
- `src/cli/format.ts` - Markdown formatters for terminal output
- `src/internal/elements/` - Core CEM logic (types, parsing, querying, resolving)
- `src/internal/config/` - Config file loading (`webq.config.json`)
- `src/internal/mcp/` - MCP server implementation (tools and resources)
- `src/internal/validate/` - HTML validation engine (parser, rules, runner)
- `src/internal/validate/rules/` - Individual validation rules (18 rules)
- `src/internal/patterns/` - Compositional patterns support
- `src/internal/attributes/` - Custom attributes support
- `src/internal/styles/` - Custom styles support
- `src/internal/vscode/` - VSCode custom data adapter
- `src/internal/resolve/` - Shared file discovery logic
- `testdata/` - Test fixtures

### Key Components

**Store (`src/internal/elements/store.ts`)**: Central query engine that indexes manifests on creation. Provides fast lookups via `tagName → Declaration` and `path → Module` maps.

**HTML Parser (`src/internal/validate/html.ts`)**: Custom HTML tokenizer with character-level attribute parsing for precise line:col position tracking. Uses `LineIndex` with binary search for byte offset → position mapping.

**Validation Engine (`src/internal/validate/validate.ts`)**: Runs 18 rules against parsed HTML. Rules self-register via `registerRule()` in `rules/index.ts`. Supports `ConfigurableRule`, `PatternAwareRule`, `StyleAwareRule`, `CustomAttrAwareRule` interfaces.

**MCP Server (`src/internal/mcp/server.ts`)**: Uses `@modelcontextprotocol/sdk` with `StdioServerTransport`. Registers 17 tools and resources for element/pattern/attribute/style queries plus HTML validation.

### Output Handling

JSON command results go to stdout via `console.log()`. Human-readable output goes to stderr via `process.stderr.write()`. Exit code 1 if validation errors found.

### Path Resolution

Priority: `--path` CLI flag > `webq.config.json` `global.path` > `WEBQ_PATH` env var.

### Validation Rules (18 total)

**Errors (10):** `no-unknown-element`, `no-unknown-attr`, `no-unknown-attr-value`, `no-unknown-event`, `no-unknown-slot`, `no-unknown-command`, `no-unknown-css-part`, `no-unknown-css-custom-property`, `no-missing-required-child`, `no-missing-sibling-binding`

**Warnings (8):** `no-deprecated-element`, `no-deprecated-attr`, `no-deprecated-event`, `no-deprecated-slot`, `no-deprecated-command`, `no-boolean-attr-value`, `no-unknown-style-value`, `no-unknown-custom-attr-value`

## Code Style

- Functions should have at most 3 parameters, prefer 1 or 2
- Prefer explicit, readable code over generic abstractions
- Mirror Go source structure for easy cross-reference with `../webq/`
