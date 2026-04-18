import { describe, test, expect, beforeEach, afterAll } from 'bun:test';
import type { WebqMessage } from './webq.js';
import { runWebqValidation, clearCache, _internals } from './webq.js';

const origValidate = _internals.validate;

describe('runWebqValidation', () => {
  beforeEach(() => {
    clearCache();
  });

  afterAll(() => {
    _internals.validate = origValidate;
  });

  test('returns messages from validation', () => {
    const messages: WebqMessage[] = [
      { ruleId: 'no-unknown-element', severity: 2, message: 'Unknown element', line: 1, column: 1 }
    ];
    _internals.validate = () => messages;

    const result = runWebqValidation('<x-foo></x-foo>', '/path/a');
    expect(result).toEqual(messages);
  });

  test('returns cached result on repeat call', () => {
    let callCount = 0;
    _internals.validate = () => {
      callCount++;
      return [];
    };

    runWebqValidation('<x-cache></x-cache>', '/path/cache');
    expect(callCount).toBe(1);

    runWebqValidation('<x-cache></x-cache>', '/path/cache');
    expect(callCount).toBe(1);
  });

  test('returns empty array for empty path', () => {
    const result = runWebqValidation('<div></div>', '');
    expect(result).toEqual([]);
  });

  test('executes validation exactly once for 18 calls with the same (html, path)', () => {
    let callCount = 0;
    _internals.validate = () => {
      callCount++;
      return [{ ruleId: 'r', severity: 2, message: 'm', line: 1, column: 1 }];
    };

    const html = '<x-perf></x-perf>';
    const path = '/path/perf';

    for (let i = 0; i < 18; i++) {
      const result = runWebqValidation(html, path);
      expect(result.length).toBe(1);
    }

    expect(callCount).toBe(1);
  });

  test('differentiates cache by path', () => {
    let callCount = 0;
    _internals.validate = () => {
      callCount++;
      return [];
    };

    runWebqValidation('<x-foo></x-foo>', '/path/a');
    runWebqValidation('<x-foo></x-foo>', '/path/b');
    expect(callCount).toBe(2);
  });

  test('differentiates cache by html', () => {
    let callCount = 0;
    _internals.validate = () => {
      callCount++;
      return [];
    };

    runWebqValidation('<x-foo></x-foo>', '/path/a');
    runWebqValidation('<x-bar></x-bar>', '/path/a');
    expect(callCount).toBe(2);
  });

  test('propagates errors from validation', () => {
    _internals.validate = () => {
      throw new Error('boom');
    };

    expect(() => runWebqValidation('<x-err></x-err>', '/path/err')).toThrow('boom');
  });

  test('clearCache forces re-validation', () => {
    let callCount = 0;
    _internals.validate = () => {
      callCount++;
      return [];
    };

    runWebqValidation('<x-clear></x-clear>', '/path/clear');
    expect(callCount).toBe(1);

    clearCache();
    runWebqValidation('<x-clear></x-clear>', '/path/clear');
    expect(callCount).toBe(2);
  });
});
