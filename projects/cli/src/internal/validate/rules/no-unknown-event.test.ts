import { describe, test, expect } from 'bun:test';
import { NoUnknownEvent } from './no-unknown-event.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';

describe('NoUnknownEvent', () => {
  test('known event produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button @bp-click="h"></bp-button>');
    const rule = new NoUnknownEvent();
    rule.configure({});
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown event produces error', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button @unknown="h"></bp-button>');
    const rule = new NoUnknownEvent();
    rule.configure({});
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('unknown');
    expect(msgs[0].line).toBe(1);
    expect(msgs[0].column).toBe(12);
  });

  test('allowed events skip', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button @unknown="h"></bp-button>');
    const rule = new NoUnknownEvent();
    rule.configure({ events: ['unknown'] });
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('supports (event) syntax', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button (bp-click)="h"></bp-button>');
    const rule = new NoUnknownEvent();
    rule.configure({});
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('supports on-event syntax', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button on-bp-click="h"></bp-button>');
    const rule = new NoUnknownEvent();
    rule.configure({});
    expect(rule.check(doc, store)).toEqual([]);
  });
});
