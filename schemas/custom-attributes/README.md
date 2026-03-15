# Custom Attributes Manifest

A JSON file format for describing global HTML attributes in a web component design system. Covers utility attributes that work on any element — layout, typography, theming — with full enumeration of every valid value.

## Why

Design systems often provide HTML attributes that aren't tied to a single component. An attribute like `bp-layout="grid gap:md cols:6@sm"` works on any element and accepts a micro-syntax of space-separated tokens with parameters and responsive modifiers. The Custom Elements Manifest (CEM) only describes attributes scoped to specific custom elements. It has no way to express global attributes, token-list syntax, or composition rules between values.

Without a machine-readable description, agents have to guess valid tokens, invent parameter combinations, and hallucinate responsive suffixes. This format enumerates every valid token string explicitly — no grammar, no parsing rules, just a catalog of what's legal.

## Relationship to Other Schemas

| Schema                       | What it describes                                                            |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `custom-elements.json`       | Per-component APIs: attributes, properties, events, slots, scoped CSS        |
| `custom-patterns.json`       | Compositional rules: parent/child, sibling relationships, required structure |
| **`custom-attributes.json`** | **Global HTML attributes: utility token-list attributes, enums, booleans**   |
| `custom-styles.json`         | Global CSS: custom properties and cascade layers                             |

CEM owns per-element attributes. Custom attributes owns everything that works across elements — the HTML utilities that complement component APIs.

## Schema

### Top-Level Structure

```json
{
  "schemaVersion": "1.0.0",
  "attributes": []
}
```

### Attribute

Each entry describes a single HTML attribute.

```json
{
  "name": "bp-layout",
  "description": "Declarative layout utility...",
  "syntax": "token-list",
  "appliesTo": "*",
  "tokenGroups": [],
  "examples": [],
  "tags": ["layout", "grid", "responsive"]
}
```

**Fields:**

- `name` (required) — The HTML attribute name exactly as written in markup
- `description` (required) — What this attribute does
- `syntax` — How the value is structured:
  - `token-list` — Space-separated tokens from defined groups (default)
  - `enum` — Single value from a fixed list
  - `boolean` — Presence/absence, no value needed
  - `string` — Free-form text
- `appliesTo` — `"*"` for any element, or an array of tag names
- `tokenGroups` — Token composition rules (for `token-list` syntax)
- `values` — Valid values (for `enum` syntax)
- `examples` — HTML snippets demonstrating usage
- `tags` — Categorical tags for discovery

### Token Groups

For `token-list` attributes, values are organized into groups that define composition rules. Each group contains a flat enumeration of every valid token string.

```json
{
  "name": "gap",
  "description": "Space between child items",
  "rule": "optional",
  "values": [
    { "value": "gap:xs", "description": "Extra small gap" },
    { "value": "gap:sm", "description": "Small gap" },
    { "value": "gap:md", "description": "Medium gap" },
    { "value": "gap:lg", "description": "Large gap" },
    { "value": "gap:xl", "description": "Extra large gap" },
    "gap:xs@sm",
    "gap:md@lg"
  ]
}
```

**Fields:**

- `name` (required) — Group identifier
- `description` — What this group controls
- `rule` — How tokens in this group compose:
  - `oneOf` — Exactly one token from the group
  - `optional` — Zero or one token (default)
  - `zeroOrMore` — Any combination of tokens
- `required` — Whether at least one token from this group must be present
- `requires` — Token values from other groups that must be present for this group to be valid (e.g. column tokens require `grid`)
- `values` (required) — Every valid token, either as a plain string or a `{ value, description }` object

### Token Values

Values support two forms for ergonomic authoring:

```json
{ "value": "gap:md", "description": "Medium gap" }
```

```json
"gap:md@sm"
```

Base values that benefit from documentation use the object form. Mechanical variants like responsive suffixes use plain strings — the pattern is self-evident and descriptions would just add noise.

### Examples

```json
{
  "name": "responsive-grid",
  "description": "12-column grid with responsive breakpoints",
  "html": "<div bp-layout=\"grid gap:md cols:12 cols:6@sm cols:3@md\">...</div>"
}
```

## Design: Flat Enumeration Over Grammar

The core design decision in this format is **enumerating every valid token explicitly** rather than expressing a micro-syntax grammar.

An attribute like `bp-layout="grid gap:md cols:6@sm center"` has internal structure — colon-separated parameters, `@` breakpoint suffixes, conditional validity. A grammar-based schema would express rules like "any token can have an `@` suffix from the breakpoint set." This format instead lists `cols:1`, `cols:2`, ..., `cols:12`, `cols:1@xs`, `cols:1@sm`, ..., `cols:12@xl` as 78 individual strings.

This is intentional:

- **Zero ambiguity.** Every valid token is explicitly listed. No interpretation layer between schema and validity check.
- **Agent-friendly.** An LLM scans a values array and picks the right token. No grammar rules to understand or misapply.
- **Trivial validation.** Split the attribute value on spaces, check each token exists in some group's values. Done.
- **The schema is the documentation.** No separate reference needed to know what's valid.

