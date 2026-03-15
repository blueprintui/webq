import { describe, test, expect } from 'bun:test';
import { CustomAttributeStore } from './store.js';
import type { CustomAttributesFile } from './types.js';

function makeAttributesFile(): CustomAttributesFile {
  return {
    schemaVersion: '1.0.0',
    attributes: [
      {
        name: 'bp-layout',
        description: 'Layout utility attribute',
        syntax: 'token-list',
        tags: ['layout']
      },
      {
        name: 'bp-text',
        description: 'Text utility attribute',
        syntax: 'token-list',
        tags: ['typography']
      }
    ]
  };
}

describe('CustomAttributeStore', () => {
  test('getCustomAttributes returns all attributes sorted by name', () => {
    const store = new CustomAttributeStore(makeAttributesFile());
    const attrs = store.getCustomAttributes();
    expect(attrs.length).toBe(2);
    expect(attrs[0].name).toBe('bp-layout');
    expect(attrs[1].name).toBe('bp-text');
  });

  test('getCustomAttribute returns attribute by name', () => {
    const store = new CustomAttributeStore(makeAttributesFile());
    const attr = store.getCustomAttribute('bp-layout');
    expect(attr).toBeDefined();
    expect(attr?.name).toBe('bp-layout');
    expect(attr?.description).toBe('Layout utility attribute');
  });

  test('getCustomAttribute returns undefined for unknown name', () => {
    const store = new CustomAttributeStore(makeAttributesFile());
    expect(store.getCustomAttribute('bp-nonexistent')).toBeUndefined();
  });

  test('empty attributes file', () => {
    const store = new CustomAttributeStore({ schemaVersion: '1.0.0', attributes: [] });
    expect(store.getCustomAttributes()).toEqual([]);
    expect(store.getCustomAttribute('anything')).toBeUndefined();
  });
});
