import { describe, test, expect } from 'bun:test';
import { parseCustomAttributes } from './parser.js';
import { parseAppliesTo, parseTokenValue } from './types.js';
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

  test('normalizes missing appliesTo to default', async () => {
    const tmpPath = join(import.meta.dir, '../../../testdata/.tmp-attrs-test.json');
    const { writeFile, unlink } = await import('fs/promises');
    const data = JSON.stringify({
      schemaVersion: '1.0.0',
      attributes: [{ name: 'bp-test', description: 'Test attr' }]
    });
    await writeFile(tmpPath, data);
    try {
      const caf = await parseCustomAttributes(tmpPath);
      expect(caf.attributes[0].appliesTo).toEqual({ all: false, elements: [] });
    } finally {
      await unlink(tmpPath);
    }
  });

  test('throws for nonexistent file', async () => {
    await expect(parseCustomAttributes('/nonexistent/path.json')).rejects.toThrow();
  });
});

describe('parseAppliesTo', () => {
  test('parses wildcard string', () => {
    expect(parseAppliesTo('*')).toEqual({ all: true, elements: [] });
  });

  test('parses array of elements', () => {
    expect(parseAppliesTo(['bp-button', 'bp-card'])).toEqual({ all: false, elements: ['bp-button', 'bp-card'] });
  });

  test('passes through object with all property', () => {
    const obj = { all: true, elements: [] };
    expect(parseAppliesTo(obj)).toEqual({ all: true, elements: [] });
  });

  test('returns default for unknown input', () => {
    expect(parseAppliesTo(42)).toEqual({ all: false, elements: [] });
  });
});

describe('parseTokenValue', () => {
  test('wraps string into TokenValue', () => {
    expect(parseTokenValue('block')).toEqual({ value: 'block' });
  });

  test('passes through object', () => {
    const obj = { value: 'block', description: 'Vertical' };
    expect(parseTokenValue(obj)).toEqual({ value: 'block', description: 'Vertical' });
  });
});
