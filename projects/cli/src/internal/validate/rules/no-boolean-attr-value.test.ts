import { describe, test, expect } from 'bun:test';
import { NoBooleanAttrValue } from './no-boolean-attr-value.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

describe('NoBooleanAttrValue', () => {
  test('boolean with value warns', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button disabled="true"></bp-button>');
    const rule = new NoBooleanAttrValue();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].severity).toBe(Severity.Warning);
    expect(msgs[0].message).toContain('disabled');
    expect(msgs[0].line).toBe(1);
    expect(msgs[0].column).toBe(12);
  });

  test('boolean without value ok', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button disabled></bp-button>');
    const rule = new NoBooleanAttrValue();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('non-boolean with value ok', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button variant="primary"></bp-button>');
    const rule = new NoBooleanAttrValue();
    expect(rule.check(doc, store)).toEqual([]);
  });
});
