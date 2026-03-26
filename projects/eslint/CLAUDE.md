# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run ci          # Full CI: build + test (via wireit, parallel with caching)
npm run build       # TypeScript compilation to dist/
npm test            # Run all tests
npm run test:watch  # Watch mode
npx vitest run src/rules/no-unknown-attr.test.ts  # Run a single test file
```

Build and test use [wireit](https://github.com/google/wireit) for incremental caching. The `ci` script runs both as wireit dependencies.

## Architecture

This is an ESLint plugin (`@webq/eslint`) that validates custom element usage in HTML against a [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (CEM) file. It works with `@html-eslint/parser` and targets ESLint 9+ flat config.

### How it works

Rules delegate all validation to the `webq` Go CLI tool. Each rule hooks the `Document` visitor, passes the full HTML source to `runWebqValidation()` (in `src/utils/webq.ts`), and filters returned messages by `ruleId`. Results are cached by `cemPath + html` to avoid redundant webq invocations across rules in the same file.

The `webq` binary must be installed separately (`go install github.com/blueprintui/webq@latest` or via pre-built binaries). If webq is not found on PATH, a warning is printed once and rules return no errors.

### Source layout

- `src/index.ts` — Plugin entry point. Exports `rules`, `configs`, and a `recommended(options)` helper.
- `src/utils/webq.ts` — Wrapper for the webq CLI. Runs `webq validate-html --json`, parses JSON output, and caches results per `cemPath + html`.
- `src/utils/schema.ts` — Shared ESLint option schema, global HTML attribute list, `isCustomElement()` helper.
- `src/rules/` — One file per rule, tests co-located (`*.test.ts`). Test fixture CEM at `src/rules/custom-elements.json`.

### Adding a new rule

1. Create `src/rules/<rule-name>.ts` using existing rules as a template
2. Register in `src/index.ts` (import, add to `rules` object, add to `recommended()`)
3. Create `src/rules/<rule-name>.test.ts` using `RuleTester` with `@html-eslint/parser`
4. The test fixture CEM (`src/rules/custom-elements.json`) can be extended if needed

Rules cast return values as `unknown as Rule.RuleListener` because ESLint's types don't know about html-eslint's `Tag` visitor. Report nodes also need `as unknown as Rule.Node` casts.
