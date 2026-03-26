import { describe, test, expect } from 'bun:test';
import { Store } from '../../elements/store.js';
import { parseManifestFromString } from '../../elements/parser.js';
import { CustomAttributeStore } from '../store.js';
import type { ToolContext } from '../../tools.js';
import type { CustomAttributesFile } from '../types.js';
import * as attributeGet from './get.js';

const emptyManifest = '{"schemaVersion":"1.0.0","modules":[]}';

function makeAttributesFile(): CustomAttributesFile {
  return {
    schemaVersion: '1.0.0',
    attributes: [
      {
        name: 'bp-layout',
        description: 'Layout utility',
        syntax: 'token-list',
        tags: ['layout']
      }
    ]
  };
}

function makeCtx(withAttrs = true): ToolContext {
  return {
    store: new Store(parseManifestFromString(emptyManifest)),
    customAttrStore: withAttrs ? new CustomAttributeStore(makeAttributesFile()) : undefined
  };
}

describe('attributeGet', () => {
  test('toJSON returns attribute details', () => {
    const result = attributeGet.toJSON(makeCtx(), { name: 'bp-layout' }) as {
      name: string;
      description: string;
      syntax: string;
    };
    expect(result.name).toBe('bp-layout');
    expect(result.description).toBe('Layout utility');
    expect(result.syntax).toBe('token-list');
  });

  test('toJSON throws for unknown attribute', () => {
    expect(() => attributeGet.toJSON(makeCtx(), { name: 'bp-unknown' })).toThrow(
      'Custom attribute "bp-unknown" not found'
    );
  });

  test('toJSON throws when no store', () => {
    expect(() => attributeGet.toJSON(makeCtx(false), { name: 'bp-layout' })).toThrow(
      'No custom attributes file loaded'
    );
  });

  test('toMarkdown returns formatted attribute', () => {
    const md = attributeGet.toMarkdown(makeCtx(), { name: 'bp-layout' });
    expect(md).toContain('bp-layout');
    expect(md).toContain('Layout utility');
  });

  test('toMarkdown throws for unknown attribute', () => {
    expect(() => attributeGet.toMarkdown(makeCtx(), { name: 'bp-unknown' })).toThrow(
      'Custom attribute "bp-unknown" not found'
    );
  });
});
