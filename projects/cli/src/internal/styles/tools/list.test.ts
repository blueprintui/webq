import { describe, test, expect } from 'bun:test';
import { Store } from '../../elements/store.js';
import { parseManifestFromString } from '../../elements/parser.js';
import { CustomStyleStore } from '../store.js';
import type { ToolContext } from '../../tools.js';
import type { CustomStylesFile } from '../types.js';
import * as stylePropertyList from './list.js';

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

describe('stylePropertyList', () => {
  test('toJSON returns properties array', () => {
    const result = stylePropertyList.toJSON(makeCtx()) as { properties: { name: string }[] };
    expect(result.properties).toHaveLength(1);
    expect(result.properties[0].name).toBe('--bp-color-blue-0');
  });

  test('toJSON returns empty when no store', () => {
    const result = stylePropertyList.toJSON(makeCtx(false)) as { properties: unknown[] };
    expect(result.properties).toEqual([]);
  });

  test('toMarkdown returns formatted list', () => {
    const md = stylePropertyList.toMarkdown(makeCtx());
    expect(md).toContain('--bp-color-blue-0');
    expect(md).toContain('CSS Custom Properties');
  });

  test('toMarkdown returns message when no store', () => {
    const md = stylePropertyList.toMarkdown(makeCtx(false));
    expect(md).toContain('No CSS custom properties found');
    expect(md).toContain('custom-styles.json');
    expect(md).toContain('tokens.json');
  });
});
