import { describe, test, expect } from 'bun:test';
import { resolve, CustomAttributesFilename } from './resolver.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata');

describe('attributes resolver', () => {
  test('finds custom-attributes.json in testdata', async () => {
    const result = await resolve(testdataPath);
    expect(result).toContain(join(testdataPath, CustomAttributesFilename));
  });

  test('walks recursively', async () => {
    const result = await resolve(join(testdataPath, '..'));
    expect(result.some(p => p.endsWith(CustomAttributesFilename))).toBe(true);
  });

  test('returns empty array for directory without attributes file', async () => {
    const result = await resolve(join(testdataPath, '..', 'src', 'internal', 'config'));
    expect(result).toEqual([]);
  });

  test('returns empty array for non-existent directory', async () => {
    const result = await resolve(join(testdataPath, 'no-such-dir'));
    expect(result).toEqual([]);
  });
});
