import { describe, test, expect } from 'bun:test';
import { parseCustomAttributes } from './parser.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata/custom-attributes.json');

describe('parseCustomAttributes', () => {
  test('parses attributes file from disk', async () => {
    const caf = await parseCustomAttributes(testdataPath);
    expect(caf.schemaVersion).toBe('1.0.0');
    expect(caf.attributes.length).toBeGreaterThan(0);
  });

  test('normalizes appliesTo wildcard to { all: true }', async () => {
    const caf = await parseCustomAttributes(testdataPath);
    const attr = caf.attributes.find(a => a.name === 'bp-layout');
    expect(attr?.appliesTo).toEqual({ all: true, elements: [] });
  });

  test('normalizes token values', async () => {
    const caf = await parseCustomAttributes(testdataPath);
    const attr = caf.attributes.find(a => a.name === 'bp-layout');
    expect(attr?.tokenGroups).toBeDefined();
    const typeGroup = attr?.tokenGroups?.find(g => g.name === 'type');
    expect(typeGroup?.values).toBeDefined();
    expect(typeGroup?.values?.[0]).toHaveProperty('value');
  });

  test('throws for nonexistent file', async () => {
    await expect(parseCustomAttributes('/nonexistent/path.json')).rejects.toThrow();
  });
});
