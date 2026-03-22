import { describe, test, expect } from 'bun:test';
import { load } from './load.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata');

describe('load', () => {
  test('loads and converts tokens from file', async () => {
    const result = await load(join(testdataPath, 'tokens.json'));
    expect(result).toBeDefined();
    const csf = result as NonNullable<typeof result>;
    expect(csf.schemaVersion).toBe('1.0.0');
    expect(csf.cssCustomProperties.length).toBeGreaterThan(0);
    expect(csf.cssCustomProperties.some(p => p.name === '--spacing-sm')).toBe(true);
  });

  test('returns undefined for nonexistent file', async () => {
    const result = await load('/nonexistent/tokens.json');
    expect(result).toBeUndefined();
  });

  test('throws for malformed JSON', async () => {
    const badPath = join(import.meta.dir, '../../../README.md');
    await expect(load(badPath)).rejects.toThrow();
  });
});
