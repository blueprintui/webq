import { describe, test, expect } from 'bun:test';
import { Store } from '../store.js';
import { parseManifestFromString } from '../parser.js';
import type { ToolContext } from '../../tools.js';
import * as elementMethods from './methods.js';

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

describe('elementMethods', () => {
  test('toJSON returns method members with parameters and return', () => {
    const result = elementMethods.toJSON(makeCtx(), { tagName: 'bp-button' }) as {
      methods: {
        name: string;
        parameters?: { name: string; optional?: boolean }[];
        return?: { type?: { text: string } };
      }[];
    };
    expect(result.methods).toHaveLength(1);
    expect(result.methods[0].name).toBe('focus');
    expect(result.methods[0].parameters).toHaveLength(1);
    expect(result.methods[0].parameters?.[0].name).toBe('opts');
    expect(result.methods[0].parameters?.[0].optional).toBe(true);
    expect(result.methods[0].return?.type?.text).toBe('void');
  });

  test('toJSON throws for unknown element', () => {
    expect(() => elementMethods.toJSON(makeCtx(), { tagName: 'bp-unknown' })).toThrow();
  });

  test('toMarkdown returns formatted methods', () => {
    const md = elementMethods.toMarkdown(makeCtx(), { tagName: 'bp-button' });
    expect(md).toContain('focus');
    expect(md).toContain('Methods');
  });
});
