import { describe, test, expect } from 'bun:test';
import { resolve, CustomAttributesFilename } from './resolver.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata');

describe('attributes resolver', () => {
  test('finds custom-attributes.json in testdata', async () => {
    const result = await resolve(testdataPath);
    expect(result).toBe(join(testdataPath, CustomAttributesFilename));
  });

  test('returns empty string for directory without attributes file', async () => {
    const result = await resolve(join(testdataPath, '..', 'src'));
    expect(result).toBe('');
  });

  test('returns empty string for non-existent directory', async () => {
    const result = await resolve(join(testdataPath, 'no-such-dir'));
    expect(result).toBe('');
  });
});
