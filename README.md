# WebQ

Tools for querying and validating Web Components against [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (CEM) files.

## Packages

| Package                                     | Description                                                         |
| ------------------------------------------- | ------------------------------------------------------------------- |
| [`@webq/cli`](projects/cli/README.md)       | CLI tool and MCP server for querying and validating CEM files       |
| [`@webq/eslint`](projects/eslint/README.md) | ESLint plugin for validating custom element HTML usage              |
| [`schemas`](projects/schemas/)              | JSON schemas for CEM, custom attributes, patterns, styles, and more |

## Quick Start

### CLI

Download a pre-built binary from the [releases page](https://github.com/blueprintui/webq/releases), or install via npm:

```bash
npm install -g @webq/cli
```

```bash
# List all custom elements
webq element.list --path ./node_modules

# Get details for a specific element
webq element bp-button --path ./node_modules

# Validate HTML against CEM definitions
webq validate-html '<bp-button variant="primary">Click</bp-button>' --path ./node_modules
```

See the [CLI README](projects/cli/README.md) for the full command reference, configuration, and MCP tool documentation.

### ESLint Plugin

```bash
npm install @webq/eslint --save-dev
```

```js
// eslint.config.js
import htmlParser from '@html-eslint/parser';
import { recommended } from '@webq/eslint';

export default [
  {
    files: ['**/*.html'],
    languageOptions: { parser: htmlParser },
    ...recommended({ cem: './path/to/custom-elements.json' })
  }
];
```

See the [ESLint README](projects/eslint/README.md) for manual configuration and the full rule list.

## MCP Server

WebQ can run as an [MCP](https://modelcontextprotocol.io/) server, providing AI assistants with tools for querying element APIs and validating HTML.

### Claude Code

```bash
webq setup-mcp
webq setup-skill
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "webq": {
      "command": "webq",
      "args": ["mcp", "--path", "./node_modules"]
    }
  }
}
```

## Validation Rules

Both `@webq/cli` and `@webq/eslint` share the same 18 validation rules:

| Rule                             | Severity | Description                                              |
| -------------------------------- | -------- | -------------------------------------------------------- |
| `no-unknown-element`             | error    | Custom elements must exist in the manifest               |
| `no-unknown-attr`                | error    | Attributes must be defined in the manifest               |
| `no-unknown-attr-value`          | error    | Values must match defined type unions                    |
| `no-unknown-event`               | error    | Event bindings must match defined events                 |
| `no-unknown-slot`                | error    | Slot values must match defined slots                     |
| `no-unknown-command`             | error    | Commands must match defined commands                     |
| `no-unknown-css-part`            | error    | `::part()` selectors must match defined CSS parts        |
| `no-unknown-css-custom-property` | error    | CSS custom properties must match definitions             |
| `no-missing-required-child`      | error    | Pattern root elements must have required children        |
| `no-missing-sibling-binding`     | error    | Sibling trigger/target pairs must have matching bindings |
| `no-deprecated-element`          | warn     | Warn on deprecated elements                              |
| `no-deprecated-attr`             | warn     | Warn on deprecated attributes                            |
| `no-deprecated-event`            | warn     | Warn on deprecated events                                |
| `no-deprecated-slot`             | warn     | Warn on deprecated slots                                 |
| `no-deprecated-command`          | warn     | Warn on deprecated commands                              |
| `no-boolean-attr-value`          | warn     | Warn when boolean attributes have explicit values        |
| `no-unknown-style-value`         | warn     | `var()` references must match defined custom properties  |
| `no-unknown-custom-attr-value`   | warn     | Custom attribute values must match definitions           |

## Schemas

JSON schemas for validating manifest files are available in [`projects/schemas/`](projects/schemas/):

| Schema                                                   | Description                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| [custom-elements](projects/schemas/custom-elements/)     | Per-component APIs (attributes, properties, events, slots, CSS) |
| [custom-patterns](projects/schemas/custom-patterns/)     | Compositional rules (parent/child, sibling relationships)       |
| [custom-attributes](projects/schemas/custom-attributes/) | Global HTML attributes (utility token-list attributes)          |
| [custom-styles](projects/schemas/custom-styles/)         | Global CSS custom properties and cascade layers                 |
| [dtcg](projects/schemas/dtcg/)                           | Design Token Community Group token format                       |
| [vscode-html](projects/schemas/vscode-html/)             | VSCode custom data format for HTML                              |
| [vscode-css](projects/schemas/vscode-css/)               | VSCode custom data format for CSS                               |

## Development

```bash
bun install               # Install all dependencies
bun run ci                # Build + test all packages
bun run format            # Check formatting (prettier)
bun run format:fix        # Fix formatting
```

## License

MIT
