import { describe, test, expect } from 'bun:test';
import { join } from 'path';
import { resolve, DTCGTokensFilename } from './resolver.js';

const testdataPath = join(import.meta.dir, '../../../testdata');

describe('dtcg resolver', () => {
  test('finds tokens.json in testdata', async () => {
    const result = await resolve(testdataPath);
    expect(result).toContain(join(testdataPath, DTCGTokensFilename));
  });

  test('walks recursively', async () => {
    const result = await resolve(join(testdataPath, '..'));
    expect(result.some(p => p.endsWith(DTCGTokensFilename))).toBe(true);
  });

  test('returns empty array for directory without tokens file', async () => {
    const result = await resolve(join(testdataPath, '..', 'src', 'internal', 'config'));
    expect(result).toEqual([]);
  });

  test('returns empty array for non-existent directory', async () => {
    const result = await resolve(join(testdataPath, 'no-such-dir'));
    expect(result).toEqual([]);
  });
});
