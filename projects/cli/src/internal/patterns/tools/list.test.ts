import { describe, test, expect } from 'bun:test';
import { Store } from '../../elements/store.js';
import { parseManifestFromString } from '../../elements/parser.js';
import { PatternStore } from '../store.js';
import type { ToolContext } from '../../tools.js';
import type { PatternsFile } from '../types.js';
import * as patternList from './list.js';

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

describe('patternList', () => {
  test('toJSON returns patterns array', () => {
    const result = patternList.toJSON(makeCtx()) as { patterns: { name: string }[] };
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0].name).toBe('form-field');
  });

  test('toJSON returns empty when no store', () => {
    const result = patternList.toJSON(makeCtx(false)) as { patterns: unknown[] };
    expect(result.patterns).toEqual([]);
  });

  test('toMarkdown returns formatted list', () => {
    const md = patternList.toMarkdown(makeCtx());
    expect(md).toContain('form-field');
    expect(md).toContain('Patterns');
  });

  test('toMarkdown returns message when no store', () => {
    const md = patternList.toMarkdown(makeCtx(false));
    expect(md).toContain('No custom-patterns.json found');
  });
});
