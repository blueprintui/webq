# Custom Patterns Manifest

A JSON file format for describing compositional relationships between elements in a web component design system. Covers parent/child requirements, sibling trigger/target pairs, slot assignments, and cross-element attribute bindings.

## Why

Design systems aren't just collections of individual components — they're compositions. A form field is a `bp-field` wrapping a `label`, a form control, and a `bp-field-message`. A dialog is a `bp-button` with `popovertarget` pointing at a `bp-dialog` with a matching `id`. These compositional rules are critical to getting correct output, but they exist nowhere in machine-readable form.

The Custom Elements Manifest (CEM) describes each element in isolation — its attributes, properties, events, slots. It doesn't express that `bp-option` must be a child of `bp-select`, that a dialog trigger's `popovertarget` must match the target's `id`, or that a form field is incomplete without a `bp-field-message`. Agents assembling components without this information produce HTML that is technically valid per each element's API but structurally wrong.

This format fills the gap between a dictionary (CEM — "here are all the words") and a grammar ("here's how to form sentences").

## Relationship to Other Schemas

| Schema                     | What it describes                                                                 |
| -------------------------- | --------------------------------------------------------------------------------- |
| `custom-elements.json`     | Per-component APIs: attributes, properties, events, slots, scoped CSS             |
| **`custom-patterns.json`** | **Compositional rules: parent/child, sibling relationships, required structure**  |
| `custom-attributes.json`   | Global HTML attributes: utility token-list attributes like `bp-layout`, `bp-text` |
| `custom-styles.json`       | Global CSS: custom properties and cascade layers                                  |

CEM tells you what each element accepts. Custom patterns tells you how elements compose into working assemblies.

## Schema

### Top-Level Structure

```json
{
  "schemaVersion": "1.0.0",
  "patterns": []
}
```

### Pattern

Each entry describes a compositional pattern — a recurring assembly of elements that belong together.

```json
{
  "name": "form-field",
  "description": "Standard form field with label and validation messaging.",
  "tags": ["form", "input", "validation"],
  "structure": {},
  "examples": [],
  "relatedPatterns": ["form-group", "fieldset"]
}
```

**Fields:**

- `name` (required) — Unique identifier for the pattern
- `description` (required) — When and why to use this pattern
- `tags` — Categorical tags for discovery
- `structure` (required) — Structural rules for validation
- `examples` — HTML snippets demonstrating correct usage
- `relatedPatterns` — Names of patterns commonly used alongside this one

### Structure

Defines the valid compositional structure. A structure has a `root` element with `children` rules, `siblings` rules for trigger/target pairs, or both.

```json
{
  "root": "bp-field",
  "children": [
    { "rule": "required", "element": "label" },
    { "rule": "oneOf", "options": ["bp-input", "bp-select", "bp-textarea"] },
    { "rule": "optional", "element": "bp-field-message" }
  ]
}
```

**Fields:**

- `root` — The outermost element (string tag name or elementRef object)
- `children` — Rules for child elements within the root
- `siblings` — Rules for sibling element relationships (trigger/target pairs)

### Child Rules

Each child rule declares what elements belong inside the root and how many.

```json
{ "rule": "required", "element": "label", "description": "Visible label" }
```

```json
{ "rule": "oneOf", "options": ["bp-input", "bp-select", "bp-textarea"] }
```

**Fields:**

- `rule` (required) — Cardinality:
  - `required` — Exactly one must be present
  - `optional` — Zero or one
  - `oneOf` — Exactly one from the `options` list
  - `oneOrMore` — At least one
  - `zeroOrMore` — Any number
- `element` — Single element (string tag name or elementRef). Used with `required`, `optional`, `oneOrMore`, `zeroOrMore`.
- `options` — Array of elements. Used with `oneOf`.
- `description` — Role of this child within the pattern

### Sibling Rules

Sibling rules describe relationships between elements at the same level — typically a trigger that activates a target. This is the pattern for popover triggers, command buttons, and other cross-element interactions.

```json
{
  "description": "Button triggers dialog via popovertarget/id binding",
  "trigger": {
    "tag": "bp-button",
    "attributes": [{ "name": "popovertarget", "required": true }]
  },
  "target": {
    "tag": "bp-dialog",
    "attributes": [{ "name": "id", "required": true }]
  },
  "bindings": [{ "triggerAttribute": "popovertarget", "targetAttribute": "id" }]
}
```

**Fields:**

- `trigger` (required) — The element that initiates the interaction (elementRef)
- `target` (required) — The element that responds (elementRef)
- `description` — What this relationship does
- `bindings` — Cross-element attribute relationships declaring that a value on the trigger must reference the same value on the target

### Element References

