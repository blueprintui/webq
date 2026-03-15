# Custom Elements Manifest

A JSON file format for describing the APIs of custom elements — their attributes, properties, events, slots, CSS custom properties, CSS parts, and module structure. This is the foundational schema in the WEBQ ecosystem.

**Custom Elements Manifest (CEM) is a community specification maintained at [github.com/webcomponents/custom-elements-manifest](https://github.com/webcomponents/custom-elements-manifest).** WEBQ does not define or extend this schema. It adopts the spec as-is and builds complementary schemas around it for the concerns CEM intentionally does not cover.

## What CEM Describes

CEM is a per-element API manifest. For each custom element in a package, it captures:

- **Modules** — JavaScript module paths, exports, and declarations
- **Class declarations** — The class backing each custom element, its superclass, mixins, and tag name
- **Attributes** — HTML attributes with name, type, default value, and description
- **Properties** — JavaScript properties on the element class with type information
- **Events** — Custom events the element dispatches, with event type
- **Slots** — Named and default slots the element accepts
- **CSS custom properties** — Scoped `--` prefixed properties for styling
- **CSS parts** — `::part()` targets exposed for external styling
- **Methods** — Public methods on the element class

This is comprehensive for describing what a single element accepts and emits. It's the "dictionary" of a design system — every element, every API surface, fully enumerated.

## What CEM Does Not Describe

CEM is scoped to individual element APIs. It intentionally does not cover:

- **Compositional relationships** — Which elements must be children of other elements, slot assignment rules, trigger/target pairings. A CEM can tell you that `bp-select` has a default slot, but not that `bp-option` elements belong in it.
- **Global HTML attributes** — Utility attributes like `bp-layout` or `bp-text` that apply across all elements, not to a specific component. CEM's attribute model is per-class.
- **Global CSS APIs** — Shared design tokens (custom properties for color, spacing, sizing) and cascade layers that exist above the component level. CEM captures CSS properties scoped to an element, not system-wide tokens.

These gaps are where the other WEBQ schemas fit.

## Relationship to Other Schemas

| Schema                     | What it describes                                                                 |
| -------------------------- | --------------------------------------------------------------------------------- |
| **`custom-elements.json`** | **Per-component APIs: attributes, properties, events, slots, scoped CSS**         |
| `custom-patterns.json`     | Compositional rules: parent/child, sibling relationships, required structure      |
| `custom-attributes.json`   | Global HTML attributes: utility token-list attributes like `bp-layout`, `bp-text` |
| `custom-styles.json`       | Global CSS: custom properties and cascade layers                                  |

CEM is the foundation. The other three schemas describe what sits above, around, and between elements — the system-level concerns that turn a collection of components into a design system.

## Schema Overview

The full JSON Schema is maintained in the [official repository](https://github.com/webcomponents/custom-elements-manifest/blob/main/schema.json). What follows is a practical overview of the structure most relevant to tooling and agent consumption.

### Top-Level Structure

```json
{
  "schemaVersion": "2.1.0",
  "readme": "",
  "modules": []
}
```

### Modules

Each entry in `modules` represents a JavaScript module file — a specific import path that exports declarations.

```json
{
  "kind": "javascript-module",
  "path": "/button/index.js",
  "declarations": [],
  "exports": []
}
```

### Class Declarations (Custom Elements)

Inside a module's `declarations`, custom elements appear as class declarations with a `tagName`:

```json
{
  "kind": "class",
  "name": "BpButton",
  "tagName": "bp-button",
  "description": "Standard button component",
  "superclass": { "name": "LitElement", "package": "lit" },
  "attributes": [
    {
      "name": "status",
      "type": { "text": "'accent' | 'success' | 'warning' | 'danger'" },
      "description": "Visual status of the button",
      "fieldName": "status"
    },
    {
      "name": "action",
      "type": { "text": "'primary' | 'secondary' | 'flat'" },
      "default": "'primary'",
      "fieldName": "action"
    },
    {
      "name": "disabled",
      "type": { "text": "boolean" },
      "default": "false",
      "fieldName": "disabled"
    }
  ],
  "members": [
    {
      "kind": "field",
      "name": "status",
      "type": { "text": "'accent' | 'success' | 'warning' | 'danger'" },
      "attribute": "status"
    }
  ],
  "events": [
    {
      "name": "click",
      "type": { "text": "MouseEvent" }
    }
  ],
  "slots": [
    { "name": "", "description": "Button content" },
    { "name": "prefix", "description": "Content before the main text" },
    { "name": "suffix", "description": "Content after the main text" }
  ],
  "cssProperties": [
    {
      "name": "--padding",
      "description": "Internal padding of the button"
    }
  ],
  "cssParts": [
    {
      "name": "internal",
      "description": "The internal button element"
    }
  ]
}
```

This single declaration gives a consumer everything needed to use `bp-button` correctly: what attributes it accepts and their types, what slots it provides, what events it fires, and what CSS hooks are available.

### Exports

Each module declares what it exports — JavaScript exports and custom element definitions:

```json
{
  "exports": [
    {
      "kind": "js",
      "name": "BpButton",
      "declaration": { "name": "BpButton", "module": "/button/index.js" }
    },
    {
      "kind": "custom-element-definition",
      "name": "bp-button",
      "declaration": { "name": "BpButton", "module": "/button/index.js" }
    }
  ]
}
```

## How CEM is Generated

CEM files are typically auto-generated from source code by an analyzer. The most widely used is the [Custom Elements Manifest Analyzer](https://custom-elements-manifest.open-wc.org/) from Open WC, which reads TypeScript/JavaScript source and JSDoc annotations to produce the manifest.

Because the file is generated, it should be treated as a build artifact — checked in for distribution but not hand-edited. This is an important distinction from the other WEBQ schemas (`custom-patterns.json`, `custom-attributes.json`, `custom-styles.json`), which are hand-authored descriptions of design decisions that no analyzer can infer from code.

## Integration

The CEM convention is a `customElements` field in `package.json`:

```json
{
  "customElements": "custom-elements.json"
}
```

The WEBQ ecosystem extends this convention with parallel fields for each schema:

```json
{
  "customElements": "custom-elements.json",
  "customPatterns": "custom-patterns.json",
  "customAttributes": "custom-attributes.json",
  "customStyles": "custom-styles.json"
}
```

All four files sit alongside each other in the package. Tooling discovers them from the same `package.json` root. CEM is the only one that's generated — the rest are authored.

## Ecosystem

The CEM spec has a broad ecosystem of producers and consumers:

**Analyzers** (produce CEM from source):

- [Custom Elements Manifest Analyzer](https://custom-elements-manifest.open-wc.org/) — Open WC's TypeScript/JavaScript analyzer
- [Stencil](https://stenciljs.com/) — Generates CEM alongside component builds
- Various framework-specific generators

**Consumers** (read CEM for tooling):

- IDE support — VS Code, JetBrains custom element completion
- Framework wrappers — React, Vue, Angular type generation from CEM
- Documentation generators — API docs from CEM metadata
- Storybook — Auto-generated controls from CEM
- **WEBQ** — Validation, querying, and agent tooling against CEM

## Further Reading

- [CEM specification and JSON Schema](https://github.com/webcomponents/custom-elements-manifest/) — The authoritative source for the schema definition, type definitions, and examples
- [CEM Analyzer documentation](https://custom-elements-manifest.open-wc.org/) — How to generate a CEM from your component source code
- [CEM Analyzer plugins](https://custom-elements-manifest.open-wc.org/analyzer/getting-started/#plugins) — Extend the analyzer for custom JSDoc tags and conventions
