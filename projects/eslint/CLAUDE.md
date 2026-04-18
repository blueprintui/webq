# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run ci          # Full CI: build + test (via wireit, parallel with caching)
bun run build       # TypeScript compilation to dist/
bun test            # Run all tests
bun test src/rules/no-unknown-attr.test.ts  # Run a single test file
```

Build and test use [wireit](https://github.com/google/wireit) for incremental caching. The `ci` script runs both as wireit dependencies.

## Architecture

This is an ESLint plugin (`@webq/eslint`) that validates custom element usage in HTML against a [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (CEM) file. It works with `@html-eslint/parser` and targets ESLint 9+ flat config.

### How it works

Rules delegate all validation to the `@webq/cli` validation engine in-process (no subprocess). Each rule hooks the `Document` visitor, passes the full HTML source to `runWebqValidation()` (in `src/utils/webq.ts`), and filters returned messages by `ruleId`. `runWebqValidation()` imports `verify`, `allRules`, and the stores (`Store`, `PatternStore`, `CustomAttributeStore`, `CustomStyleStore`) from `@webq/cli/validate` and runs them directly. Results are cached by `path + html` so multiple rules processing the same file only validate once; stores are cached by `path` so CEM JSON files are read and parsed once per lint run.

Manifest and optional config files (`custom-elements.json`, `custom-patterns.json`, `custom-attributes.json`, `custom-styles.json`) are discovered by walking the directory tree provided in the rule's `path` option, skipping common build/cache directories.

### Source layout

- `src/index.ts` — Plugin entry point. Exports `rules`, `configs`, and a `recommended(options)` helper.
- `src/utils/webq.ts` — In-process validation entry point. Resolves stores, runs `verify()` from `@webq/cli/validate`, caches per-file messages and per-path stores.
- `src/utils/schema.ts` — Shared ESLint option schema, global HTML attribute list, `isCustomElement()` helper.
- `src/rules/` — One file per rule, tests co-located (`*.test.ts`). Test fixture CEM at `src/rules/custom-elements.json`.

### Adding a new rule

1. Create `src/rules/<rule-name>.ts` using existing rules as a template
2. Register in `src/index.ts` (import, add to `rules` object, add to `recommended()`)
3. Create `src/rules/<rule-name>.test.ts` using `RuleTester` with `@html-eslint/parser`
4. The test fixture CEM (`src/rules/custom-elements.json`) can be extended if needed

Rules cast return values as `unknown as Rule.RuleListener` because ESLint's types don't know about html-eslint's `Document` visitor.
