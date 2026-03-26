import { describe, test, expect } from 'bun:test';
import { PatternStore } from './store.js';
import type { PatternsFile } from './types.js';

function makePatternsFile(): PatternsFile {
  return {
    schemaVersion: '1.0.0',
    patterns: [
      {
        name: 'form-field',
        description: 'A form field pattern',
        tags: ['form'],
        structure: {
          root: { tag: 'bp-field' },
          children: [
            { rule: 'required', element: { tag: 'label' } },
            { rule: 'oneOf', options: [{ tag: 'bp-input' }, { tag: 'bp-select' }] }
          ]
        }
      },
      {
        name: 'dialog',
        description: 'A dialog pattern',
        tags: ['overlay'],
        structure: {
          root: { tag: 'bp-dialog' },
          siblings: [{ trigger: { tag: 'bp-button' }, target: { tag: 'bp-dialog' }, bindings: [] }]
        }
      }
    ]
  };
}

describe('PatternStore', () => {
  test('getPatterns returns all patterns sorted by name', () => {
    const store = new PatternStore(makePatternsFile());
    const patterns = store.getPatterns();
    expect(patterns.length).toBe(2);
    expect(patterns[0].name).toBe('dialog');
    expect(patterns[1].name).toBe('form-field');
  });

  test('getPattern returns pattern by name', () => {
    const store = new PatternStore(makePatternsFile());
    const pattern = store.getPattern('form-field');
    expect(pattern).toBeDefined();
    expect(pattern?.name).toBe('form-field');
    expect(pattern?.structure.root?.tag).toBe('bp-field');
  });

  test('getPattern returns undefined for unknown pattern', () => {
    const store = new PatternStore(makePatternsFile());
    expect(store.getPattern('nonexistent')).toBeUndefined();
  });

  test('getPatternsForElement finds patterns by root tag', () => {
    const store = new PatternStore(makePatternsFile());
    const patterns = store.getPatternsForElement('bp-field');
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('form-field');
  });

  test('getPatternsForElement finds patterns by child element tag', () => {
    const store = new PatternStore(makePatternsFile());
    const patterns = store.getPatternsForElement('bp-input');
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('form-field');
  });

  test('getPatternsForElement finds patterns by child options tag', () => {
    const store = new PatternStore(makePatternsFile());
    const patterns = store.getPatternsForElement('bp-select');
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('form-field');
  });

  test('getPatternsForElement finds patterns by sibling trigger', () => {
    const store = new PatternStore(makePatternsFile());
    const patterns = store.getPatternsForElement('bp-button');
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('dialog');
  });

  test('getPatternsForElement finds patterns by sibling target', () => {
    const store = new PatternStore(makePatternsFile());
    const patterns = store.getPatternsForElement('bp-dialog');
    expect(patterns.length).toBe(1);
    expect(patterns[0].name).toBe('dialog');
  });

  test('getPatternsForElement returns empty for unknown tag', () => {
    const store = new PatternStore(makePatternsFile());
    expect(store.getPatternsForElement('bp-unknown')).toEqual([]);
  });

  test('empty patterns file', () => {
    const store = new PatternStore({ schemaVersion: '1.0.0', patterns: [] });
    expect(store.getPatterns()).toEqual([]);
    expect(store.getPattern('anything')).toBeUndefined();
    expect(store.getPatternsForElement('bp-button')).toEqual([]);
  });
});
