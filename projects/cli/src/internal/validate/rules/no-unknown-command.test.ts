import { describe, test, expect } from 'bun:test';
import { NoUnknownCommand } from './no-unknown-command.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';

describe('NoUnknownCommand', () => {
  test('known command produces no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button id="btn1"></bp-button><button command="--open" commandfor="btn1">Open</button>');
    const rule = new NoUnknownCommand();
    expect(rule.check(doc, store)).toEqual([]);
  });

  test('unknown command produces error', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-button id="btn1"></bp-button><button command="--unknown" commandfor="btn1">X</button>');
    const rule = new NoUnknownCommand();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].message).toContain('--unknown');
  });
});
