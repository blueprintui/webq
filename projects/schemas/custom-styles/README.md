# Custom Styles Manifest

A JSON file format for describing the global CSS foundation of a web component design system. Covers CSS custom properties — the style APIs that exist outside of any single component.

## Why

The Custom Elements Manifest (CEM) describes CSS custom properties and parts scoped to individual components. But design systems also have **global** style APIs — shared custom properties for color, spacing, sizing, and typography that any element can use, plus `@layer` declarations that control cascade order.

Without a machine-readable description of these, agents guess token names, hallucinate nonexistent properties, and write CSS that fights the cascade. This format makes the global style surface explicit and queryable.

## Relationship to Other Schemas

| Schema                   | What it describes                                                                 |
| ------------------------ | --------------------------------------------------------------------------------- |
| `custom-elements.json`   | Per-component APIs: attributes, properties, events, slots, scoped CSS             |
| `custom-patterns.json`   | Compositional rules: parent/child, sibling relationships, required structure      |
| `custom-attributes.json` | Global HTML attributes: utility token-list attributes like `bp-layout`, `bp-text` |
| **`custom-styles.json`** | **Global CSS: custom properties**                                                 |

Each schema covers a distinct surface of the web platform. CEM owns per-element CSS. Custom styles owns everything above that — the shared foundation components are built on.

## Schema

### Top-Level Structure

```json
{
  "schemaVersion": "1.0.0",
  "cssCustomProperties": []
}
```

### CSS Custom Properties

A flat array of every global CSS custom property the design system provides. Each property maps directly to a `--` prefixed value usable in any stylesheet.

```json
{
  "name": "--bp-space-md",
  "value": "24px",
  "type": "dimension",
  "description": "Medium spacing",
  "tags": ["space"]
}
```

**Fields:**

- `name` (required) — The CSS custom property name including the `--` prefix
- `value` — Default resolved value. May reference other properties (e.g. `var(--bp-space-md, 24px)`)
- `description` — What this property is for
- `type` — The kind of CSS value: `color`, `dimension`, `duration`, `number`, `font-family`, `font-weight`, `shadow`, `border`, `opacity`, or `other`
- `tags` — String array for categorization and filtering

Properties are intentionally flat rather than grouped. Tags handle categorization and support cross-cutting queries — a property like `--bp-status-accent-background-200` carries `["status", "accent"]` and shows up in both filters.

**Fields:**

- `name` (required) — The layer name as used in `@layer` declarations
- `description` — What styles this layer contains
- `order` — Cascade priority (lower numbers = lower priority, overridden by higher)

## Example

A design system with a color palette, spacing scale, and layered cascade:

```json
{
  "schemaVersion": "1.0.0",
  "cssCustomProperties": [
    {
      "name": "--bp-color-blue-0",
      "value": "oklch(0.62 0.2 265)",
      "type": "color",
      "description": "Blue seed hue",
      "tags": ["color", "seed"]
    },
    {
      "name": "--bp-space-md",
      "value": "24px",
      "type": "dimension",
      "description": "Medium spacing",
      "tags": ["space"]
    },
    {
      "name": "--bp-status-accent-background-200",
      "type": "color",
      "description": "Accent moderate background",
      "tags": ["status", "accent"]
    },
    {
      "name": "--bp-layer-background-100",
      "type": "color",
      "description": "Base page background",
      "tags": ["layer"]
    },
    {
      "name": "--bp-animation-duration-200",
      "value": "0.2s",
      "type": "duration",
      "description": "Default animation",
      "tags": ["animation"]
    }
  ]
}
```

## Querying

The flat structure with tags makes filtering straightforward:

```js
// All color properties
properties.filter(p => p.tags?.includes('color'));

// All spacing properties
properties.filter(p => p.tags?.includes('space'));

// All accent-related properties (spans status and interaction)
properties.filter(p => p.tags?.includes('accent'));

// Properties by type
properties.filter(p => p.type === 'dimension');
```

## Authoring Guidelines

**Every field should map to a concrete CSS API.** The `name` field is a real `--custom-property`. The `value` field is a real CSS value. The layer `name` is a real `@layer` identifier. Agents consume this format to write CSS — keep it actionable.

**Use tags for categorization, not nesting.** A property can belong to multiple categories. `--bp-text-color-500` is both a text property and a color — `["text", "color"]` captures this without forcing a hierarchy.

**Include `value` when the default is stable.** If the resolved value changes per theme (e.g. colors in light vs dark mode), omit `value` or document the base theme default. Properties with stable values like `--bp-space-md: 24px` should always include them.

**Include `type` for tooling.** The type field helps editors show color swatches for `color` types, numeric inputs for `dimension`, and so on. It costs nothing to author and makes every downstream tool better.

## Integration

Reference the manifest in `package.json`:

```json
{
  "customStyles": "custom-styles.json"
}
```

This follows the same convention as `customElements` (CEM), `customPatterns`, and `customAttributes` — one field per schema, all discoverable from the package root.
