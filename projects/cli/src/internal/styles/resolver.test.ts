import { describe, test, expect } from 'bun:test';
import { resolve, CustomStylesFilename } from './resolver.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata');

describe('styles resolver', () => {
  test('finds custom-styles.json in testdata', async () => {
    const result = await resolve(testdataPath);
    expect(result).toContain(join(testdataPath, CustomStylesFilename));
  });

  test('walks recursively', async () => {
    const result = await resolve(join(testdataPath, '..'));
    expect(result.some(p => p.endsWith(CustomStylesFilename))).toBe(true);
  });

  test('returns empty array for directory without styles file', async () => {
    const result = await resolve(join(testdataPath, '..', 'src', 'internal', 'config'));
    expect(result).toEqual([]);
  });

  test('returns empty array for non-existent directory', async () => {
    const result = await resolve(join(testdataPath, 'no-such-dir'));
    expect(result).toEqual([]);
  });
});
