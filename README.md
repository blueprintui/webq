# WebQ Node

A CLI tool for querying and validating Custom Elements Manifest (CEM) JSON files. It can also run as an MCP (Model Context Protocol) server for AI assistants. This is a Bun/TypeScript port of the [Go `webq` tool](../webq/).

## Installation

Requires [Bun](https://bun.sh) 1.0+.

```bash
bun install
```

### Pre-built Binaries

Download the appropriate binary for your platform from the [releases page](https://github.com/blueprintui/webq/releases).

| Platform | Architecture          | Download               |
| -------- | --------------------- | ---------------------- |
| macOS    | Apple Silicon (arm64) | `webq-macos-arm64`     |
| macOS    | Intel (x64)           | `webq-macos-x64`       |
| Linux    | arm64                 | `webq-linux-arm64`     |
| Linux    | x86_64 (x64)          | `webq-linux-x64`       |
| Windows  | x86_64 (x64)          | `webq-windows-x64.exe` |

## Configuration

### Config File

Create a `webq.config.json` in your project root to configure paths and per-rule settings:

```json
{
  "global": {
    "path": ["./node_modules/@org/components", "./node_modules/@org/icons"]
  },
  "validate-html": {
    "rules": {
      "no-unknown-element": ["error", { "tags": ["my-extra-tag"] }],
      "no-unknown-event": ["error", { "events": ["custom-event"] }],
      "no-deprecated-element": "warn",
      "no-boolean-attr-value": "off"
    }
  }
}
```

Rules use ESLint-style config: either a severity string (`"error"`, `"warn"`, `"off"`) or a tuple `["severity", { ...options }]`.

The `no-unknown-element` rule accepts a `tags` allowlist and the `no-unknown-event` rule accepts an `events` allowlist.

### Path Resolution Priority

Schema paths are resolved in this order:

1. `--path` CLI flag
2. `webq.config.json` `global.path` array
3. `WEBQ_PATH` environment variable

### Config Flag

Use `--config` to specify a config file path explicitly:

```bash
webq validate-html '<my-tag></my-tag>' --config ./path/to/webq.config.json
```

Without `--config`, webq auto-discovers `webq.config.json` in the current directory.

## Usage

### CLI Commands

The `--path` flag accepts directories (searched recursively for `custom-elements.json`).

| Command                  | Parameters   | Description                                                |
| ------------------------ | ------------ | ---------------------------------------------------------- |
| `element.list`           |              | List all custom elements                                   |
| `element`                | `<tag-name>` | Get full details for a specific element                    |
| `element.attributes`     | `<tag-name>` | Get attributes for an element                              |
| `element.properties`     | `<tag-name>` | Get properties/fields for an element                       |
| `element.methods`        | `<tag-name>` | Get methods for an element                                 |
| `element.events`         | `<tag-name>` | Get events for an element                                  |
| `element.commands`       | `<tag-name>` | Get invoker commands for an element                        |
| `element.slots`          | `<tag-name>` | Get slots for an element                                   |
| `element.css-properties` | `<tag-name>` | Get CSS custom properties for an element                   |
| `element.css-parts`      | `<tag-name>` | Get CSS parts for an element                               |
| `pattern.list`           |              | List all compositional patterns                            |
| `pattern`                | `<name>`     | Get full details for a specific pattern                    |
| `attribute.list`         |              | List all custom attributes                                 |
| `attribute`              | `<name>`     | Get details for a custom attribute                         |
| `style.property.list`    |              | List all CSS custom properties                             |
| `style.property`         | `<name>`     | Get details for a CSS custom property                      |
| `validate-manifest`      |              | Validate a Custom Elements Manifest file                   |
| `validate-html`          | `<html>`     | Validate HTML against CEM definitions                      |
| `mcp`                    |              | Start the MCP server on STDIO transport                    |
| `setup-mcp`              |              | Add webq MCP server to `.mcp.json`                         |
| `setup-skill`            |              | Create Claude Code skill at `.claude/skills/webq/SKILL.md` |

```bash
# List all custom elements
webq element.list --path .

# Search an entire node_modules directory
webq element.list --path ./node_modules

# Multiple paths (comma-separated)
webq element.list --path ./lib1,./node_modules/@org

# Get full details for a specific element
webq element bp-button --path ./node_modules

# Get specific element information
webq element.attributes bp-button --path ./node_modules
webq element.properties bp-button --path ./node_modules
webq element.methods bp-button --path ./node_modules
webq element.events bp-button --path ./node_modules
webq element.commands bp-button --path ./node_modules
webq element.slots bp-button --path ./node_modules
webq element.css-properties bp-button --path ./node_modules
webq element.css-parts bp-button --path ./node_modules

# List patterns, attributes, styles
webq pattern.list --path ./node_modules
webq attribute.list --path ./node_modules
webq style.property.list --path ./node_modules

# Validate manifest structure
webq validate-manifest --path .
webq validate-manifest --path ./node_modules

# Validate HTML against the manifest
webq validate-html '<bp-button variant="primary">Click</bp-button>' --path ./node_modules

# Validate HTML with JSON output (ESLint-compatible format)
webq validate-html '<bp-button unknown-attr></bp-button>' --path ./node_modules --json
```

### MCP Server

Start the MCP server on STDIO transport:

```bash
webq mcp --path .

# Or scan all manifests in node_modules
webq mcp --path ./node_modules
```

### Setup with Claude Code

Run the setup commands to configure the MCP server and Claude Code skill:

```bash
# Add webq MCP server to .mcp.json
webq setup-mcp

# Create Claude Code skill at .claude/skills/webq/SKILL.md
webq setup-skill
```

Both commands are safe to run in existing projects. If the configuration already exists, they will notify you and offer a `--force` flag to update.

### Configure with Cursor

Add the following to your Cursor configuration `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "webq": {
      "command": "webq",
      "description": "Search and query for Web Components APIs via Custom Elements Manifest",
      "args": ["mcp", "--path", "./node_modules"]
    }
  }
}
```

## MCP Tools

The server exposes the following tools:

| Tool                         | Description                                  | Parameters        |
| ---------------------------- | -------------------------------------------- | ----------------- |
| `element_get_list`           | List all custom elements with tag names      | none              |
| `element_get`                | Get full details for a specific element      | `tagName: string` |
| `element_get_attributes`     | Get attributes for an element                | `tagName: string` |
| `element_get_properties`     | Get properties/fields for an element         | `tagName: string` |
| `element_get_methods`        | Get methods with parameters and return types | `tagName: string` |
| `element_get_events`         | Get events for an element                    | `tagName: string` |
| `element_get_commands`       | Get invoker commands for an element          | `tagName: string` |
| `element_get_slots`          | Get slots for an element                     | `tagName: string` |
| `element_get_css_properties` | Get CSS custom properties                    | `tagName: string` |
| `element_get_css_parts`      | Get CSS parts                                | `tagName: string` |
| `pattern_get_list`           | List all compositional patterns              | none              |
| `pattern_get`                | Get full details for a specific pattern      | `name: string`    |
| `attribute_get_list`         | List all custom attributes                   | none              |
| `attribute_get`              | Get details for a custom attribute           | `name: string`    |
| `style_property_list`        | List all CSS custom properties               | none              |
| `style_property_get`         | Get details for a CSS custom property        | `name: string`    |
| `validate_html`              | Validate HTML against CEM definitions        | `html: string`    |

## MCP Resources

The server exposes the following resources:

| Resource | URI Pattern       | Description        |
| -------- | ----------------- | ------------------ |
| Manifest | `webq://manifest` | Full manifest JSON |

## HTML Validation

The `validate-html` command and `validate_html` MCP tool check HTML against the Custom Elements Manifest, running 18 validation rules:

| Rule                             | Severity | Description                                                                                              |
| -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `no-unknown-element`             | error    | Custom elements must exist in the manifest                                                               |
| `no-unknown-attr`                | error    | Attributes must be defined (global attributes like `class`, `id`, `data-*`, `aria-*` are always allowed) |
| `no-unknown-attr-value`          | error    | Values must match string literal union types (e.g., `'primary' \| 'secondary'`)                          |
| `no-unknown-event`               | error    | Event bindings (`@event`, `(event)`, `on-event`, `onevent`) must match defined events                    |
| `no-unknown-slot`                | error    | Slot attribute values must match the parent element's defined slots                                      |
| `no-unknown-command`             | error    | Command/commandfor pairs must match the target element's defined commands                                |
| `no-unknown-css-part`            | error    | `::part()` selectors in `<style>` must match defined CSS parts                                           |
| `no-unknown-css-custom-property` | error    | CSS custom property declarations must match defined properties                                           |
| `no-missing-required-child`      | error    | Pattern root elements must have all required children present                                            |
| `no-missing-sibling-binding`     | error    | Sibling trigger/target pairs must have matching attribute bindings                                       |
| `no-deprecated-element`          | warn     | Warn on usage of deprecated elements                                                                     |
| `no-deprecated-attr`             | warn     | Warn on usage of deprecated attributes                                                                   |
| `no-deprecated-event`            | warn     | Warn on usage of deprecated events                                                                       |
| `no-deprecated-slot`             | warn     | Warn on usage of deprecated slots                                                                        |
| `no-deprecated-command`          | warn     | Warn on usage of deprecated commands                                                                     |
| `no-boolean-attr-value`          | warn     | Warn when boolean attributes have explicit values (e.g., `disabled="true"`)                              |
| `no-unknown-style-value`         | warn     | `var()` references must match custom styles or element CSS properties                                    |
| `no-unknown-custom-attr-value`   | warn     | Custom attribute token/enum values must match definitions in `custom-attributes.json`                    |

### Output Formats

**Human-readable (default):**

```
  1:12  error  Unknown attribute "foo" on <bp-button>. Valid attributes: type, disabled, variant, size, loading  no-unknown-attr

  1 error(s), 0 warning(s)
```

**JSON (`--json` flag):**

```json
{
  "messages": [
    {
      "ruleId": "no-unknown-attr",
      "severity": 2,
      "message": "Unknown attribute \"foo\" on <bp-button>. Valid attributes: type, disabled, variant, size, loading",
      "line": 1,
      "column": 12
    }
  ],
  "errorCount": 1,
  "warningCount": 0
}
```

## Custom Elements Manifest

This tool works with the [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) format, a JSON schema for documenting Web Components. Example:

```json
{
  "schemaVersion": "1.0.0",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/button.js",
      "declarations": [
        {
          "kind": "class",
          "name": "MyButton",
          "tagName": "my-button",
          "attributes": [{ "name": "disabled", "type": { "text": "boolean" } }],
          "members": [{ "kind": "field", "name": "value" }],
          "events": [{ "name": "change" }],
          "slots": [{ "name": "", "description": "Default slot" }],
          "cssProperties": [{ "name": "--button-color" }],
          "cssParts": [{ "name": "base" }]
        }
      ]
    }
  ]
}
```

## Custom Patterns Manifest

WebQ supports an optional companion file `custom-patterns.json` that defines compositional patterns — how custom elements are used together. This enables pattern querying and structural validation.

Place a `custom-patterns.json` alongside your `custom-elements.json` and WebQ will auto-discover it. Or set the path explicitly in config:

```json
{
  "global": {
    "path": ["./node_modules/@org/components"],
    "patternsPath": "./custom-patterns.json"
  }
}
```

### Patterns File

Patterns define structural rules (required children, sibling bindings) and usage examples:

```json
{
  "schemaVersion": "1.0.0",
  "patterns": [
    {
      "name": "form-field",
      "description": "Standard form field with label and validation messaging.",
      "tags": ["form", "input"],
      "structure": {
        "root": "bp-field",
        "children": [
          { "rule": "required", "element": "label", "description": "Visible label" },
          { "rule": "oneOf", "options": ["bp-input", "bp-select", "bp-textarea"], "description": "Form control" },
          { "rule": "optional", "element": "bp-field-message", "description": "Validation message" }
        ]
      },
      "examples": [
        {
          "name": "text-input",
          "html": "<bp-field>\n  <label>Name</label>\n  <bp-input required></bp-input>\n</bp-field>"
        }
      ],
      "relatedPatterns": ["form-group"]
    },
    {
      "name": "dialog-trigger",
      "description": "A button that opens a dialog using the Popover API.",
      "structure": {
        "siblings": [
          {
            "trigger": { "tag": "bp-button", "attributes": [{ "name": "popovertarget", "required": true }] },
            "target": { "tag": "bp-dialog", "attributes": [{ "name": "id", "required": true }] },
            "bindings": [{ "triggerAttribute": "popovertarget", "targetAttribute": "id" }]
          }
        ]
      }
    }
  ]
}
```

### Child Rules

| Rule         | Description                                             |
| ------------ | ------------------------------------------------------- |
| `required`   | Child must be present                                   |
| `optional`   | Child may be present                                    |
| `oneOf`      | Exactly one of the listed `options` must be present     |
| `oneOrMore`  | At least one child of the given element must be present |
| `zeroOrMore` | Any number of children (including none)                 |

Elements can be a tag name string (`"label"`) or an object with constraints (`{ "tag": "*", "slot": "header" }`). Use `*` to match any tag.

### Sibling Bindings

Sibling rules define trigger/target pairs with attribute bindings. For example, a button's `popovertarget` must reference a dialog's `id`. The `no-missing-sibling-binding` validation rule checks these relationships.

## Building

```bash
# Install dependencies
bun install

# Build for current platform
bun run build

# Build for all platforms
bun run build:all

# Run tests
bun test

# Run linter
bun run lint

# Run full CI (format, lint, test, build)
bun run ci
```

## Development

```bash
# Run CLI directly via Bun
bun src/index.ts element.list --path ./testdata

# Debug MCP server with inspector
bun run debug
```

## License

MIT
