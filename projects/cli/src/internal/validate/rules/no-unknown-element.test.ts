import { describe, test, expect } from 'bun:test';
import { NoUnknownElement } from './no-unknown-element.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

describe('NoUnknownElement', () => {
  test('known element produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button></bp-button>');
    const rule = new NoUnknownElement();
    rule.configure({});
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown element produces error', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-unknown></bp-unknown>');
    const rule = new NoUnknownElement();
    rule.configure({});
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].ruleId).toBe('no-unknown-element');
    expect(msgs[0].severity).toBe(Severity.Error);
    expect(msgs[0].message).toContain('bp-unknown');
  });

  test('native elements ignored', () => {
    const store = makeStore();
    const doc = parseHTML('<div></div><span></span>');
    const rule = new NoUnknownElement();
    rule.configure({});
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('allowed tags skip', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-unknown></bp-unknown>');
    const rule = new NoUnknownElement();
    rule.configure({ tags: ['bp-unknown'] });
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('duplicate unknown reported once', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-unknown></bp-unknown><bp-unknown></bp-unknown>');
    const rule = new NoUnknownElement();
    rule.configure({});
    expect(rule.check(doc, store).length).toBe(1);
  });
});
