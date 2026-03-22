import { describe, test, expect } from 'bun:test';
import { resolve, PatternsFilename } from './resolver.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata');

describe('patterns resolver', () => {
  test('finds custom-patterns.json in testdata', async () => {
    const result = await resolve(testdataPath);
    expect(result).toBe(join(testdataPath, PatternsFilename));
  });

  test('returns empty string for directory without patterns file', async () => {
    const result = await resolve(join(testdataPath, '..', 'src'));
    expect(result).toBe('');
  });

  test('returns empty string for non-existent directory', async () => {
    const result = await resolve(join(testdataPath, 'no-such-dir'));
    expect(result).toBe('');
  });
});
