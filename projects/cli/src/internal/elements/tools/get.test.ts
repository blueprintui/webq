import { describe, test, expect } from 'bun:test';
import { Store } from '../store.js';
import { parseManifestFromString } from '../parser.js';
import type { ToolContext } from '../../tools.js';
import * as elementGet from './get.js';

const manifestJSON = `{
  "schemaVersion": "1.0.0",
  "modules": [{
    "kind": "javascript-module",
    "path": "src/button.js",
    "declarations": [{
      "kind": "class", "name": "BpButton", "tagName": "bp-button", "customElement": true,
      "description": "A button component",
      "attributes": [
        { "name": "variant", "type": { "text": "'primary' | 'secondary'" }, "default": "'primary'", "fieldName": "variant", "reflects": true },
        { "name": "disabled", "type": { "text": "boolean" }, "default": "false", "deprecated": "Use aria-disabled" }
      ],
      "members": [
        { "kind": "field", "name": "variant", "type": { "text": "string" }, "default": "'primary'", "privacy": "public", "readonly": false },
        { "kind": "method", "name": "focus", "description": "Sets focus", "privacy": "public",
          "parameters": [{ "name": "opts", "type": { "text": "FocusOptions" }, "optional": true }],
          "return": { "type": { "text": "void" } } }
      ],
      "events": [
        { "name": "bp-click", "type": { "text": "CustomEvent" }, "deprecated": "Use click" }
      ],
      "slots": [
        { "name": "", "description": "Default slot" },
        { "name": "prefix", "deprecated": "Use start" }
      ],
      "commands": [
        { "name": "toggle", "description": "Toggles the button", "deprecated": "Use toggle()" }
      ],
      "cssProperties": [
        { "name": "--bp-button-bg", "default": "blue", "deprecated": "Use --bp-bg" }
      ],
      "cssParts": [
        { "name": "base", "description": "The base wrapper", "deprecated": "Use root" }
      ]
    }]
  }]
}`;

function makeCtx(): ToolContext {
  return { store: new Store(parseManifestFromString(manifestJSON)) };
}

describe('elementGet', () => {
  test('toJSON returns full element output', () => {
    const result = elementGet.toJSON(makeCtx(), { tagName: 'bp-button' }) as unknown as Record<string, unknown>;
    expect(result.tagName).toBe('bp-button');
    expect(result.name).toBe('BpButton');
    expect(result.attributes).toHaveLength(2);
    expect(result.properties).toHaveLength(1);
    expect(result.methods).toHaveLength(1);
    expect(result.events).toHaveLength(1);
    expect(result.slots).toHaveLength(2);
    expect(result.commands).toHaveLength(1);
    expect(result.cssProperties).toHaveLength(1);
    expect(result.cssParts).toHaveLength(1);
  });

  test('toJSON throws for unknown element', () => {
    expect(() => elementGet.toJSON(makeCtx(), { tagName: 'bp-unknown' })).toThrow("element 'bp-unknown' not found");
  });

  test('toMarkdown returns formatted element', () => {
    const md = elementGet.toMarkdown(makeCtx(), { tagName: 'bp-button' });
    expect(md).toContain('<bp-button>');
    expect(md).toContain('Attributes');
  });

  test('toMarkdown throws for unknown element', () => {
    expect(() => elementGet.toMarkdown(makeCtx(), { tagName: 'bp-unknown' })).toThrow("element 'bp-unknown' not found");
  });
});
