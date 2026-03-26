import { describe, test, expect } from 'bun:test';
import { NoUnknownCSSCustomProperty } from './no-unknown-css-custom-property.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';

describe('NoUnknownCSSCustomProperty', () => {
  test('known property produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<style>bp-button { --bp-button-background: red; }</style>');
    const rule = new NoUnknownCSSCustomProperty();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown property produces error', () => {
    const store = makeStore();
    const doc = parseHTML('<style>bp-button { --unknown-prop: red; }</style>');
    const rule = new NoUnknownCSSCustomProperty();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('--unknown-prop');
  });

  test('inline style unknown property', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button style="--unknown: red;"></bp-button>');
    const rule = new NoUnknownCSSCustomProperty();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('--unknown');
  });
});
