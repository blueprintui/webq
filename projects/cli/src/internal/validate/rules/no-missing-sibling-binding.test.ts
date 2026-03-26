import { describe, test, expect } from 'bun:test';
import { NoMissingSiblingBinding } from './no-missing-sibling-binding.js';
import { parseHTML } from '../html.js';
import { makeStore, makePatternsStore } from './test-helper.js';

const siblingPatternsJSON = `{
  "schemaVersion": "1.0.0",
  "patterns": [{
    "name": "dialog-trigger",
    "description": "Button triggers dialog",
    "structure": {
      "siblings": [{
        "trigger": { "tag": "bp-button", "attributes": [{ "name": "popovertarget", "required": true }] },
        "target": { "tag": "bp-dialog", "attributes": [{ "name": "id", "required": true }] },
        "bindings": [{ "triggerAttribute": "popovertarget", "targetAttribute": "id" }]
      }]
    }
  }]
}`;

const siblingCEMJSON = `{
  "schemaVersion": "1.0.0",
  "modules": [
    { "kind": "javascript-module", "path": "src/button.js", "declarations": [{ "kind": "class", "name": "BpButton", "tagName": "bp-button", "customElement": true, "attributes": [{ "name": "popovertarget" }] }] },
    { "kind": "javascript-module", "path": "src/dialog.js", "declarations": [{ "kind": "class", "name": "BpDialog", "tagName": "bp-dialog", "customElement": true }] }
  ]
}`;

describe('NoMissingSiblingBinding', () => {
  test('valid binding produces no messages', () => {
    const store = makeStore(siblingCEMJSON);
    const ps = makePatternsStore(siblingPatternsJSON);
    const rule = new NoMissingSiblingBinding();
    rule.setPatternStore(ps);
    const doc = parseHTML(
      '<bp-button popovertarget="my-dialog">Open</bp-button><bp-dialog id="my-dialog"></bp-dialog>'
    );
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('missing target produces error', () => {
    const store = makeStore(siblingCEMJSON);
    const ps = makePatternsStore(siblingPatternsJSON);
    const rule = new NoMissingSiblingBinding();
    rule.setPatternStore(ps);
    const doc = parseHTML('<bp-button popovertarget="my-dialog">Open</bp-button>');
    const msgs = rule.check(doc, store);
    expect(msgs.some(m => m.message.includes('no sibling'))).toBe(true);
  });

  test('mismatched binding produces error', () => {
    const store = makeStore(siblingCEMJSON);
    const ps = makePatternsStore(siblingPatternsJSON);
    const rule = new NoMissingSiblingBinding();
    rule.setPatternStore(ps);
    const doc = parseHTML('<bp-button popovertarget="dialog-a">Open</bp-button><bp-dialog id="dialog-b"></bp-dialog>');
    expect(rule.check(doc, store).length).toBeGreaterThan(0);
  });

  test('button without trigger attrs is ignored', () => {
    const store = makeStore(siblingCEMJSON);
    const ps = makePatternsStore(siblingPatternsJSON);
    const rule = new NoMissingSiblingBinding();
    rule.setPatternStore(ps);
    const doc = parseHTML('<bp-button>Open</bp-button><bp-dialog id="my-dialog"></bp-dialog>');
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('nil pattern store produces no messages', () => {
    const store = makeStore(siblingCEMJSON);
    const rule = new NoMissingSiblingBinding();
    const doc = parseHTML('<bp-button popovertarget="x">Open</bp-button>');
    expect(rule.check(doc, store)).toEqual([]);
  });
});
