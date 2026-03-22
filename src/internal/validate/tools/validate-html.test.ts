import { describe, test, expect } from 'bun:test';
import { Store } from '../../elements/store.js';
import { parseManifestFromString } from '../../elements/parser.js';
import type { ToolContext } from '../../tools.js';
import * as validateHTML from './validate-html.js';
import '../rules/index.js';

const manifestJSON = `{
  "schemaVersion": "1.0.0",
  "modules": [{
    "kind": "javascript-module",
    "path": "src/button.js",
    "declarations": [{
      "kind": "class", "name": "BpButton", "tagName": "bp-button", "customElement": true,
      "attributes": [
        { "name": "variant", "type": { "text": "'primary' | 'secondary'" } },
        { "name": "disabled", "type": { "text": "boolean" } }
      ],
      "events": [{ "name": "bp-click", "type": { "text": "CustomEvent" } }],
      "slots": [{ "name": "" }],
      "cssProperties": [{ "name": "--bp-button-bg" }],
      "cssParts": [{ "name": "base" }],
      "commands": []
    }]
  }]
}`;

function makeCtx(): ToolContext {
  return { store: new Store(parseManifestFromString(manifestJSON)) };
}

describe('validateHTML', () => {
  test('toJSON returns lint result for valid HTML', () => {
    const result = validateHTML.toJSON(makeCtx(), {
      html: '<bp-button variant="primary">Click</bp-button>'
    }) as { errorCount: number; warningCount: number; messages: unknown[] };
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });

  test('toJSON returns errors for invalid HTML', () => {
    const result = validateHTML.toJSON(makeCtx(), {
      html: '<bp-button unknown="x">Click</bp-button>'
    }) as { errorCount: number; messages: { ruleId: string }[] };
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.messages.some(m => m.ruleId === 'no-unknown-attr')).toBe(true);
  });

  test('toJSON filters by single rule', () => {
    const result = validateHTML.toJSON(makeCtx(), {
      html: '<bp-unknown unknown="x">Click</bp-unknown>',
      rule: 'no-unknown-element'
    }) as { messages: { ruleId: string }[] };
    expect(result.messages.every(m => m.ruleId === 'no-unknown-element')).toBe(true);
  });

  test('toJSON throws for unknown rule', () => {
    expect(() =>
      validateHTML.toJSON(makeCtx(), { html: '<bp-button>Click</bp-button>', rule: 'nonexistent-rule' })
    ).toThrow('unknown rule "nonexistent-rule"');
  });

  test('toJSON returns empty for plain HTML', () => {
    const result = validateHTML.toJSON(makeCtx(), {
      html: '<div class="x"><span>text</span></div>'
    }) as { errorCount: number; warningCount: number };
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });

  test('toMarkdown throws', () => {
    expect(() => validateHTML.toMarkdown(makeCtx(), { html: '' })).toThrow(
      'validate-html does not support markdown output'
    );
  });
});
