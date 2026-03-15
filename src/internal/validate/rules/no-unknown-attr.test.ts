import { describe, test, expect } from 'bun:test';
import { NoUnknownAttr } from './no-unknown-attr.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

describe('NoUnknownAttr', () => {
  test('known attribute produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button variant="primary"></bp-button>');
    const rule = new NoUnknownAttr();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown attribute produces error', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button unknown="val"></bp-button>');
    const rule = new NoUnknownAttr();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].ruleId).toBe('no-unknown-attr');
    expect(msgs[0].severity).toBe(Severity.Error);
    expect(msgs[0].message).toContain('unknown');
    expect(msgs[0].message).toContain('Valid attributes');
  });

  test('global attrs allowed', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button class="x" id="y" data-testid="z" aria-label="btn"></bp-button>');
    const rule = new NoUnknownAttr();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('event bindings skipped', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button @bp-click="handler"></bp-button>');
    const rule = new NoUnknownAttr();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('command attrs skipped', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button command="--open" commandfor="target"></bp-button>');
    const rule = new NoUnknownAttr();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown element skipped', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-unknown anything="val"></bp-unknown>');
    const rule = new NoUnknownAttr();
    expect(rule.check(doc, store)).toEqual([]);
  });
});
