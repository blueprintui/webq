import { Store } from '../../elements/store.js';
import { parseManifestFromString } from '../../elements/parser.js';
import { PatternStore } from '../../patterns/store.js';
import type { PatternsFile } from '../../patterns/types.js';

const manifestJSON = `{
  "schemaVersion": "1.0.0",
  "modules": [
    {
      "kind": "javascript-module",
      "path": "src/button.js",
      "declarations": [{
        "kind": "class", "name": "BpButton", "tagName": "bp-button", "customElement": true,
        "attributes": [
          { "name": "variant", "type": { "text": "'primary' | 'secondary' | 'danger'" } },
          { "name": "disabled", "type": { "text": "boolean" } },
          { "name": "size", "type": { "text": "'sm' | 'md' | 'lg'" } }
        ],
        "events": [
          { "name": "bp-click", "type": { "text": "CustomEvent" } },
          { "name": "bp-focus", "type": { "text": "CustomEvent" } }
        ],
        "slots": [
          { "name": "", "description": "Default slot" },
          { "name": "prefix" },
          { "name": "suffix" }
        ],
        "cssProperties": [
          { "name": "--bp-button-background" },
          { "name": "--bp-button-color" }
        ],
        "cssParts": [
          { "name": "base" },
          { "name": "label" }
        ],
        "commands": [
          { "name": "--open" },
          { "name": "--close" }
        ],
        "members": [
          { "kind": "field", "name": "variant", "type": { "text": "string" } },
          { "kind": "method", "name": "focus", "return": { "type": { "text": "void" } } }
        ]
      }]
    },
    {
      "kind": "javascript-module",
      "path": "src/alert.js",
      "declarations": [{
        "kind": "class", "name": "BpAlert", "tagName": "bp-alert", "customElement": true,
        "deprecated": "Use bp-notification instead",
        "attributes": [
          { "name": "status", "type": { "text": "'success' | 'warning' | 'danger'" } },
          { "name": "closable", "type": { "text": "boolean" }, "deprecated": "Use dismissible instead" }
        ],
        "events": [
          { "name": "bp-close", "type": { "text": "CustomEvent" }, "deprecated": "Use bp-dismiss event instead" }
        ],
        "slots": [],
        "cssProperties": [],
        "cssParts": [],
        "commands": []
      }]
    },
    {
      "kind": "javascript-module",
      "path": "src/card.js",
      "declarations": [{
        "kind": "class", "name": "BpCard", "tagName": "bp-card", "customElement": true,
        "attributes": [],
        "events": [],
        "slots": [
          { "name": "header" },
          { "name": "", "description": "Default slot" },
          { "name": "footer" },
          { "name": "media", "deprecated": "Use default slot instead" }
        ],
        "cssProperties": [],
        "cssParts": [],
        "commands": [
          { "name": "--close" },
          { "name": "--dismiss", "deprecated": "Use --close instead" }
        ]
      }]
    }
  ]
}`;

export function makeStore(json: string = manifestJSON): Store {
  const manifest = parseManifestFromString(json);
  return new Store(manifest);
}

export function makePatternsStore(json: string): PatternStore {
  const raw = JSON.parse(json);
  if (raw.patterns) {
    for (const pattern of raw.patterns) {
      normalizePattern(pattern);
    }
  }
  return new PatternStore(raw as PatternsFile);
}

function normalizePattern(pattern: { structure?: { root?: unknown; children?: unknown[] } }): void {
  if (!pattern.structure) return;
  normalizeRoot(pattern.structure);
  normalizeChildren(pattern.structure.children);
}

function normalizeRoot(structure: { root?: unknown }): void {
  if (structure.root && typeof structure.root === 'string') {
    structure.root = { tag: structure.root };
  }
}

function normalizeChildren(children: unknown[] | undefined): void {
  if (!children) return;
  for (const child of children as Array<{ element?: unknown; options?: unknown[] }>) {
    normalizeChild(child);
  }
}

function normalizeChild(child: { element?: unknown; options?: unknown[] }): void {
  if (child.element && typeof child.element === 'string') {
    child.element = { tag: child.element };
  }
  if (child.options) {
    child.options = child.options.map(opt => (typeof opt === 'string' ? { tag: opt } : opt));
  }
}
