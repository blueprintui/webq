import { describe, test, expect } from 'bun:test';
import { NoDeprecatedAttr } from './no-deprecated-attr.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

describe('NoDeprecatedAttr', () => {
  test('deprecated attr warns', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-alert closable></bp-alert>');
    const rule = new NoDeprecatedAttr();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].severity).toBe(Severity.Warning);
    expect(msgs[0].message).toContain('closable');
    expect(msgs[0].message).toContain('Use dismissible instead');
    expect(msgs[0].line).toBe(1);
    expect(msgs[0].column).toBe(11);
  });

  test('non-deprecated attr no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-alert status="success"></bp-alert>');
    const rule = new NoDeprecatedAttr();
    expect(rule.check(doc, store)).toEqual([]);
  });
});
