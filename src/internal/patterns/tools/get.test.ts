import { describe, test, expect } from 'bun:test';
import { Store } from '../../elements/store.js';
import { parseManifestFromString } from '../../elements/parser.js';
import { PatternStore } from '../store.js';
import type { ToolContext } from '../../tools.js';
import type { PatternsFile } from '../types.js';
import * as patternGet from './get.js';

const emptyManifest = '{"schemaVersion":"1.0.0","modules":[]}';

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
          children: [{ rule: 'required', element: { tag: 'label' } }]
        },
        examples: [{ name: 'Basic', html: '<bp-field><label>Name</label></bp-field>' }]
      }
    ]
  };
}

function makeCtx(withPatterns = true): ToolContext {
  return {
    store: new Store(parseManifestFromString(emptyManifest)),
    patternStore: withPatterns ? new PatternStore(makePatternsFile()) : undefined
  };
}

describe('patternGet', () => {
  test('toJSON returns pattern details', () => {
    const result = patternGet.toJSON(makeCtx(), { name: 'form-field' }) as { name: string; description: string };
    expect(result.name).toBe('form-field');
    expect(result.description).toBe('A form field pattern');
  });

  test('toJSON throws for unknown pattern', () => {
    expect(() => patternGet.toJSON(makeCtx(), { name: 'nonexistent' })).toThrow('Pattern "nonexistent" not found');
  });

  test('toJSON throws when no store', () => {
    expect(() => patternGet.toJSON(makeCtx(false), { name: 'form-field' })).toThrow('No patterns file loaded');
  });

  test('toMarkdown returns formatted pattern', () => {
    const md = patternGet.toMarkdown(makeCtx(), { name: 'form-field' });
    expect(md).toContain('form-field');
    expect(md).toContain('Structure');
  });

  test('toMarkdown throws for unknown pattern', () => {
    expect(() => patternGet.toMarkdown(makeCtx(), { name: 'nonexistent' })).toThrow('Pattern "nonexistent" not found');
  });
});
