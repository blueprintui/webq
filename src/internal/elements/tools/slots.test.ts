import { describe, test, expect } from 'bun:test';
import { Store } from '../store.js';
import { parseManifestFromString } from '../parser.js';
import type { ToolContext } from '../../tools.js';
import * as elementSlots from './slots.js';

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

describe('elementSlots', () => {
  test('toJSON returns slots with deprecated', () => {
    const result = elementSlots.toJSON(makeCtx(), { tagName: 'bp-button' }) as {
      slots: { name: string; deprecated?: string }[];
    };
    expect(result.slots).toHaveLength(2);
    expect(result.slots[0].name).toBe('');
    expect(result.slots[1].name).toBe('prefix');
    expect(result.slots[1].deprecated).toBe('Use start');
  });

  test('toJSON throws for unknown element', () => {
    expect(() => elementSlots.toJSON(makeCtx(), { tagName: 'bp-unknown' })).toThrow();
  });

  test('toMarkdown returns formatted slots', () => {
    const md = elementSlots.toMarkdown(makeCtx(), { tagName: 'bp-button' });
    expect(md).toContain('Slots');
  });
});
