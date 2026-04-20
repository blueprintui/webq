import { describe, test, expect } from 'bun:test';
import { verify, allRules } from './validate.js';
import { Severity } from './types.js';
import type { ValidateConfig } from './types.js';
import { Store } from '../elements/store.js';
import { parseManifestFromString } from '../elements/parser.js';
import './rules/index.js';

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
      "slots": [{ "name": "" }, { "name": "prefix" }],
      "cssProperties": [{ "name": "--bp-button-bg" }],
      "cssParts": [{ "name": "base" }],
      "commands": []
    }]
  }]
}`;

function makeStore(): Store {
  return new Store(parseManifestFromString(manifestJSON));
}

describe('verify', () => {
  test('valid HTML produces no messages', () => {
    const store = makeStore();
    const result = verify('<bp-button variant="primary">Click</bp-button>', store, allRules());
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });

  test('empty HTML produces no messages', () => {
    const store = makeStore();
    const result = verify('', store, allRules());
    expect(result.messages).toEqual([]);
  });

  test('multiple errors accumulate', () => {
    const store = makeStore();
    const result = verify('<bp-button unknown-attr="x" variant="bad">Click</bp-button>', store, allRules());
    expect(result.errorCount).toBeGreaterThanOrEqual(2);
  });

  test('severity override changes error to warning', () => {
    const store = makeStore();
    const cfg: ValidateConfig = {
      ruleSeverities: new Map([['no-unknown-attr', Severity.Warning]]),
      ruleOptions: new Map()
    };
    const result = verify('<bp-button unknown="x">Click</bp-button>', store, allRules(), { cfg });
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBeGreaterThanOrEqual(1);
    const msg = result.messages.find(m => m.ruleId === 'no-unknown-attr');
    expect(msg?.severity).toBe(Severity.Warning);
  });

  test('severity off disables rule', () => {
    const store = makeStore();
    const cfg: ValidateConfig = {
      ruleSeverities: new Map([['no-unknown-attr', Severity.Off]]),
      ruleOptions: new Map()
    };
    const result = verify('<bp-button unknown="x">Click</bp-button>', store, allRules(), { cfg });
    const msg = result.messages.find(m => m.ruleId === 'no-unknown-attr');
    expect(msg).toBeUndefined();
  });

  test('rule options configure allowed tags', () => {
    const store = makeStore();
    const cfg: ValidateConfig = {
      ruleSeverities: new Map(),
      ruleOptions: new Map([['no-unknown-element', { tags: ['bp-custom'] }]])
    };
    const result = verify('<bp-custom>test</bp-custom>', store, allRules(), { cfg });
    const msg = result.messages.find(m => m.ruleId === 'no-unknown-element');
    expect(msg).toBeUndefined();
  });

  test('native elements produce no messages', () => {
    const store = makeStore();
    const result = verify('<div class="x"><span>text</span></div>', store, allRules());
    expect(result.messages).toEqual([]);
  });

  test('boolean attr with value warns', () => {
    const store = makeStore();
    const result = verify('<bp-button disabled="true">Click</bp-button>', store, allRules());
    expect(result.warningCount).toBeGreaterThanOrEqual(1);
    const msg = result.messages.find(m => m.ruleId === 'no-boolean-attr-value');
    expect(msg).toBeDefined();
  });
});
