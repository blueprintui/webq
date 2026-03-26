import { describe, test, expect } from 'bun:test';
import { parseCustomStyles } from './parser.js';
import { join } from 'path';

const testdataPath = join(import.meta.dir, '../../../testdata');

describe('parseCustomStyles', () => {
  test('parses custom styles file', async () => {
    const result = await parseCustomStyles(join(testdataPath, 'custom-styles.json'));
    expect(result.schemaVersion).toBeDefined();
    expect(result.cssCustomProperties).toBeInstanceOf(Array);
    expect(result.cssCustomProperties.length).toBeGreaterThan(0);
  });

  test('throws for nonexistent file', async () => {
    await expect(parseCustomStyles('/nonexistent/custom-styles.json')).rejects.toThrow();
  });
});
