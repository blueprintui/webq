import { describe, test, expect } from 'bun:test';
import { Store } from '../../elements/store.js';
import { parseManifestFromString } from '../../elements/parser.js';
import { CustomAttributeStore } from '../store.js';
import type { ToolContext } from '../../tools.js';
import type { CustomAttributesFile } from '../types.js';
import * as attributeList from './list.js';

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

describe('attributeList', () => {
  test('toJSON returns attributes array', () => {
    const result = attributeList.toJSON(makeCtx()) as { attributes: { name: string }[] };
    expect(result.attributes).toHaveLength(1);
    expect(result.attributes[0].name).toBe('bp-layout');
  });

  test('toJSON returns empty when no store', () => {
    const result = attributeList.toJSON(makeCtx(false)) as { attributes: unknown[] };
    expect(result.attributes).toEqual([]);
  });

  test('toMarkdown returns formatted list', () => {
    const md = attributeList.toMarkdown(makeCtx());
    expect(md).toContain('bp-layout');
    expect(md).toContain('Custom Attributes');
  });

  test('toMarkdown returns message when no store', () => {
    const md = attributeList.toMarkdown(makeCtx(false));
    expect(md).toContain('No custom-attributes.json found');
  });
});
