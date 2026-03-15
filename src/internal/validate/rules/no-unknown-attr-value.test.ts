import { describe, test, expect } from 'bun:test';
import { NoUnknownAttrValue } from './no-unknown-attr-value.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';

describe('NoUnknownAttrValue', () => {
  test('valid value produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button variant="primary"></bp-button>');
    const rule = new NoUnknownAttrValue();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('invalid value produces error', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button variant="invalid"></bp-button>');
    const rule = new NoUnknownAttrValue();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('invalid');
    expect(msgs[0].message).toContain('primary');
  });

  test('no value attribute skipped', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button disabled></bp-button>');
    const rule = new NoUnknownAttrValue();
    expect(rule.check(doc, store)).toEqual([]);
  });
});
