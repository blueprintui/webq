import { describe, test, expect } from 'bun:test';
import { NoDeprecatedEvent } from './no-deprecated-event.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

describe('NoDeprecatedEvent', () => {
  test('deprecated event warns', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-alert @bp-close="h"></bp-alert>');
    const rule = new NoDeprecatedEvent();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].severity).toBe(Severity.Warning);
    expect(msgs[0].message).toContain('bp-close');
    expect(msgs[0].line).toBe(1);
    expect(msgs[0].column).toBe(11);
  });

  test('non-deprecated event no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button @bp-click="h"></bp-button>');
    const rule = new NoDeprecatedEvent();
    expect(rule.check(doc, store)).toEqual([]);
  });
});
