import { describe, test, expect } from 'bun:test';
import { NoUnknownCSSPart } from './no-unknown-css-part.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';

describe('NoUnknownCSSPart', () => {
  test('known part produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<style>bp-button::part(base) { color: red; }</style>');
    const rule = new NoUnknownCSSPart();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown part produces error', () => {
    const store = makeStore();
    const doc = parseHTML('<style>bp-button::part(unknown) { color: red; }</style>');
    const rule = new NoUnknownCSSPart();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('unknown');
  });
});
