---
name: web components query (webq)
description: Query and validate Web Components using the webq CLI. Use when exploring custom elements, looking up component APIs, checking attributes/properties/events/slots/CSS, validating HTML against component definitions, or working with Custom Elements Manifest files.
allowed-tools: Bash(webq *)
---

# WebQ CLI

WebQ queries Custom Elements Manifest (CEM) JSON files to explore Web Components documentation.

## Setup

The `--path` flag (or `WEBQ_PATH` env var) is required for all commands. It accepts:

- A directory (searched recursively for `custom-elements.json` files): `--path ./node_modules`
- Comma-separated directories: `--path ./lib1,./node_modules/@org`

## Commands

### Discovery

```bash
# List all available custom elements
webq element.list --path ./node_modules

# Search by name, tag name, or description (case-insensitive)
webq search button --path ./node_modules
```

### Element Details

```bash
# Full documentation for an element
webq element my-button --path ./node_modules

# Targeted queries
webq element.attributes my-button --path ./node_modules    # HTML attributes
webq element.properties my-button --path ./node_modules    # JS properties/fields
webq element.methods my-button --path ./node_modules       # Callable methods
webq element.events my-button --path ./node_modules        # Emitted events
webq element.slots my-button --path ./node_modules         # Shadow DOM slots
webq element.css-properties my-button --path ./node_modules # CSS custom properties
webq element.css-parts my-button --path ./node_modules     # ::part() targets
webq element.commands my-button --path ./node_modules      # Invoker commands
```

### Validation

```bash
# Validate manifest structure
webq validate-manifest --path .

# Validate HTML against the manifest (runs 14 lint rules)
webq validate-html '<my-button variant="primary">Click</my-button>' --path ./node_modules

# JSON output (ESLint-compatible format)
webq validate-html '<my-button unknown-attr></my-button>' --path ./node_modules --json
```

#### HTML Validation Rules

**Errors:** `no-unknown-element`, `no-unknown-attr`, `no-unknown-attr-value`, `no-unknown-event`, `no-unknown-slot`, `no-unknown-command`, `no-unknown-css-part`, `no-unknown-css-custom-property`

**Warnings:** `no-deprecated-element`, `no-deprecated-attr`, `no-deprecated-event`, `no-deprecated-slot`, `no-deprecated-command`, `no-boolean-attr-value`

## Output Formats

- **Default**: Formatted markdown rendered to the terminal.
- **JSON**: Add `--json` for machine-readable output (e.g. `webq element my-button --path . --json`).

## Recommended Workflow

1. Run `webq element.list --path <path>` to discover available components.
2. Use `webq search <query> --path <path>` to narrow down by keyword.
3. Use `webq element <tag> --path <path>` for full docs, or the specific `element.*` commands for targeted lookups.
4. Use `webq validate-html '<html>' --path <path>` to check HTML for incorrect usage.
5. Use `--json` when you need to parse output programmatically.

## Tips

- Point `--path` at `./node_modules` to scan all installed Web Component libraries at once.
- Set `export WEBQ_PATH=./node_modules` to avoid repeating the flag.
- Use `element.attributes` for HTML authoring and `element.properties` for JavaScript API questions.
- `element.css-properties` returns CSS variables for theming; `element.css-parts` returns `::part()` targets for deeper style customization.
- `validate-html` checks for unknown/deprecated elements, attributes, events, slots, commands, CSS parts, and CSS custom properties.
