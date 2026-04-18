import { describe, test, expect } from 'bun:test';
import plugin, { recommended } from './index.js';

const EXPECTED_RULES = [
  'no-unknown-element',
  'no-unknown-attr',
  'no-unknown-attr-value',
  'no-unknown-event',
  'no-unknown-command',
  'no-unknown-slot',
  'no-unknown-css-part',
  'no-unknown-css-custom-property',
  'no-unknown-style-value',
  'no-unknown-custom-attr-value',
  'no-deprecated-element',
  'no-deprecated-attr',
  'no-deprecated-slot',
  'no-deprecated-event',
  'no-deprecated-command',
  'no-boolean-attr-value',
  'no-missing-required-child',
  'no-missing-sibling-binding'
] as const;

describe('plugin entry', () => {
  test('exports all 18 rules', () => {
    expect(Object.keys(plugin.rules ?? {}).sort()).toEqual([...EXPECTED_RULES].sort());
  });

  test('every registered rule is a valid RuleModule', () => {
    for (const [name, rule] of Object.entries(plugin.rules ?? {})) {
      expect(rule, `rule ${name} has meta`).toHaveProperty('meta');
      expect(rule, `rule ${name} has create`).toHaveProperty('create');
      expect(typeof rule.create, `rule ${name}.create is a function`).toBe('function');
    }
  });
});

describe('recommended()', () => {
  test('wires every registered rule', () => {
    const config = recommended({ path: '/some/path' });
    const ruleKeys = Object.keys(config.rules)
      .map(k => k.replace(/^webq\//, ''))
      .sort();
    expect(ruleKeys).toEqual([...EXPECTED_RULES].sort());
  });

  test('passes path option to every rule', () => {
    const config = recommended({ path: '/custom/path' });
    for (const [name, entry] of Object.entries(config.rules)) {
      const [, options] = entry as [string, { path: string }];
      expect(options, `${name} options`).toEqual({ path: '/custom/path' });
    }
  });

  test('declares plugins.webq pointing at the plugin object', () => {
    const config = recommended({ path: '/p' });
    expect(config.plugins.webq).toBe(plugin);
  });

  test('severities match expected error/warn groupings', () => {
    const config = recommended({ path: '/p' });
    const errorRules = [
      'no-unknown-element',
      'no-unknown-attr',
      'no-unknown-attr-value',
      'no-unknown-event',
      'no-unknown-command',
      'no-unknown-slot',
      'no-unknown-css-part',
      'no-unknown-css-custom-property',
      'no-missing-required-child',
      'no-missing-sibling-binding'
    ];
    const rulesMap = config.rules as unknown as Record<string, readonly [string, unknown]>;
    for (const name of errorRules) {
      const entry = rulesMap[`webq/${name}`];
      expect(entry[0], `${name} severity`).toBe('error');
    }
  });
});
