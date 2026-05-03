import { describe, test, expect } from 'bun:test';
import { Store } from '../../elements/store.js';
import { parseManifestFromString } from '../../elements/parser.js';
import { CustomStyleStore } from '../store.js';
import type { ToolContext } from '../../tools.js';
import type { CustomStylesFile } from '../types.js';
import * as stylePropertyGet from './get.js';

const emptyManifest = '{"schemaVersion":"1.0.0","modules":[]}';

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
      }
    ]
  };
}

function makeCtx(withStyles = true): ToolContext {
  return {
    store: new Store(parseManifestFromString(emptyManifest)),
    customStyleStore: withStyles ? new CustomStyleStore(makeStylesFile()) : undefined
  };
}

describe('stylePropertyGet', () => {
  test('toJSON returns property details', () => {
    const result = stylePropertyGet.toJSON(makeCtx(), { name: '--bp-color-blue-0' }) as {
      name: string;
      type: string;
      description: string;
    };
    expect(result.name).toBe('--bp-color-blue-0');
    expect(result.type).toBe('color');
    expect(result.description).toBe('Blue seed hue');
  });

  test('toJSON throws for unknown property', () => {
    expect(() => stylePropertyGet.toJSON(makeCtx(), { name: '--nonexistent' })).toThrow(
      'CSS custom property "--nonexistent" not found'
    );
  });

  test('toJSON throws when no store', () => {
    expect(() => stylePropertyGet.toJSON(makeCtx(false), { name: '--bp-color-blue-0' })).toThrow(
      'No CSS custom properties found'
    );
  });

  test('toMarkdown returns formatted property', () => {
    const md = stylePropertyGet.toMarkdown(makeCtx(), { name: '--bp-color-blue-0' });
    expect(md).toContain('--bp-color-blue-0');
    expect(md).toContain('Blue seed hue');
  });

  test('toMarkdown throws for unknown property', () => {
    expect(() => stylePropertyGet.toMarkdown(makeCtx(), { name: '--nonexistent' })).toThrow(
      'CSS custom property "--nonexistent" not found'
    );
  });
});
