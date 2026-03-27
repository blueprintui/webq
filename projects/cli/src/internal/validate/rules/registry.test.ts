import { describe, test, expect } from 'bun:test';
import { allRules, getRule } from '../validate.js';
import './index.js';

describe('Rule Registry', () => {
  test('getRule returns known rule', () => {
    const rule = getRule('no-unknown-attr');
    expect(rule).toBeDefined();
    expect(rule?.id).toBe('no-unknown-attr');
  });

  test('getRule returns undefined for unknown', () => {
    expect(getRule('nonexistent-rule')).toBeUndefined();
  });

  test('allRules returns 18 rules', () => {
    const rules = allRules();
    expect(rules.length).toBe(18);
  });

  test('all rules have unique IDs', () => {
    const rules = allRules();
    const ids = new Set(rules.map(r => r.id));
    expect(ids.size).toBe(rules.length);
  });
});
