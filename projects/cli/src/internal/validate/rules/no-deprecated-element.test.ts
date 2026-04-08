import { describe, test, expect } from 'bun:test';
import { NoDeprecatedElement } from './no-deprecated-element.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

describe('NoDeprecatedElement', () => {
  test('deprecated element warns', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-alert></bp-alert>');
    const rule = new NoDeprecatedElement();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].severity).toBe(Severity.Warning);
    expect(msgs[0].message).toContain('deprecated');
    expect(msgs[0].line).toBe(1);
    expect(msgs[0].column).toBe(1);
    expect(msgs[0].endLine).toBe(1);
    expect(msgs[0].endColumn).toBe(21);
  });

  test('non-deprecated element no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button></bp-button>');
    const rule = new NoDeprecatedElement();
    expect(rule.check(doc, store)).toEqual([]);
  });
});
