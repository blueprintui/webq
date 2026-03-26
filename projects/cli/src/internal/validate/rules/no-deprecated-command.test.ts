import { describe, test, expect } from 'bun:test';
import { NoDeprecatedCommand } from './no-deprecated-command.js';
import { parseHTML } from '../html.js';
import { makeStore } from './test-helper.js';
import { Severity } from '../types.js';

describe('NoDeprecatedCommand', () => {
  test('deprecated command warns', () => {
    const store = makeStore();
    const doc = parseHTML(
      '<bp-card id="card1"></bp-card><button command="--dismiss" commandfor="card1">Dismiss</button>'
    );
    const rule = new NoDeprecatedCommand();
    const msgs = rule.check(doc, store);
    expect(msgs.length).toBe(1);
    expect(msgs[0].severity).toBe(Severity.Warning);
    expect(msgs[0].message).toContain('--dismiss');
  });

  test('non-deprecated command no messages', () => {
    const store = makeStore();
    const doc = parseHTML('<bp-card id="card1"></bp-card><button command="--close" commandfor="card1">Close</button>');
    const rule = new NoDeprecatedCommand();
    expect(rule.check(doc, store)).toEqual([]);
  });
});
