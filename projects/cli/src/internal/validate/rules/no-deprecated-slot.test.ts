import { describe, test, expect } from 'bun:test';
import { NoDeprecatedSlot } from './no-deprecated-slot.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

describe('NoDeprecatedSlot', () => {
  test('deprecated slot warns', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-card><div slot="media">Image</div></bp-card>');
    const rule = new NoDeprecatedSlot();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].severity).toBe(Severity.Warning);
    expect(msgs[0].message).toContain('media');
    expect(msgs[0].line).toBe(1);
    expect(msgs[0].column).toBe(15);
  });

  test('non-deprecated slot no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-card><div slot="header">Title</div></bp-card>');
    const rule = new NoDeprecatedSlot();
    expect(rule.check(doc, store)).toEqual([]);
  });
});
