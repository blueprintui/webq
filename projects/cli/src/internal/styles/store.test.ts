import { describe, test, expect } from 'bun:test';
import { CustomStyleStore } from './store.js';
import type { CustomStylesFile } from './types.js';

function makeStylesFile(): CustomStylesFile {
  return {
    schemaVersion: '1.0.0',
    cssCustomProperties: [
      {
        name: '--bp-color-blue-0',
        value: 'oklch(0.62 0.2 265)',
        type: 'color',
        description: 'Blue seed hue',
        tags: ['color']
      },
      {
        name: '--bp-spacing-sm',
        value: '8px',
        type: 'length',
        description: 'Small spacing'
      }
    ]
  };
}

describe('CustomStyleStore', () => {
  test('getCSSCustomProperties returns all properties sorted by name', () => {
    const store = new CustomStyleStore(makeStylesFile());
    const props = store.getCSSCustomProperties();
    expect(props.length).toBe(2);
    expect(props[0].name).toBe('--bp-color-blue-0');
    expect(props[1].name).toBe('--bp-spacing-sm');
  });

  test('getCSSCustomProperty returns property by name', () => {
    const store = new CustomStyleStore(makeStylesFile());
    const prop = store.getCSSCustomProperty('--bp-color-blue-0');
    expect(prop).toBeDefined();
    expect(prop?.name).toBe('--bp-color-blue-0');
    expect(prop?.type).toBe('color');
  });

  test('getCSSCustomProperty returns undefined for unknown name', () => {
    const store = new CustomStyleStore(makeStylesFile());
    expect(store.getCSSCustomProperty('--nonexistent')).toBeUndefined();
  });

  test('empty styles file', () => {
    const store = new CustomStyleStore({ schemaVersion: '1.0.0', cssCustomProperties: [] });
    expect(store.getCSSCustomProperties()).toEqual([]);
    expect(store.getCSSCustomProperty('anything')).toBeUndefined();
  });
});
