import { describe, test, expect } from 'bun:test';
import { parsePatterns } from './parser.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata/custom-patterns.json');

describe('parsePatterns', () => {
  test('parses patterns file from disk', async () => {
    const pf = await parsePatterns(testdataPath);
    expect(pf.schemaVersion).toBe('1.0.0');
    expect(pf.patterns.length).toBeGreaterThan(0);
  });

  test('normalizes string root to ElementRef', async () => {
    const pf = await parsePatterns(testdataPath);
    const pattern = pf.patterns.find(p => p.name === 'form-field');
    expect(pattern).toBeDefined();
    expect(pattern?.structure.root).toEqual({ tag: 'bp-field' });
  });

  test('normalizes string children elements to ElementRef', async () => {
    const pf = await parsePatterns(testdataPath);
    const pattern = pf.patterns.find(p => p.name === 'form-field');
    const children = pattern?.structure.children ?? [];
    const labelChild = children.find(c => c.element?.tag === 'label');
    expect(labelChild).toBeDefined();
    expect(labelChild?.element).toEqual({ tag: 'label' });
  });

  test('normalizes string options to ElementRef array', async () => {
    const pf = await parsePatterns(testdataPath);
    const pattern = pf.patterns.find(p => p.name === 'form-field');
    const children = pattern?.structure.children ?? [];
    const oneOfChild = children.find(c => c.rule === 'oneOf');
    expect(oneOfChild).toBeDefined();
    expect(oneOfChild?.options?.length).toBeGreaterThan(0);
    expect(oneOfChild?.options?.[0]).toHaveProperty('tag');
  });

  test('throws for nonexistent file', async () => {
    await expect(parsePatterns('/nonexistent/path.json')).rejects.toThrow();
  });
});