Elements can be referenced in two forms for ergonomic authoring.

**String shorthand** — just the tag name, when no attributes or slot constraints are needed:

```json
{ "rule": "required", "element": "label" }
```

**Object form** — when you need attribute requirements or slot assignments:

```json
{
  "rule": "optional",
  "element": { "tag": "*", "slot": "header" }
}
```

The object form (`elementRef`) has:

- `tag` (required) — Tag name. Custom elements contain a hyphen, native elements do not. `*` matches any element.
- `attributes` — Array of attribute rules (`{ name, required, value }`)
- `slot` — Required slot assignment on the parent element

Most patterns use string shorthand. The object form only appears where it's genuinely needed — sibling triggers/targets with attribute constraints, slot-specific children, or roots requiring specific attributes.

### Attribute Bindings

Bindings declare that an attribute on one element must reference the same value as an attribute on another. This is how the schema expresses "the trigger's `popovertarget` must match the target's `id`."

```json
{
  "triggerAttribute": "popovertarget",
  "targetAttribute": "id"
}
```

A validator checks that the runtime values actually match — not just that the attributes exist, but that they point to each other.

### Examples

Each pattern includes HTML examples demonstrating correct usage:

```json
{
  "name": "text-input",
  "description": "Basic text input with required validation",
  "html": "<bp-field>\n  <label>Name</label>\n  <bp-input required></bp-input>\n  <bp-field-message error=\"valueMissing\">Required</bp-field-message>\n</bp-field>"
}
```

Examples serve two audiences. Agents use them as templates to pattern-match against — show an agent correct HTML and it copies the structure. Validators use them as known-good reference implementations.

## Design: Structure + Examples

The schema serves two distinct purposes with two corresponding data shapes.

**Structure rules** are for validation. They express constraints — what elements are required, what's optional, what's mutually exclusive. A validator walks the DOM, checks each child rule, and reports violations. Structure rules are precise and machine-parseable.

**HTML examples** are for agents. An agent producing HTML doesn't interpret a `oneOf` constraint — it looks at a concrete example, copies the shape, and fills in its own content. Examples are the fastest path from "what pattern should I use" to correct output.

Both are necessary. Structure alone forces agents to reason abstractly about composition rules, which is where they make mistakes. Examples alone can't express the full space of valid compositions — a form field example showing `bp-input` doesn't teach the agent that `bp-select` is also valid there. Together, the structure defines what's valid and the examples show what it looks like.

## Example

A pattern file with parent/child and sibling patterns:

```json
{
  "schemaVersion": "1.0.0",
  "patterns": [
    {
      "name": "form-field",
      "description": "Standard form field with label and validation messaging.",
      "tags": ["form", "input", "validation"],
      "structure": {
        "root": "bp-field",
        "children": [
          {
            "rule": "required",
            "element": "label",
            "description": "Visible label for the form control"
          },
          {
            "rule": "oneOf",
            "options": ["bp-input", "bp-select", "bp-textarea", "bp-search", "bp-password", "bp-telephone"],
            "description": "The form control element"
          },
          {
            "rule": "optional",
            "element": "bp-field-message",
            "description": "Validation or help message"
          }
        ]
      },
      "relatedPatterns": ["form-group", "fieldset"],
      "examples": [
        {
          "name": "text-input",
          "description": "Basic text input with required validation",
          "html": "<bp-field>\n  <label>Name</label>\n  <bp-input required></bp-input>\n  <bp-field-message error=\"valueMissing\">Required</bp-field-message>\n</bp-field>"
        },
        {
          "name": "select",
          "description": "Select dropdown within a form field",
          "html": "<bp-field>\n  <label>Country</label>\n  <bp-select>\n    <bp-option value=\"us\">USA</bp-option>\n    <bp-option value=\"uk\">United Kingdom</bp-option>\n  </bp-select>\n  <bp-field-message>Select your country</bp-field-message>\n</bp-field>"
        }
      ]
    },
    {
      "name": "dialog-trigger",
      "description": "A button that opens a dialog using the HTML Popover API.",
      "tags": ["overlay", "modal", "popover"],
      "structure": {
        "siblings": [
          {
            "description": "Button triggers dialog via popovertarget/id binding",
            "trigger": {
              "tag": "bp-button",
              "attributes": [{ "name": "popovertarget", "required": true }]
            },
            "target": {
              "tag": "bp-dialog",
              "attributes": [{ "name": "id", "required": true }]
            },
            "bindings": [
              {
                "triggerAttribute": "popovertarget",
                "targetAttribute": "id"
              }
            ]
          }
        ]
      },
      "relatedPatterns": ["dialog-structure"],
      "examples": [
        {
          "name": "basic",
          "description": "Simple dialog with trigger button",
          "html": "<bp-button popovertarget=\"my-dialog\">Open</bp-button>\n<bp-dialog id=\"my-dialog\" modal closable>\n  <h2 slot=\"header\" bp-text=\"section\">Dialog Title</h2>\n  <p>Dialog content goes here.</p>\n  <div slot=\"footer\" bp-layout=\"inline gap:xs inline:end\">\n    <bp-button action=\"secondary\">Cancel</bp-button>\n    <bp-button status=\"accent\">Confirm</bp-button>\n  </div>\n</bp-dialog>"
        }
      ]
    }
  ]
}
```