The cost is file size. A layout attribute with responsive variants across a 12-column grid and 5 breakpoints produces ~982 token strings. This is a feature, not a bug — the file is complete and unambiguous.

## Example

A layout attribute with type selection, gap, and responsive columns:

```json
{
  "schemaVersion": "1.0.0",
  "attributes": [
    {
      "name": "bp-layout",
      "description": "Declarative layout utility",
      "syntax": "token-list",
      "appliesTo": "*",
      "tags": ["layout", "grid", "responsive"],
      "tokenGroups": [
        {
          "name": "type",
          "description": "The layout mode",
          "rule": "oneOf",
          "required": true,
          "values": [
            { "value": "block", "description": "Vertical stack layout" },
            { "value": "inline", "description": "Horizontal flow layout" },
            { "value": "grid", "description": "CSS Grid with 12-column system" }
          ]
        },
        {
          "name": "gap",
          "description": "Space between child items",
          "rule": "optional",
          "values": [
            { "value": "gap:xs", "description": "Extra small gap" },
            { "value": "gap:sm", "description": "Small gap" },
            { "value": "gap:md", "description": "Medium gap" },
            { "value": "gap:lg", "description": "Large gap" },
            { "value": "gap:xl", "description": "Extra large gap" },
            "gap:xs@sm",
            "gap:sm@sm",
            "gap:md@sm",
            "gap:lg@sm",
            "gap:xl@sm"
          ]
        },
        {
          "name": "columns",
          "description": "Grid column count. Only valid with grid type.",
          "rule": "zeroOrMore",
          "requires": ["grid"],
          "values": [
            {
              "value": "cols:1",
              "description": "All children span 1 of 12 columns"
            },
            {
              "value": "cols:6",
              "description": "All children span 6 of 12 columns"
            },
            {
              "value": "cols:12",
              "description": "All children span 12 of 12 columns"
            },
            "cols:6@sm",
            "cols:3@md",
            "cols:12@lg"
          ]
        }
      ],
      "examples": [
        {
          "name": "responsive-grid",
          "description": "Grid with responsive column breakpoints",
          "html": "<div bp-layout=\"grid gap:md cols:12 cols:6@sm cols:3@md\">...</div>"
        }
      ]
    },
    {
      "name": "bp-theme",
      "description": "Activates design system theming on the root element",
      "syntax": "enum",
      "appliesTo": ["html"],
      "values": ["", "dark", "compact"],
      "tags": ["theme"]
    }
  ]
}
```

Note `bp-theme` as an `enum` syntax attribute — it doesn't use token groups, just a flat list of valid values. The `syntax` field determines which fields are relevant.

## Validation

For `token-list` attributes, validation is a linear scan:

```js
function validate(attributeName, value, schema) {
  const attr = schema.attributes.find(a => a.name === attributeName);
  const tokens = value.split(/\s+/);

  for (const token of tokens) {
    const found = attr.tokenGroups.some(group =>
      group.values.some(v => (typeof v === 'string' ? v : v.value) === token)
    );
    if (!found) return { valid: false, token, error: 'unknown token' };
  }

  // Check required groups
  for (const group of attr.tokenGroups) {
    if (group.required) {
      const hasToken = tokens.some(t => group.values.some(v => (typeof v === 'string' ? v : v.value) === t));
      if (!hasToken)
        return {
          valid: false,
          group: group.name,
          error: 'required group missing'
        };
    }
  }

  // Check requires constraints
  for (const group of attr.tokenGroups) {
    if (group.requires) {
      const groupTokens = tokens.filter(t => group.values.some(v => (typeof v === 'string' ? v : v.value) === t));
      if (groupTokens.length > 0) {
        const hasRequired = group.requires.every(req => tokens.includes(req));
        if (!hasRequired)
          return {
            valid: false,
            group: group.name,
            error: `requires ${group.requires.join(', ')}`
          };
      }
    }
  }

  return { valid: true };
}
```

## Authoring Guidelines

**Enumerate every valid token.** Don't describe a grammar — list every string an agent can write. If responsive variants exist, list every combination. The file size is the cost of zero ambiguity.

**Use object form for base values, strings for variants.** `{ "value": "cols:6", "description": "..." }` for the base token, plain `"cols:6@sm"` for breakpoint expansions. Descriptions on mechanical variants are noise.

**Use `requires` for conditional validity.** If column tokens only make sense with `grid`, declare `"requires": ["grid"]`. This keeps groups independent while expressing cross-group constraints.

**Keep groups semantically focused.** One group per concern — type, gap, alignment, columns. Don't mix unrelated tokens in a single group even if they share a rule.

## Integration

Reference the manifest in `package.json`:

```json
{
  "customAttributes": "custom-attributes.json"
}
```

This follows the same convention as `customElements` (CEM), `customPatterns`, and `customStyles` — one field per schema, all discoverable from the package root.
