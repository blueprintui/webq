import { describe, test, expect } from 'bun:test';
import { NoUnknownSlot } from './no-unknown-slot.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';

describe('NoUnknownSlot', () => {
  test('known slot produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button><span slot="prefix">x</span></bp-button>');
    const rule = new NoUnknownSlot();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown slot produces error', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button><span slot="unknown">x</span></bp-button>');
    const rule = new NoUnknownSlot();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('unknown');
  });
});