Note the two pattern shapes. `form-field` uses `root` + `children` for parent/child composition. `dialog-trigger` uses `siblings` for a trigger/target relationship with attribute bindings. Some patterns use both — a dialog might have sibling rules for the trigger binding and children rules for its internal slot structure.

## Native Elements in Patterns

Patterns can reference both custom elements and native HTML elements. A form field pattern requires a native `<label>`. A dialog example uses `<h2>`, `<p>`, and `<div>`. The convention is simple: tag names with a hyphen are custom elements (looked up in the CEM), tag names without are native (treated as opaque by the validator).

The validator checks that native elements are present where required but doesn't validate their attributes — that's handled by the browser and other tools. Custom element attributes are validated against the CEM. The pattern schema focuses on what no other tool checks: the compositional relationships between elements.

## Validation

For parent/child patterns, validation walks the DOM and checks each child rule:

```js
function validateChildren(rootEl, children, cem) {
  const errors = [];

  for (const rule of children) {
    if (rule.rule === 'required') {
      const tag = typeof rule.element === 'string' ? rule.element : rule.element.tag;
      const found = rootEl.querySelector(tag);
      if (!found) {
        errors.push({
          rule: 'required',
          element: tag,
          error: `missing required child: ${tag}`
        });
      }
    }

    if (rule.rule === 'oneOf') {
      const tags = rule.options.map(o => (typeof o === 'string' ? o : o.tag));
      const matches = tags.filter(t => rootEl.querySelector(t));
      if (matches.length === 0) {
        errors.push({
          rule: 'oneOf',
          options: tags,
          error: `requires one of: ${tags.join(', ')}`
        });
      }
    }
  }

  return errors;
}
```

For sibling patterns, validation checks that bindings are wired correctly:

```js
function validateBindings(container, siblingRule) {
  const errors = [];
  const triggerTag = siblingRule.trigger.tag;
  const targetTag = siblingRule.target.tag;

  const triggers = container.querySelectorAll(triggerTag);

  for (const trigger of triggers) {
    for (const binding of siblingRule.bindings || []) {
      const triggerVal = trigger.getAttribute(binding.triggerAttribute);
      if (!triggerVal) {
        errors.push({
          element: triggerTag,
          error: `missing ${binding.triggerAttribute}`
        });
        continue;
      }
      const target = container.querySelector(`${targetTag}[${binding.targetAttribute}="${triggerVal}"]`);
      if (!target) {
        errors.push({
          element: triggerTag,
          error: `${binding.triggerAttribute}="${triggerVal}" does not match any ${targetTag} ${binding.targetAttribute}`
        });
      }
    }
  }

  return errors;
}
```

## Authoring Guidelines

**One pattern per composition, not per component.** A pattern describes how elements assemble, not what a single element does. `form-field` is a pattern. `bp-input` is not — that's described in the CEM.

**Use string shorthand by default.** Most child rules just need a tag name. Only reach for the object form (`{ tag, attributes, slot }`) when you need attribute constraints or slot assignments. Compare:

```json
{ "rule": "required", "element": "label" }
```

vs.

```json
{ "rule": "optional", "element": { "tag": "*", "slot": "header" } }
```

**Split trigger and structure patterns.** A dialog has two compositional concerns: how to trigger it (sibling pattern with bindings) and how to structure its content (parent/child with slot assignments). These are separate patterns (`dialog-trigger` and `dialog-structure`) because they're independently useful and independently validated.

**Include multiple examples per pattern.** A `form-field` pattern with only an `bp-input` example teaches agents that form fields contain inputs. Add a `bp-select` example and they learn the pattern is about the wrapper structure, not the specific control.

**Use `relatedPatterns` for composition chains.** A form field typically lives inside a `form-group`. A dialog trigger points to a `dialog-structure`. Cross-references let agents discover the full assembly when they start from any piece.

## Integration

Reference the manifest in `package.json`:

```json
{
  "customPatterns": "custom-patterns.json"
}
```

This follows the same convention as `customElements` (CEM), `customAttributes`, and `customStyles` — one field per schema, all discoverable from the package root.
