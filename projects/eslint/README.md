# @webq/eslint

An ESLint plugin that validates custom element usage in HTML against a [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (CEM). It catches unknown attributes, events, slots, and more at lint time by reading your project's `custom-elements.json`.

## Requirements

- ESLint 9+
- [@html-eslint/parser](https://www.npmjs.com/package/@html-eslint/parser)
- [webq](https://github.com/blueprintui/webq) CLI tool

## Installation

Install the ESLint plugin:

```bash
npm install @webq/eslint --save-dev
```

Install the `webq` (Web Components Query) CLI tool (required for validation):

```bash
npm install @webq/cli

# Or download a pre-built binary from GitHub releases
# https://github.com/blueprintui/webq/releases
```

Verify webq is available:

```bash
webq --version
```

## Setup

This plugin uses ESLint [flat config](https://eslint.org/docs/latest/use/configure/configuration-files-new) and requires `@html-eslint/parser` to parse HTML files.

### Recommended Config

The quickest way to get started is with the `recommended` helper. It enables all rules with sensible defaults (`error` for unknown elements/attributes/events, `warn` for deprecations).

```js
// eslint.config.js
import htmlParser from '@html-eslint/parser';
import { recommended } from '@webq/eslint';

export default [
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: htmlParser
    },
    ...recommended({ cem: './path/to/custom-elements.json' })
  }
];
```

### Manual Config

For more control, import the plugin directly and configure individual rules.

```js
// eslint.config.js
import htmlParser from '@html-eslint/parser';
import webqPlugin from '@webq/eslint';

export default [
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: htmlParser
    },
    plugins: {
      webq: webqPlugin
    },
    rules: {
      'webq/no-unknown-element': ['error', { path: './node_modules/project' }],
      'webq/no-unknown-attr': ['error', { path: './node_modules/project' }]
      // ...add more rules as needed
    }
  }
];
```

## Rules

Every rule requires a `path` option pointing to your projects directory where the WebQ manifests are located.

### Unknown Usage (error by default)

| Rule                                  | Description                                                     |
| ------------------------------------- | --------------------------------------------------------------- |
| `webq/no-unknown-element`             | Disallow custom elements not defined in the CEM                 |
| `webq/no-unknown-attr`                | Disallow attributes not defined in the CEM                      |
| `webq/no-unknown-attr-value`          | Disallow attribute values not matching the CEM type definitions |
| `webq/no-unknown-event`               | Disallow events not defined in the CEM                          |
| `webq/no-unknown-command`             | Disallow commands not defined in the CEM                        |
| `webq/no-unknown-slot`                | Disallow slot names not defined in the CEM                      |
| `webq/no-unknown-css-part`            | Disallow CSS parts not defined in the CEM                       |
| `webq/no-unknown-css-custom-property` | Disallow CSS custom properties not defined in the CEM           |

### Deprecation Warnings (warn by default)

| Rule                         | Description                                 |
| ---------------------------- | ------------------------------------------- |
| `webq/no-deprecated-element` | Warn when using a deprecated custom element |
| `webq/no-deprecated-attr`    | Warn when using a deprecated attribute      |
| `webq/no-deprecated-slot`    | Warn when using a deprecated slot           |
| `webq/no-deprecated-event`   | Warn when using a deprecated event          |
| `webq/no-deprecated-command` | Warn when using a deprecated command        |

### Best Practices (warn by default)

| Rule                         | Description                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `webq/no-boolean-attr-value` | Warn when a boolean attribute is set with an explicit value (e.g. prefer `<x-btn disabled>` over `<x-btn disabled="true">`) |

## Custom Elements Manifest

This plugin reads a [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest) (`custom-elements.json`) to understand your component API. Most web component libraries ship one, or you can generate it with tools like [@custom-elements-manifest/analyzer](https://www.npmjs.com/package/@custom-elements-manifest/analyzer).

## License

MIT
