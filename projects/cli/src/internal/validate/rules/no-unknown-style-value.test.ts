import { describe, test, expect } from 'bun:test';
import { NoUnknownStyleValue } from './no-unknown-style-value.js';
import { CustomStyleStore } from '../../styles/store.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

function makeCustomStyleStore(): CustomStyleStore {
  return new CustomStyleStore({
    schemaVersion: '1.0.0',
    cssCustomProperties: [{ name: '--bp-space-md' }, { name: '--bp-color-blue-0' }, { name: '--bp-font-size-base' }]
  });
}

describe('NoUnknownStyleValue', () => {
  test('valid global token produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<style>bp-button { padding: var(--bp-space-md); }</style>');
    const rule = new NoUnknownStyleValue();
    rule.setCustomStyleStore(makeCustomStyleStore());
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('valid element CSS property produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<style>bp-button { color: var(--bp-button-background); }</style>');
    const rule = new NoUnknownStyleValue();
    rule.setCustomStyleStore(makeCustomStyleStore());
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown var() ref produces warning', () => {
    const store = makeStore();
    const doc = parseHTML('<style>bp-button { padding: var(--bp-unknown); }</style>');
    const rule = new NoUnknownStyleValue();
    rule.setCustomStyleStore(makeCustomStyleStore());
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].ruleId).toBe('no-unknown-style-value');
    expect(msgs[0].message).toContain('--bp-unknown');
    expect(msgs[0].severity).toBe(Severity.Warning);
  });

  test('inline style unknown var()', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button style="padding: var(--bp-unknown)"></bp-button>');
    const rule = new NoUnknownStyleValue();
    rule.setCustomStyleStore(makeCustomStyleStore());
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('--bp-unknown');
  });

  test('var() with fallback still reports unknown', () => {
    const store = makeStore();
    const doc = parseHTML('<style>bp-button { padding: var(--bp-unknown, 8px); }</style>');
    const rule = new NoUnknownStyleValue();
    rule.setCustomStyleStore(makeCustomStyleStore());
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('--bp-unknown');
  });

  test('nil style store produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<style>bp-button { padding: var(--bp-unknown); }</style>');
    const rule = new NoUnknownStyleValue();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('non-custom-element with valid token', () => {
    const store = makeStore();
    const doc = parseHTML('<style>.my-class { gap: var(--bp-space-md); }</style>');
    const rule = new NoUnknownStyleValue();
    rule.setCustomStyleStore(makeCustomStyleStore());
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('non-custom-element with unknown token', () => {
    const store = makeStore();
    const doc = parseHTML('<style>.card { padding: var(--bp-unknown); }</style>');
    const rule = new NoUnknownStyleValue();
    rule.setCustomStyleStore(makeCustomStyleStore());
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('--bp-unknown');
  });

  test('multiple var() refs', () => {
    const store = makeStore();
    const doc = parseHTML(
      '<style>bp-button { padding: var(--bp-space-md); color: var(--bp-unknown); margin: var(--bp-also-unknown); }</style>'
    );
    const rule = new NoUnknownStyleValue();
    rule.setCustomStyleStore(makeCustomStyleStore());
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(2);
    expect(msgs[0].message).toContain('--bp-unknown');
    expect(msgs[1].message).toContain('--bp-also-unknown');
  });
});
