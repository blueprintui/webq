import { describe, test, expect } from 'bun:test';
import { resolve, CustomStylesFilename } from './resolver.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata');

describe('styles resolver', () => {
  test('finds custom-styles.json in testdata', async () => {
    const result = await resolve(testdataPath);
    expect(result).toBe(join(testdataPath, CustomStylesFilename));
  });

  test('returns empty string for directory without styles file', async () => {
    const result = await resolve(join(testdataPath, '..', 'src'));
    expect(result).toBe('');
  });

  test('returns empty string for non-existent directory', async () => {
    const result = await resolve(join(testdataPath, 'no-such-dir'));
    expect(result).toBe('');
  });
});
