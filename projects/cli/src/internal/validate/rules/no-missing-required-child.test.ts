import { describe, test, expect } from 'bun:test';
import { NoMissingRequiredChild } from './no-missing-required-child.js';
import { parseHTML } from '../html.js';
import { makeStore, makePatternsStore } from './test-helper.js';

const patternsJSON = `{
  "schemaVersion": "1.0.0",
  "patterns": [
    {
      "name": "form-field",
      "description": "Form field pattern",
      "structure": {
        "root": "bp-field",
        "children": [
          { "rule": "required", "element": "label" },
          { "rule": "oneOf", "options": ["bp-input", "bp-select", "bp-textarea"] },
          { "rule": "optional", "element": "bp-field-message" }
        ]
      }
    },
    {
      "name": "alert-group",
      "description": "Alert group pattern",
      "structure": {
        "root": "bp-alert-group",
        "children": [{ "rule": "oneOrMore", "element": "bp-alert" }]
      }
    }
  ]
}`;

const patternCEMJSON = `{
  "schemaVersion": "1.0.0",
  "modules": [
    { "kind": "javascript-module", "path": "src/field.js", "declarations": [{ "kind": "class", "name": "BpField", "tagName": "bp-field", "customElement": true }] },
    { "kind": "javascript-module", "path": "src/input.js", "declarations": [{ "kind": "class", "name": "BpInput", "tagName": "bp-input", "customElement": true }] },
    { "kind": "javascript-module", "path": "src/alert-group.js", "declarations": [{ "kind": "class", "name": "BpAlertGroup", "tagName": "bp-alert-group", "customElement": true }] },
    { "kind": "javascript-module", "path": "src/alert.js", "declarations": [{ "kind": "class", "name": "BpAlert", "tagName": "bp-alert", "customElement": true }] }
  ]
}`;

describe('NoMissingRequiredChild', () => {
  test('valid pattern produces no messages', () => {
    const store = makeStore(patternCEMJSON);
    const ps = makePatternsStore(patternsJSON);
    const rule = new NoMissingRequiredChild();
    rule.setPatternStore(ps);
    const doc = parseHTML('<bp-field><label>Name</label><bp-input></bp-input></bp-field>');
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('missing required child produces error', () => {
    const store = makeStore(patternCEMJSON);
    const ps = makePatternsStore(patternsJSON);
    const rule = new NoMissingRequiredChild();
    rule.setPatternStore(ps);
    const doc = parseHTML('<bp-field><bp-input></bp-input></bp-field>');
    const msgs = rule.check(doc, store);
    expect(msgs.some(m => m.message.includes('label'))).toBe(true);
  });

  test('missing oneOf produces error', () => {
    const store = makeStore(patternCEMJSON);
    const ps = makePatternsStore(patternsJSON);
    const rule = new NoMissingRequiredChild();
    rule.setPatternStore(ps);
    const doc = parseHTML('<bp-field><label>Name</label></bp-field>');
    const msgs = rule.check(doc, store);
    expect(msgs.some(m => m.message.includes('one of'))).toBe(true);
  });

  test('missing oneOrMore produces error', () => {
    const store = makeStore(patternCEMJSON);
    const ps = makePatternsStore(patternsJSON);
    const rule = new NoMissingRequiredChild();
    rule.setPatternStore(ps);
    const doc = parseHTML('<bp-alert-group></bp-alert-group>');
    expect(rule.check(doc, store).length).toBeGreaterThan(0);
  });

  test('nil pattern store produces no messages', () => {
    const store = makeStore(patternCEMJSON);
    const rule = new NoMissingRequiredChild();
    const doc = parseHTML('<bp-field></bp-field>');
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('required child with slot matches correctly', () => {
    const slotPatternsJSON = `{
      "schemaVersion": "1.0.0",
      "patterns": [{
        "name": "card-layout",
        "description": "Card with header slot",
        "structure": {
          "root": "bp-card",
          "children": [
            { "rule": "required", "element": { "tag": "div", "slot": "header" } }
          ]
        }
      }]
    }`;
    const slotCEMJSON = `{
      "schemaVersion": "1.0.0",
      "modules": [
        { "kind": "javascript-module", "path": "src/card.js", "declarations": [{ "kind": "class", "name": "BpCard", "tagName": "bp-card", "customElement": true }] }
      ]
    }`;
    const store = makeStore(slotCEMJSON);
    const ps = makePatternsStore(slotPatternsJSON);
    const rule = new NoMissingRequiredChild();
    rule.setPatternStore(ps);

    const validDoc = parseHTML('<bp-card><div slot="header">Title</div></bp-card>');
    expect(rule.check(validDoc, store)).toEqual([]);

    const invalidDoc = parseHTML('<bp-card><div>No slot</div></bp-card>');
    const msgs = rule.check(invalidDoc, store);
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].message).toContain('slot="header"');
  });
});
